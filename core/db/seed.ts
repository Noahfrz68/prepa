import { getDb } from '@/core/db/client'
import { skillsTageMage } from '@/exams/tagemage'
import { skillsToeic } from '@/exams/toeic'

/**
 * Seed idempotent : la taxonomie et les lignes de configuration sont
 * réappliquées à chaque démarrage sans écraser les données de travail.
 */
export function seed(): { skills: number } {
  const db = getDb()

  const insererSkill = db.prepare(`
    INSERT INTO skill (id, exam_id, section, libelle, poids_examen, ordre)
    VALUES (@id, @exam_id, @section, @libelle, @poids_examen, @ordre)
    ON CONFLICT (id) DO UPDATE SET
      libelle      = excluded.libelle,
      section      = excluded.section,
      poids_examen = excluded.poids_examen,
      ordre        = excluded.ordre
  `)

  const skills = [...skillsTageMage(), ...skillsToeic()]

  const tout = db.transaction(() => {
    for (const s of skills) insererSkill.run(s)

    db.prepare(`INSERT OR IGNORE INTO user_profile (id) VALUES (1)`).run()

    db.prepare(`
      INSERT OR IGNORE INTO exam_goal (exam_id, date_provisoire, actif, motif)
      VALUES ('tagemage', 1, 1, 'Admissions parallèles')
    `).run()

    db.prepare(`
      INSERT OR IGNORE INTO exam_goal (exam_id, date_provisoire, actif, motif)
      VALUES ('toeic_lr', 1, 1, 'Certification exigée au dossier')
    `).run()
  })

  tout()
  return { skills: skills.length }
}
