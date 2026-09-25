import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import { abandonnerSession, etatSession, rangerSessionsAbandonnees } from './sessions'

/**
 * Cycle de vie des sessions, sur une base en mémoire : ce qui est rangé, ce
 * qui est protégé, et l'unicité des réponses par session.
 */
let db: Database.Database

function appliquerMigrations(d: Database.Database) {
  const dossier = 'core/db/migrations'
  for (const f of readdirSync(dossier).sort()) {
    if (!f.endsWith('.sql')) continue
    const sql = readFileSync(`${dossier}/${f}`, 'utf8')
    if (/^\s*--\s*@sans-cles-etrangeres\s*$/m.test(sql)) d.pragma('foreign_keys = OFF')
    d.exec(sql)
    d.pragma('foreign_keys = ON')
  }
}

function session(debut: string, fin: string | null = null): number {
  return Number(
    db
      .prepare(
        `INSERT INTO exam_session (exam_id, type, sections, debut, fin)
         VALUES ('tagemage', 'drill', '["calcul"]', ?, ?)`,
      )
      .run(debut, fin).lastInsertRowid,
  )
}

function repondre(sessionId: number, itemId = 1) {
  return db
    .prepare(
      `INSERT INTO attempt (session_id, item_id, reponse_donnee, est_correct, temps_ms, confiance, points_gagnes)
       VALUES (?, ?, 'A', 1, 1000, 3, 4)
       ON CONFLICT (session_id, item_id) DO NOTHING`,
    )
    .run(sessionId, itemId)
}

beforeEach(() => {
  db?.close()
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  appliquerMigrations(db)
  db.prepare(
    `INSERT INTO item (id, exam_id, section, type_item, enonce, options, bonne_reponse, source, statut)
     VALUES (1, 'tagemage', 'calcul', 'qcm', 'Q1', '["a","b","c","d","e"]', 'A', 'genere', 'valide'),
            (2, 'tagemage', 'calcul', 'qcm', 'Q2', '["a","b","c","d","e"]', 'B', 'genere', 'valide')`,
  ).run()
})

afterAll(() => db?.close())

describe('rangerSessionsAbandonnees', () => {
  it('supprime les sessions vides anciennes et marque interrompues celles qui ont des réponses', () => {
    const vide = session("2026-01-01 10:00:00")
    const entamee = session("2026-01-01 11:00:00")
    repondre(entamee)

    const r = rangerSessionsAbandonnees(db)
    expect(r.supprimees).toEqual([vide])
    expect(r.interrompues).toEqual([entamee])
    expect(db.prepare('SELECT COUNT(*) AS n FROM exam_session WHERE id = ?').get(vide)).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM attempt').get()).toEqual({ n: 1 })
  })

  it('protège une session récente, même vide : ce peut être une épreuve en cours', () => {
    const enCours = Number(
      db
        .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'blanc', '[]')`)
        .run().lastInsertRowid,
    )
    const r = rangerSessionsAbandonnees(db)
    expect(r.supprimees).not.toContain(enCours)
    expect(etatSession(enCours, db).reprenable).toBe(true)
  })

  it('ne touche jamais une session terminée', () => {
    const close = session('2026-01-01 10:00:00', '2026-01-01 10:20:00')
    expect(rangerSessionsAbandonnees(db)).toEqual({ supprimees: [], interrompues: [] })
    expect(etatSession(close, db).terminee).toBe(true)
  })
})

describe('abandonnerSession', () => {
  it('supprime une session vide, interrompt une session entamée', () => {
    const vide = session('2026-09-25 10:00:00')
    const entamee = session('2026-09-25 10:00:00')
    repondre(entamee)

    abandonnerSession(vide, db)
    abandonnerSession(entamee, db)

    expect(etatSession(vide, db).existe).toBe(false)
    const e = etatSession(entamee, db)
    expect(e.interrompue).toBe(true)
    expect(e.reprenable).toBe(false)
    expect(e.sectionsEnregistrees).toEqual(['calcul'])
  })
})

describe('unicité des réponses', () => {
  it('absorbe un renvoi de la même réponse sans la compter deux fois', () => {
    const s = session('2026-09-25 10:00:00')
    expect(repondre(s, 1).changes).toBe(1)
    expect(repondre(s, 1).changes).toBe(0)
    expect(repondre(s, 2).changes).toBe(1)
    expect(db.prepare('SELECT COUNT(*) AS n FROM attempt').get()).toEqual({ n: 2 })
  })

  it('refuse un doublon inséré sans précaution', () => {
    const s = session('2026-09-25 10:00:00')
    repondre(s, 1)
    expect(() =>
      db
        .prepare(
          `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
           VALUES (?, 1, 0, 1000, 1, 0)`,
        )
        .run(s),
    ).toThrow(/UNIQUE/)
  })
})
