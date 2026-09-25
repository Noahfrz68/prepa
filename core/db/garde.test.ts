import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import { ErreurRequete } from '@/core/erreurs'
import { TEMPS_MAX_MS, tempsBorne, verifierSessionOuverte } from './garde'

let db: Database.Database

beforeAll(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  for (const f of readdirSync('core/db/migrations').sort()) {
    if (!f.endsWith('.sql')) continue
    const sql = readFileSync(`core/db/migrations/${f}`, 'utf8')
    if (/^\s*--\s*@sans-cles-etrangeres\s*$/m.test(sql)) db.pragma('foreign_keys = OFF')
    db.exec(sql)
    db.pragma('foreign_keys = ON')
  }
  db.exec(`
    INSERT INTO exam_session (id, exam_id, type, sections) VALUES (1, 'tagemage', 'drill', '[]');
    INSERT INTO exam_session (id, exam_id, type, sections, fin) VALUES (2, 'tagemage', 'drill', '[]', datetime('now'));
    INSERT INTO exam_session (id, exam_id, type, sections, interrompue) VALUES (3, 'tagemage', 'drill', '[]', 1);
  `)
})

afterAll(() => db?.close())

describe('verifierSessionOuverte', () => {
  it('laisse passer une séance ouverte', () => {
    expect(() => verifierSessionOuverte(db, 1)).not.toThrow()
  })

  it('refuse une séance disparue, close ou abandonnée, par une erreur lisible en 409', () => {
    for (const [id, motif] of [
      [99, /n’existe plus/],
      [2, /déjà close/],
      [3, /abandonnée/],
    ] as const) {
      try {
        verifierSessionOuverte(db, id)
        expect.unreachable()
      } catch (e) {
        expect(e).toBeInstanceOf(ErreurRequete)
        expect((e as ErreurRequete).statut).toBe(409)
        expect((e as Error).message).toMatch(motif)
      }
    }
  })
})

describe('tempsBorne', () => {
  it('plafonne, arrondit et refuse le négatif comme le non-nombre', () => {
    expect(tempsBorne(1234.6)).toBe(1235)
    expect(tempsBorne(-5)).toBe(0)
    expect(tempsBorne(Number.NaN)).toBe(0)
    expect(tempsBorne(10 * 3600 * 1000)).toBe(TEMPS_MAX_MS)
  })
})
