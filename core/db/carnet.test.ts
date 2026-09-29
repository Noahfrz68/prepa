import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Base } from './base'
import { MOTEURS, baseDeTest } from './moteurs-test'

/**
 * Le carnet se teste sur une base en mémoire, remplie à la main.
 *
 * C'est la seule façon de vérifier les règles qui le gouvernent — un saut
 * compte comme une erreur, une réussite ne fait pas sortir du carnet, seul le
 * marquage explicite le fait — sans dépendre de l'historique réel de
 * l'utilisateur, qui changerait à chaque série. Sur les deux moteurs.
 */
describe.each(MOTEURS)('$nom', (moteur) => {
  let db: Base

  beforeAll(async () => {
    db = await baseDeTest(moteur)

    db.prepare(
      `INSERT INTO skill (id, exam_id, section, libelle, poids_examen, ordre)
       VALUES ('tm.calcul.pourcentages_et_variations', 'tagemage', 'calcul', 'pourcentages', 1, 1)`,
    ).run()

    const item = db.prepare(
      `INSERT INTO item (id, exam_id, section, skill_id, type_item, enonce, options, bonne_reponse,
                         explication_reference, diagnostics, source, statut)
       VALUES (?, 'tagemage', 'calcul', 'tm.calcul.pourcentages_et_variations', 'qcm', ?, ?, ?, ?, ?, 'genere', 'valide')`,
    )
    item.run(1, 'Ratée deux fois', JSON.stringify(['A1', 'B1', 'C1', 'D1', 'E1']), 'A', 'La démarche', JSON.stringify({ C: 'taux additionnés' }))
    item.run(2, 'Sautée une fois', JSON.stringify(['A2', 'B2', 'C2', 'D2', 'E2']), 'B', null, null)
    item.run(3, 'Toujours réussie', JSON.stringify(['A3', 'B3', 'C3', 'D3', 'E3']), 'C', null, null)
    item.run(4, 'Ratée puis réussie', JSON.stringify(['A4', 'B4', 'C4', 'D4', 'E4']), 'D', null, null)

    const session = db
      .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'drill', '["calcul"]')`)
      .run()
    const sid = Number(session.lastInsertRowid)
    // Une question ne se répond qu'une fois par session : les secondes
    // tentatives passent par une autre série, comme dans la réalité.
    const sid2 = Number(
      db
        .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'drill', '["calcul"]')`)
        .run().lastInsertRowid,
    )

    const tentative = db.prepare(
      `INSERT INTO attempt (session_id, item_id, reponse_donnee, est_correct, a_saute, temps_ms, confiance, points_gagnes, created_at)
       VALUES (?, ?, ?, ?, ?, 1000, 2, 0, ?)`,
    )
    tentative.run(sid, 1, 'B', 0, 0, '2026-01-01 10:00:00')
    tentative.run(sid2, 1, 'C', 0, 0, '2026-01-02 10:00:00')
    tentative.run(sid, 2, null, 0, 1, '2026-01-03 10:00:00')
    tentative.run(sid, 3, 'C', 1, 0, '2026-01-04 10:00:00')
    tentative.run(sid, 4, 'A', 0, 0, '2026-01-05 10:00:00')
    tentative.run(sid2, 4, 'D', 1, 0, '2026-01-06 10:00:00')

    process.env.PREPA_DB = ':memory:'
  })

  afterAll(() => db?.close())

  /* Les requêtes sont rejouées ici avec la même logique que `core/db/carnet.ts`,
     sur la base de test — l'objectif est de verrouiller les RÈGLES du carnet. */

  function entrees(inclureComprises = false) {
    return db
      .prepare(
        `SELECT i.id, i.enonce,
                SUM(CASE WHEN a.est_correct = 0 AND a.a_saute = 0 THEN 1 ELSE 0 END) AS echecs,
                SUM(CASE WHEN a.a_saute = 1 THEN 1 ELSE 0 END)                       AS sauts,
                MAX(CASE WHEN a.est_correct = 0 THEN a.created_at END)               AS dernier_echec,
                (SELECT d.est_correct FROM attempt d WHERE d.item_id = i.id ORDER BY d.id DESC LIMIT 1) AS dernier_juste
           FROM item i
           JOIN attempt a          ON a.item_id = i.id
           LEFT JOIN carnet_note c ON c.item_id = i.id
          WHERE i.exam_id = 'tagemage' ${inclureComprises ? '' : 'AND c.compris_le IS NULL'}
          GROUP BY i.id
         HAVING echecs + sauts > 0
          ORDER BY dernier_echec DESC, i.id DESC`,
      )
      .all() as Array<{ id: number; enonce: string; echecs: number; sauts: number; dernier_juste: number }>
  }

  describe('carnet d’erreurs — ce qui y entre', () => {
    it('retient les questions ratées et les questions sautées, pas les autres', () => {
      const ids = entrees().map((e) => e.id)
      expect(ids).toContain(1) // ratée deux fois
      expect(ids).toContain(2) // sautée
      expect(ids).toContain(4) // ratée puis réussie
      expect(ids).not.toContain(3) // jamais ratée
    })

    // Sauter est une bonne décision en épreuve, mais la question reste une
    // question qu'on ne savait pas traiter.
    it('compte un saut comme une entrée au carnet', () => {
      const saut = entrees().find((e) => e.id === 2)
      expect(saut?.sauts).toBe(1)
      expect(saut?.echecs).toBe(0)
    })

    it('compte les échecs répétés d’une même question', () => {
      expect(entrees().find((e) => e.id === 1)?.echecs).toBe(2)
    })

    // Réussir une fois n'est pas comprendre : la question reste, signalée.
    it('garde une question réussie depuis, en la signalant', () => {
      const reprise = entrees().find((e) => e.id === 4)
      expect(reprise).toBeDefined()
      expect(Boolean(reprise?.dernier_juste)).toBe(true)
    })

    it('classe la plus récemment ratée en tête', () => {
      expect(entrees()[0].id).toBe(4) // raté le 5 janvier, le plus récent
    })
  })

  describe('carnet d’erreurs — ce qui en sort', () => {
    it('ne sort une question que sur marquage explicite', () => {
      expect(entrees().map((e) => e.id)).toContain(1)

      db.prepare(`INSERT INTO carnet_note (item_id, compris_le) VALUES (1, datetime('now'))`).run()
      expect(entrees().map((e) => e.id)).not.toContain(1)

      // Et elle reste consultable quand on demande à les voir.
      expect(entrees(true).map((e) => e.id)).toContain(1)
    })

    it('remet une question dans la pile quand on décoche', () => {
      db.prepare(`UPDATE carnet_note SET compris_le = NULL WHERE item_id = 1`).run()
      expect(entrees().map((e) => e.id)).toContain(1)
    })

    it('accepte une note et la conserve', () => {
      db.prepare(
        `INSERT INTO carnet_note (item_id, note) VALUES (2, 'j’ai additionné les taux')
         ON CONFLICT (item_id) DO UPDATE SET note = excluded.note`,
      ).run()
      const n = db.prepare(`SELECT note FROM carnet_note WHERE item_id = 2`).get() as { note: string }
      expect(n.note).toBe('j’ai additionné les taux')
    })
  })

  describe('carnet d’erreurs — la série de rattrapage', () => {
    it('sert d’abord ce qui résiste le plus', () => {
      const ordre = db
        .prepare(
          `SELECT i.id, SUM(CASE WHEN a.est_correct = 0 OR a.a_saute = 1 THEN 1 ELSE 0 END) AS rates
             FROM item i
             JOIN attempt a          ON a.item_id = i.id
             LEFT JOIN carnet_note c ON c.item_id = i.id
            WHERE c.compris_le IS NULL
            GROUP BY i.id
           HAVING rates > 0
            ORDER BY rates DESC, i.id`,
        )
        .all() as Array<{ id: number; rates: number }>

      expect(ordre[0].id).toBe(1)
      expect(ordre[0].rates).toBe(2)
      expect(ordre.map((o) => o.id)).not.toContain(3)
    })
  })
})
