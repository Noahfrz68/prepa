import { describe, expect, it } from 'vitest'
import type { Base } from '@/core/db/base'
import { MOTEURS, baseDeTest } from '@/core/db/moteurs-test'
import { fusionner } from './fusion'

/**
 * La fusion de deux bases, sur les deux moteurs (le PC fusionne avec
 * better-sqlite3, l'iPhone avec sql.js). Chaque test monte deux appareils,
 * les fait diverger, puis fusionne.
 */

let compteur = 0

function item(b: Base, enonce: string, options: { source?: string; statut?: string } = {}): number {
  return Number(
    b
      .prepare(
        `INSERT INTO item (exam_id, section, type_item, enonce, options, bonne_reponse, source, statut)
         VALUES ('tagemage', 'calcul', 'qcm', ?, '["a","b","c","d","e"]', 'A', ?, ?)`,
      )
      .run(enonce, options.source ?? 'saisi', options.statut ?? 'valide').lastInsertRowid,
  )
}

function session(b: Base, fin: string | null = null): number {
  return Number(
    b
      .prepare(`INSERT INTO exam_session (exam_id, type, sections, debut, fin) VALUES ('tagemage', 'drill', '["calcul"]', ?, ?)`)
      .run(`2026-09-${String(10 + (compteur++ % 18)).padStart(2, '0')} 10:00:00`, fin).lastInsertRowid,
  )
}

function repondre(b: Base, s: number, i: number, juste = 1) {
  b.prepare(
    `INSERT INTO attempt (session_id, item_id, reponse_donnee, est_correct, temps_ms, confiance, points_gagnes)
     VALUES (?, ?, 'A', ?, 30000, 3, 4)`,
  ).run(s, i, juste)
}

function objectifs(b: Base) {
  b.exec(`INSERT INTO exam_goal (exam_id, date_provisoire, actif) VALUES ('tagemage', 1, 1), ('toeic_lr', 1, 1);
          INSERT INTO user_profile (id) VALUES (1);`)
}

const uid = (b: Base, table: string, id: number) =>
  (b.prepare(`SELECT uid FROM ${table} WHERE id = ?`).get(id) as { uid: string }).uid

/** Ce qui doit être identique sur deux appareils synchronisés, indépendamment des id locaux. */
function contenu(b: Base) {
  return {
    items: b.prepare(`SELECT uid, enonce, statut FROM item ORDER BY uid`).all(),
    sessions: b.prepare(`SELECT uid, fin FROM exam_session ORDER BY uid`).all(),
    tentatives: b
      .prepare(
        `SELECT s.uid AS s, i.uid AS i, a.est_correct FROM attempt a
           JOIN exam_session s ON s.id = a.session_id JOIN item i ON i.id = a.item_id ORDER BY s.uid, i.uid`,
      )
      .all(),
    objectifs: b.prepare(`SELECT exam_id, date_examen, score_cible FROM exam_goal ORDER BY exam_id`).all(),
    carnet: b
      .prepare(`SELECT i.uid, c.note FROM carnet_note c JOIN item i ON i.id = c.item_id ORDER BY i.uid`)
      .all(),
  }
}

/** Laisse passer le temps : `maj_le` a une précision à la milliseconde. */
const plusTard = () => new Promise((r) => setTimeout(r, 5))

