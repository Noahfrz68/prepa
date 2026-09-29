import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { db } from './queries'
import { libelleSection } from './planification'

/*
 * Import des figures (logique figurée) : l'image extraite du PDF est écrite
 * dans data/media/ et rattachée à l'item. Séparé de contenu.ts parce que
 * c'est la seule partie de l'atelier qui touche au disque : le reste tourne
 * aussi dans le navigateur (version iPhone).
 */

/**
 * Insère des questions dont l'énoncé est une figure.
 *
 * L'image est stockée comme un média et rattachée à l'item. Une figure sans
 * image n'est pas insérée : un item sans énoncé ni visuel serait inutilisable.
 */
export function insererFigures(
  figures: Array<{
    section: string
    numero: number
    options: string[]
    bonneReponse?: string
    explication?: string
  }>,
  images: Map<string, { png: Buffer; largeur: number; hauteur: number }>,
  examId = 'tagemage',
): { inseres: number; sansImage: number; doublons: number } {
  const d = db()
  const dossier = path.join(process.cwd(), 'data', 'media')
  fs.mkdirSync(dossier, { recursive: true })

  const existe = d.prepare(
    `SELECT 1 FROM item WHERE exam_id = ? AND section = ? AND enonce = ? LIMIT 1`,
  )
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
    for (const f of figures) {
      const image = images.get(`${f.section}#${f.numero}`)
      if (!image) {
        sansImage++
        continue
      }

      // L'énoncé textuel n'existe pas : on en fabrique un repère lisible, qui
      // sert aussi de clé de doublon.
      const enonce = `Figure — ${libelleSection(f.section)}, question ${f.numero}`
      if (existe.get(examId, f.section, enonce)) {
        doublons++
        continue
      }

      const hash = createHash('sha256')
        .update(image.png)
        .digest('hex')
        .slice(0, 32)
      const nom = `figure-${hash}.png`
      fs.writeFileSync(path.join(dossier, nom), image.png)

      let mediaId: number
      const dejaLa = d.prepare(`SELECT id FROM media WHERE hash_script = ?`).get(hash) as
        | { id: number }
        | undefined

      if (dejaLa) {
        mediaId = dejaLa.id
      } else {
        mediaId = Number(insererMedia.run(`media/${nom}`, enonce, hash).lastInsertRowid)
      }

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
