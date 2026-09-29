import { db } from './queries'
import { libelleSection } from './planification'
import { sha256Hex } from '@/core/audio/sha256'
import { ecrireFichier } from '@/core/fichiers/stockage'

/*
 * Import des figures (logique figurée) : l'image extraite du PDF est rangée
 * dans les fichiers de l'application (data/media/ sur le PC, le stockage du
 * téléphone sur l'iPhone) et rattachée à l'item.
 */

/**
 * Insère des questions dont l'énoncé est une figure.
 *
 * L'image est stockée comme un média et rattachée à l'item. Une figure sans
 * image n'est pas insérée : un item sans énoncé ni visuel serait inutilisable.
 *
 * Les fichiers sont écrits d'abord, puis les lignes en une transaction : un
 * fichier orphelin ne coûte rien (son nom est son hash, il sera réutilisé),
 * alors qu'un item pointant vers une image absente serait inutilisable.
 */
export async function insererFigures(
  figures: Array<{
    section: string
    numero: number
    options: string[]
    bonneReponse?: string
    explication?: string
  }>,
  images: Map<string, { png: Uint8Array; largeur: number; hauteur: number }>,
  examId = 'tagemage',
): Promise<{ inseres: number; sansImage: number; doublons: number }> {
  const d = db()

  const existe = d.prepare(
    `SELECT 1 FROM item WHERE exam_id = ? AND section = ? AND enonce = ? LIMIT 1`,
  )

  // L'énoncé textuel n'existe pas : on en fabrique un repère lisible, qui sert
  // aussi de clé de doublon.
  const aInserer = figures.map((f) => {
    const image = images.get(`${f.section}#${f.numero}`)
    const enonce = `Figure — ${libelleSection(f.section)}, question ${f.numero}`
    const hash = image ? sha256Hex(image.png).slice(0, 32) : null
    return { f, image, enonce, hash, chemin: hash ? `media/figure-${hash}.png` : null }
  })

  for (const a of aInserer) {
    if (a.image && a.chemin && !existe.get(examId, a.f.section, a.enonce)) {
      await ecrireFichier(a.chemin, a.image.png)
    }
  }

  const insererMedia = d.prepare(
    `INSERT INTO media (type, chemin_fichier, transcript, hash_script) VALUES ('image', ?, ?, ?)`,
  )
  const insererItem = d.prepare(`
    INSERT INTO item
      (exam_id, section, type_item, enonce, options, bonne_reponse,
       explication_reference, source, statut, media_id, tags)
    VALUES (@exam, @section, 'qcm', @enonce, @options, @bonne, @explication,
            'importe', 'a_relire', @media, 'annale')
  `)

  let inseres = 0
  let sansImage = 0
  let doublons = 0

  const tout = d.transaction(() => {
    for (const { f, image, enonce, hash, chemin } of aInserer) {
      if (!image || !hash || !chemin) {
        sansImage++
        continue
      }
      if (existe.get(examId, f.section, enonce)) {
        doublons++
        continue
      }

      const dejaLa = d.prepare(`SELECT id FROM media WHERE hash_script = ?`).get(hash) as
        | { id: number }
        | undefined
      const mediaId = dejaLa ? dejaLa.id : Number(insererMedia.run(chemin, enonce, hash).lastInsertRowid)

      insererItem.run({
        exam: examId,
        section: f.section,
        enonce,
        options: JSON.stringify(f.options),
        bonne: f.bonneReponse ?? '',
        explication: f.explication ?? null,
        media: mediaId,
      })
      inseres++
    }
  })

  tout()
  return { inseres, sansImage, doublons }
}
