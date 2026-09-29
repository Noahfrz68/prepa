import { ErreurRequete } from '@/core/erreurs'

/**
 * Lecteur (et écrivain, pour la synchronisation) d'archives ZIP minimal.
 *
 * Ni Node ni le navigateur ne savent lire un ZIP, et ajouter une dépendance
 * pour parcourir un répertoire central de quelques dizaines d'entrées serait
 * disproportionné. On lit donc l'archive à la main : c'est un format simple et
 * figé depuis trente ans, et cela n'expose l'application à aucun code tiers.
 *
 * Ne gère que ce dont on a besoin : les entrées non chiffrées, stockées telles
 * quelles (méthode 0) ou compressées en deflate (méthode 8). Tout le reste est
 * signalé plutôt qu'ignoré en silence.
 *
 * Écrit sur les API communes au PC et à l'iPhone : octets bruts, DataView, et
 * `DecompressionStream` pour le deflate (Node ≥ 21, Safari ≥ 16.4).
 */

const SIGNATURE_FIN_CENTRAL = 0x06054b50
const SIGNATURE_ENTREE_CENTRAL = 0x02014b50
const SIGNATURE_ENTETE_LOCAL = 0x04034b50

export interface FichierZip {
  nom: string
  contenu: Uint8Array
}

/** Retrouve la fin du répertoire central, en partant de la fin de l'archive. */
function positionFinCentral(vue: DataView): number {
  // Le commentaire d'archive peut faire jusqu'à 65 535 octets : au-delà, il ne
  // s'agit plus d'un ZIP lisible par ce format d'en-tête.
  const debut = Math.max(0, vue.byteLength - 65_535 - 22)
  for (let i = vue.byteLength - 22; i >= debut; i--) {
    if (vue.getUint32(i, true) === SIGNATURE_FIN_CENTRAL) return i
  }
  return -1
}

async function inflate(brut: Uint8Array): Promise<Uint8Array> {
  const flux = new Blob([brut as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flux).arrayBuffer())
}

async function deflate(brut: Uint8Array): Promise<Uint8Array> {
  const flux = new Blob([brut as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flux).arrayBuffer())
}

let TABLE_CRC: Uint32Array | null = null