describe.each(MOTEURS)('$nom', (moteur) => {
  const deux = async () => {
    const pc = await baseDeTest(moteur)
    const iphone = await baseDeTest(moteur)
    objectifs(pc)
    objectifs(iphone)
    return { pc, iphone }
  }

  describe('déclencheurs de la migration 024', () => {
    it('pose un uid à l’insertion, un maj_le à la modification seulement, une trace à la suppression', async () => {
      const b = await baseDeTest(moteur)
      const i = item(b, 'Q1')
      const ligne = () => b.prepare('SELECT uid, maj_le FROM item WHERE id = ?').get(i) as { uid: string; maj_le: string | null }
      expect(ligne().uid).toMatch(/^[0-9a-f]{32}$/)
      expect(ligne().maj_le).toBeNull()

      b.prepare(`UPDATE item SET statut = 'suspect' WHERE id = ?`).run(i)
      expect(ligne().maj_le).toMatch(/^\d{4}-\d{2}-\d{2}T/)

      const u = ligne().uid
      b.prepare('DELETE FROM item WHERE id = ?').run(i)
      expect(b.prepare(`SELECT cle FROM suppression WHERE nom_table = 'item'`).all()).toEqual([{ cle: u }])
    })

    it('ne date pas une modification faite pendant une fusion', async () => {
      const b = await baseDeTest(moteur)
      const i = item(b, 'Q1')
      b.prepare('INSERT INTO sync_verrou (present) VALUES (1)').run()
      b.prepare(`UPDATE item SET statut = 'suspect' WHERE id = ?`).run(i)
      b.prepare('DELETE FROM sync_verrou').run()
      expect(b.prepare('SELECT maj_le FROM item WHERE id = ?').get(i)).toEqual({ maj_le: null })
    })
  })

  it('recopie tout dans un appareil neuf', async () => {
    const { pc, iphone } = await deux()
    const i1 = item(pc, 'Q1')
    const i2 = item(pc, 'Q2')
    const s = session(pc, '2026-09-10 10:20:00')
    repondre(pc, s, i1, 1)
    repondre(pc, s, i2, 0)
    pc.prepare(`INSERT INTO carnet_note (item_id, note) VALUES (?, 'taux additionnés')`).run(i2)
    pc.prepare(`UPDATE exam_goal SET date_examen = '2026-12-15', score_cible = 450 WHERE exam_id = 'tagemage'`).run()

    const bilan = fusionner(iphone, pc)
    expect(bilan.item.ajoutees).toBe(2)
    expect(bilan.attempt.ajoutees).toBe(2)
    expect(contenu(iphone)).toEqual(contenu(pc))
  })

  it('réunit ce que chaque appareil a fait de son côté, en traduisant les identifiants', async () => {
    const { pc, iphone } = await deux()
    fusionner(iphone, pc)

    // Des deux côtés : une question et une séance, qui reçoivent le même id local.
    const qPc = item(pc, 'Question du PC')
    const sPc = session(pc)
    repondre(pc, sPc, qPc)
    const qIp = item(iphone, 'Question de l’iPhone')
    const sIp = session(iphone)
    repondre(iphone, sIp, qIp, 0)
    expect(qPc).toBe(qIp)
    expect(sPc).toBe(sIp)

    fusionner(pc, iphone)
    fusionner(iphone, pc)
    expect(contenu(pc)).toEqual(contenu(iphone))

    // La réponse de l'iPhone pointe bien, sur le PC, vers la question de l'iPhone.
    const r = pc
      .prepare(
        `SELECT i.enonce, a.est_correct FROM attempt a JOIN item i ON i.id = a.item_id
          JOIN exam_session s ON s.id = a.session_id WHERE s.uid = ?`,
      )
      .get(uid(iphone, 'exam_session', sIp))
    expect(r).toEqual({ enonce: 'Question de l’iPhone', est_correct: 0 })
  })

  it('garde la modification la plus récente quand les deux appareils ont changé la même ligne', async () => {
    const { pc, iphone } = await deux()
    const i = item(pc, 'Q1')
    fusionner(iphone, pc)
    const iIp = (iphone.prepare('SELECT id FROM item WHERE uid = ?').get(uid(pc, 'item', i)) as { id: number }).id

    pc.prepare(`UPDATE item SET statut = 'suspect' WHERE id = ?`).run(i)
    await plusTard()
    iphone.prepare(`UPDATE item SET statut = 'a_relire' WHERE id = ?`).run(iIp)
    await plusTard()
    iphone.prepare(`UPDATE exam_goal SET score_cible = 400 WHERE exam_id = 'tagemage'`).run()
    await plusTard()
    pc.prepare(`UPDATE exam_goal SET score_cible = 480 WHERE exam_id = 'tagemage'`).run()

    fusionner(pc, iphone)
    fusionner(iphone, pc)
    for (const b of [pc, iphone]) {
      expect(b.prepare('SELECT statut FROM item').get()).toEqual({ statut: 'a_relire' })
      expect(b.prepare(`SELECT score_cible FROM exam_goal WHERE exam_id = 'tagemage'`).get()).toEqual({ score_cible: 480 })
    }
  })

  it('préfère des objectifs réglés à ceux, par défaut, d’un appareil neuf', async () => {
    const { pc, iphone } = await deux()
    pc.prepare(`UPDATE exam_goal SET date_examen = '2026-12-15' WHERE exam_id = 'tagemage'`).run()
    fusionner(iphone, pc)
    expect(iphone.prepare(`SELECT date_examen FROM exam_goal WHERE exam_id = 'tagemage'`).get()).toEqual({
      date_examen: '2026-12-15',
    })
  })

  it('propage une suppression, et ne ressuscite pas ce qui a été supprimé', async () => {
    const { pc, iphone } = await deux()
    const a = item(pc, 'À supprimer sur l’iPhone')
    const b = item(pc, 'À supprimer sur le PC')
    const s = session(pc)
    repondre(pc, s, a)
    fusionner(iphone, pc)

    const aIp = (iphone.prepare('SELECT id FROM item WHERE uid = ?').get(uid(pc, 'item', a)) as { id: number }).id
    iphone.prepare('DELETE FROM attempt WHERE item_id = ?').run(aIp)
    iphone.prepare('DELETE FROM item WHERE id = ?').run(aIp)
    pc.prepare('DELETE FROM item WHERE id = ?').run(b)

    // Le PC reçoit la suppression de a ; l'iPhone, qui a encore b, ne le lui rend pas.
    const bilan = fusionner(pc, iphone)
    expect(bilan.item?.supprimees).toBe(1)
    expect(bilan.item?.ajoutees ?? 0).toBe(0)
    fusionner(iphone, pc)
    for (const base of [pc, iphone]) {
      expect(base.prepare('SELECT COUNT(*) AS n FROM item').get()).toEqual({ n: 0 })
      expect(base.prepare('SELECT COUNT(*) AS n FROM attempt').get()).toEqual({ n: 0 })
    }
  })

  it('confond une même question créée des deux côtés, et les deux appareils convergent sur son uid', async () => {
    const { pc, iphone } = await deux()
    item(pc, 'Combien font 2 + 2 ?', { source: 'genere' })
    item(iphone, 'Combien font 2 + 2 ?', { source: 'genere' })
    const uids = [pc, iphone].map((b) => (b.prepare('SELECT uid FROM item').get() as { uid: string }).uid)

    fusionner(pc, iphone)
    fusionner(iphone, pc)
    for (const b of [pc, iphone]) {
      expect(b.prepare('SELECT uid FROM item').all()).toEqual([{ uid: [...uids].sort()[0] }])
    }
  })

  it('ne change rien à une seconde fusion identique', async () => {
    const { pc, iphone } = await deux()
    const i = item(pc, 'Q1')
    const s = session(pc)
    repondre(pc, s, i)
    fusionner(iphone, pc)
    const avant = contenu(iphone)
    const bilan = fusionner(iphone, pc)
    const total = Object.values(bilan).reduce((n, t) => n + t.ajoutees + t.modifiees + t.supprimees, 0)
    expect(total).toBe(0)
    expect(contenu(iphone)).toEqual(avant)
  })

  it('complète un média dont le fichier n’est connu que de l’autre appareil', async () => {
    const { pc, iphone } = await deux()
    for (const b of [pc, iphone]) {
      b.prepare(`INSERT INTO media (type, transcript, hash_script) VALUES ('audio', 'Good morning.', 'abc123abc123')`).run()
    }
    pc.prepare(`UPDATE media SET chemin_fichier = 'audio/abc123abc123.wav', duree_ms = 1500`).run()
    fusionner(iphone, pc)
    expect(iphone.prepare('SELECT chemin_fichier, duree_ms FROM media').all()).toEqual([
      { chemin_fichier: 'audio/abc123abc123.wav', duree_ms: 1500 },
    ])
  })

  it('reprend le plan d’une semaine absente, et les tâches cochées de l’autre côté', async () => {
    const { pc, iphone } = await deux()
    for (const b of [pc, iphone]) {
      b.prepare(`INSERT INTO study_plan (semaine_du, volume_prevu_min) VALUES ('2026-09-28', 300)`).run()
      b.prepare(
        `INSERT INTO plan_tache (semaine_du, ordre, type, libelle, minutes, quantite) VALUES ('2026-09-28', 0, 'entrainement', 'Calcul', 20, 1)`,
      ).run()
    }
    pc.prepare(`INSERT INTO study_plan (semaine_du, volume_prevu_min) VALUES ('2026-10-05', 240)`).run()
    pc.prepare(
      `INSERT INTO plan_tache (semaine_du, ordre, type, libelle, minutes, quantite) VALUES ('2026-10-05', 0, 'diagnostic', 'Diagnostic', 53, 1)`,
    ).run()
    pc.prepare(`UPDATE plan_tache SET fait_le = '2026-09-29 18:00:00' WHERE semaine_du = '2026-09-28'`).run()

    fusionner(iphone, pc)
    expect(iphone.prepare('SELECT semaine_du, libelle, fait_le FROM plan_tache ORDER BY semaine_du').all()).toEqual([
      { semaine_du: '2026-09-28', libelle: 'Calcul', fait_le: '2026-09-29 18:00:00' },
      { semaine_du: '2026-10-05', libelle: 'Diagnostic', fait_le: null },
    ])
  })

  it('remplace un plan resté vide par celui de l’autre appareil', async () => {
    const { pc, iphone } = await deux()
    // L'iPhone neuf a figé sa semaine sans aucune question en banque.
    iphone.prepare(`INSERT INTO study_plan (semaine_du, volume_prevu_min) VALUES ('2026-09-28', 0)`).run()
    pc.prepare(`INSERT INTO study_plan (semaine_du, volume_prevu_min) VALUES ('2026-09-28', 300)`).run()
    pc.prepare(
      `INSERT INTO plan_tache (semaine_du, ordre, type, libelle, minutes, quantite) VALUES ('2026-09-28', 0, 'entrainement', 'Calcul', 20, 1)`,
    ).run()

    fusionner(iphone, pc)
    expect(iphone.prepare(`SELECT volume_prevu_min FROM study_plan`).get()).toEqual({ volume_prevu_min: 300 })
    expect(iphone.prepare(`SELECT libelle FROM plan_tache`).all()).toEqual([{ libelle: 'Calcul' }])
  })

  it('ne laisse rien si la fusion échoue', async () => {
    const { pc, iphone } = await deux()
    item(pc, 'Q1')
    // Une base « entrante » sans table de réponses : la fusion lèvera en route.
    pc.exec('DROP TABLE attempt')
    expect(() => fusionner(iphone, pc)).toThrow()
    expect(iphone.prepare('SELECT COUNT(*) AS n FROM item').get()).toEqual({ n: 0 })
    expect(iphone.prepare('SELECT COUNT(*) AS n FROM sync_verrou').get()).toEqual({ n: 0 })
  })
})
