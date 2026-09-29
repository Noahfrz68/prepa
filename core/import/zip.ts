import { ErreurRequete } from '@/core/erreurs'

/**
 * Lecteur d'archives ZIP minimal.
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