/** CRC-32 d'un contenu, exigé par le format pour chaque entrée. */
export function crc32(octets: Uint8Array): number {
  if (!TABLE_CRC) {
    TABLE_CRC = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      TABLE_CRC[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * Écrit une archive ZIP : chaque entrée compressée en deflate si on le
 * demande, stockée telle quelle sinon (une image PNG ou un audio ne gagnent
 * rien à l'être). Lisible par lireZip comme par n'importe quel outil.
 */
export async function ecrireZip(entrees: Array<{ nom: string; contenu: Uint8Array; compresser?: boolean }>): Promise<Uint8Array> {
  const texte = new TextEncoder()
  const morceaux: Uint8Array[] = []
  const centraux: Uint8Array[] = []
  let decalage = 0

  for (const e of entrees) {
    const nom = texte.encode(e.nom)
    const donnees = e.compresser ? await deflate(e.contenu) : e.contenu
    const methode = e.compresser ? 8 : 0
    const crc = crc32(e.contenu)

    const local = new Uint8Array(30 + nom.length)
    const vl = new DataView(local.buffer)
    vl.setUint32(0, SIGNATURE_ENTETE_LOCAL, true)
    vl.setUint16(4, 20, true) // version requise
    vl.setUint16(6, 0x0800, true) // noms en UTF-8
    vl.setUint16(8, methode, true)
    vl.setUint32(14, crc, true)
    vl.setUint32(18, donnees.length, true)
    vl.setUint32(22, e.contenu.length, true)
    vl.setUint16(26, nom.length, true)
    local.set(nom, 30)

    const central = new Uint8Array(46 + nom.length)
    const vc = new DataView(central.buffer)
    vc.setUint32(0, SIGNATURE_ENTREE_CENTRAL, true)
    vc.setUint16(4, 20, true)
    vc.setUint16(6, 20, true)
    vc.setUint16(8, 0x0800, true)
    vc.setUint16(10, methode, true)
    vc.setUint32(16, crc, true)
    vc.setUint32(20, donnees.length, true)
    vc.setUint32(24, e.contenu.length, true)
    vc.setUint16(28, nom.length, true)
    vc.setUint32(42, decalage, true)
    central.set(nom, 46)

    morceaux.push(local, donnees)
    centraux.push(central)
    decalage += local.length + donnees.length
  }

  const tailleCentral = centraux.reduce((n, c) => n + c.length, 0)
  const fin = new Uint8Array(22)
  const vf = new DataView(fin.buffer)
  vf.setUint32(0, SIGNATURE_FIN_CENTRAL, true)
  vf.setUint16(8, entrees.length, true)
  vf.setUint16(10, entrees.length, true)
  vf.setUint32(12, tailleCentral, true)
  vf.setUint32(16, decalage, true)

  const tout = new Uint8Array(decalage + tailleCentral + fin.length)
  let p = 0
  for (const m of [...morceaux, ...centraux, fin]) {
    tout.set(m, p)
    p += m.length
  }
  return tout
}

export async function lireZip(donnees: Uint8Array): Promise<{ fichiers: FichierZip[]; avertissements: string[] }> {
  const avertissements: string[] = []
  const fichiers: FichierZip[] = []
  const vue = new DataView(donnees.buffer, donnees.byteOffset, donnees.byteLength)
  const texte = new TextDecoder('utf-8')

  const fin = donnees.length >= 22 ? positionFinCentral(vue) : -1
  if (fin < 0) throw new ErreurRequete('Archive illisible : répertoire central introuvable.')

  const nbEntrees = vue.getUint16(fin + 10, true)
  let position = vue.getUint32(fin + 16, true)

  for (let n = 0; n < nbEntrees; n++) {
    if (position + 46 > donnees.length || vue.getUint32(position, true) !== SIGNATURE_ENTREE_CENTRAL) {
      throw new ErreurRequete(`Archive corrompue : entrée ${n + 1} illisible.`)
    }

    const methode = vue.getUint16(position + 10, true)
    const drapeaux = vue.getUint16(position + 8, true)
    const tailleCompressee = vue.getUint32(position + 20, true)
    const longueurNom = vue.getUint16(position + 28, true)
    const longueurExtra = vue.getUint16(position + 30, true)
    const longueurCommentaire = vue.getUint16(position + 32, true)
    const decalageLocal = vue.getUint32(position + 42, true)

    const nom = texte.decode(donnees.subarray(position + 46, position + 46 + longueurNom))
    position += 46 + longueurNom + longueurExtra + longueurCommentaire

    // Les répertoires n'ont pas de contenu ; le drapeau 0 indique le chiffrement.
    if (nom.endsWith('/')) continue
    if (drapeaux & 0x1) {
      avertissements.push(`${nom} est chiffré : entrée ignorée.`)
      continue
    }

    if (decalageLocal + 30 > donnees.length || vue.getUint32(decalageLocal, true) !== SIGNATURE_ENTETE_LOCAL) {
      avertissements.push(`${nom} : en-tête local introuvable, entrée ignorée.`)
      continue
    }

    // L'en-tête local répète les longueurs de nom et d'extra, qui peuvent
    // différer de celles du répertoire central : ce sont celles-là qui donnent
    // la position réelle des données.
    const debutDonnees =
      decalageLocal + 30 + vue.getUint16(decalageLocal + 26, true) + vue.getUint16(decalageLocal + 28, true)
    const brut = donnees.subarray(debutDonnees, debutDonnees + tailleCompressee)

    if (methode === 0) {
      fichiers.push({ nom, contenu: brut.slice() })
    } else if (methode === 8) {
      try {
        fichiers.push({ nom, contenu: await inflate(brut) })
      } catch (e) {
        avertissements.push(`${nom} : décompression impossible (${(e as Error).message}).`)
      }
    } else {
      avertissements.push(`${nom} : méthode de compression ${methode} non prise en charge.`)
    }
  }

  return { fichiers, avertissements }
}
