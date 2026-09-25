import { inflateRawSync } from 'node:zlib'
import { ErreurRequete } from '@/core/erreurs'

/**
 * Lecteur d'archives ZIP minimal.
 *
 * Node ne sait pas lire un ZIP, et ajouter une dépendance pour parcourir un
 * répertoire central de quelques dizaines d'entrées serait disproportionné.
 * On lit donc l'archive à la main : c'est un format simple et figé depuis
 * trente ans, et cela n'expose l'application à aucun code tiers.
 *
 * Ne gère que ce dont on a besoin : les entrées non chiffrées, stockées telles
 * quelles (méthode 0) ou compressées en deflate (méthode 8). Tout le reste est
 * signalé plutôt qu'ignoré en silence.
 */

const SIGNATURE_FIN_CENTRAL = 0x06054b50
const SIGNATURE_ENTREE_CENTRAL = 0x02014b50
const SIGNATURE_ENTETE_LOCAL = 0x04034b50

export interface FichierZip {
  nom: string
  contenu: Buffer
}

/** Retrouve la fin du répertoire central, en partant de la fin de l'archive. */
function positionFinCentral(donnees: Buffer): number {
  // Le commentaire d'archive peut faire jusqu'à 65 535 octets : au-delà, il ne
  // s'agit plus d'un ZIP lisible par ce format d'en-tête.
  const debut = Math.max(0, donnees.length - 65_535 - 22)
  for (let i = donnees.length - 22; i >= debut; i--) {
    if (donnees.readUInt32LE(i) === SIGNATURE_FIN_CENTRAL) return i
  }
  return -1
}

export function lireZip(donnees: Buffer): { fichiers: FichierZip[]; avertissements: string[] } {
  const avertissements: string[] = []
  const fichiers: FichierZip[] = []

  const fin = positionFinCentral(donnees)
  if (fin < 0) throw new ErreurRequete('Archive illisible : répertoire central introuvable.')

  const nbEntrees = donnees.readUInt16LE(fin + 10)
  let position = donnees.readUInt32LE(fin + 16)

  for (let n = 0; n < nbEntrees; n++) {
    if (donnees.readUInt32LE(position) !== SIGNATURE_ENTREE_CENTRAL) {
      throw new ErreurRequete(`Archive corrompue : entrée ${n + 1} illisible.`)
    }

    const methode = donnees.readUInt16LE(position + 10)
    const drapeaux = donnees.readUInt16LE(position + 8)
    const tailleCompressee = donnees.readUInt32LE(position + 20)
    const longueurNom = donnees.readUInt16LE(position + 28)
    const longueurExtra = donnees.readUInt16LE(position + 30)
    const longueurCommentaire = donnees.readUInt16LE(position + 32)
    const decalageLocal = donnees.readUInt32LE(position + 42)

    const nom = donnees.toString('utf8', position + 46, position + 46 + longueurNom)
    position += 46 + longueurNom + longueurExtra + longueurCommentaire

    // Les répertoires n'ont pas de contenu ; le drapeau 0 indique le chiffrement.
    if (nom.endsWith('/')) continue
    if (drapeaux & 0x1) {
      avertissements.push(`${nom} est chiffré : entrée ignorée.`)
      continue
    }

    if (donnees.readUInt32LE(decalageLocal) !== SIGNATURE_ENTETE_LOCAL) {
      avertissements.push(`${nom} : en-tête local introuvable, entrée ignorée.`)
      continue
    }

    // L'en-tête local répète les longueurs de nom et d'extra, qui peuvent
    // différer de celles du répertoire central : ce sont celles-là qui donnent
    // la position réelle des données.
    const debutDonnees =
      decalageLocal + 30 + donnees.readUInt16LE(decalageLocal + 26) + donnees.readUInt16LE(decalageLocal + 28)
    const brut = donnees.subarray(debutDonnees, debutDonnees + tailleCompressee)

    if (methode === 0) {
      fichiers.push({ nom, contenu: Buffer.from(brut) })
    } else if (methode === 8) {
      try {
        fichiers.push({ nom, contenu: inflateRawSync(brut) })
      } catch (e) {
        avertissements.push(`${nom} : décompression impossible (${(e as Error).message}).`)
      }
    } else {
      avertissements.push(`${nom} : méthode de compression ${methode} non prise en charge.`)
    }
  }

  return { fichiers, avertissements }
}
