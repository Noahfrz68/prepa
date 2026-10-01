import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { Base } from './base'
import { MOTEURS, baseDeTest } from './moteurs-test'
import { enregistrerPartie, recordDe, statsAutomatismes, type PartieEnvoyee } from './automatismes'
import { QUESTIONS_SERIE } from '@/core/automatismes'

/**
 * Les parties d'automatismes, sur une base en mémoire et sur les deux
 * moteurs : enregistrement idempotent, records par format, faits à revoir.
 */
describe.each(MOTEURS)('$nom', (moteur) => {
  let db: Base
  let n = 0

  beforeEach(async () => {
    db?.close()
    db = await baseDeTest(moteur)
  })
  afterAll(() => db?.close())

  /** Une partie de `justes` bonnes réponses sur `total`, toutes sur des faits distincts. */
  function partie(o: Partial<PartieEnvoyee> & { justes?: number; total?: number; cles?: string[] } = {}): PartieEnvoyee {
    const total = o.total ?? 10
    const justes = o.justes ?? total
    const cles = o.cles ?? Array.from({ length: total }, (_, i) => `carre:${11 + i}`)
    return {
      uid: o.uid ?? `partie-${String(++n).padStart(4, '0')}`,
      jeu: o.jeu ?? 'puissances',
      format: o.format ?? 'chrono',
      dureeMs: o.dureeMs ?? 60_000,
      reponses:
        o.reponses ??
        cles.map((cle, i) => ({ jeu: 'puissances', cle, reponse: '1', juste: i < justes, tempsMs: 2000, lent: false })),
    }
  }

  it('enregistre la partie et chacune de ses réponses', () => {
    enregistrerPartie(partie({ justes: 7 }), db)
    expect(db.prepare('SELECT nb, justes, format FROM automatisme_partie').get()).toEqual({ nb: 10, justes: 7, format: 'chrono' })
    expect((db.prepare('SELECT COUNT(*) AS n FROM automatisme_reponse').get() as { n: number }).n).toBe(10)
  })

  it('ne double pas une partie renvoyée après une coupure', () => {
    const p = partie()
    expect(enregistrerPartie(p, db).dejaEnregistree).toBe(false)
    expect(enregistrerPartie(p, db).dejaEnregistree).toBe(true)
    expect((db.prepare('SELECT COUNT(*) AS n FROM automatisme_partie').get() as { n: number }).n).toBe(1)
    expect((db.prepare('SELECT COUNT(*) AS n FROM automatisme_reponse').get() as { n: number }).n).toBe(10)
  })

  it('reconnaît un record au chrono : plus de justes, et seulement plus', () => {
    expect(enregistrerPartie(partie({ justes: 8 }), db).nouveauRecord).toBe(true)
    expect(enregistrerPartie(partie({ justes: 8 }), db).nouveauRecord).toBe(false)
    const r = enregistrerPartie(partie({ justes: 9 }), db)
    expect(r.nouveauRecord).toBe(true)
    expect(r.precedent?.justes).toBe(8)
    expect(recordDe('puissances', 'chrono', db)?.justes).toBe(9)
  })

  it('départage une série par le temps à justes égales', () => {
    const serie = (justes: number, dureeMs: number) => partie({ format: 'serie', total: QUESTIONS_SERIE, justes, dureeMs })
    expect(enregistrerPartie(serie(19, 80_000), db).nouveauRecord).toBe(true)
    expect(enregistrerPartie(serie(19, 70_000), db).nouveauRecord).toBe(true)
    expect(enregistrerPartie(serie(18, 40_000), db).nouveauRecord).toBe(false)
    expect(recordDe('puissances', 'serie', db)).toMatchObject({ justes: 19, dureeMs: 70_000 })
  })

  it('tient les records de chaque jeu et de chaque format à part', () => {
    enregistrerPartie(partie({ justes: 10 }), db)
    expect(enregistrerPartie(partie({ jeu: 'lettres', justes: 3 }), db).nouveauRecord).toBe(true)
    expect(recordDe('puissances', 'serie', db)).toBeNull()
  })

  it('refuse une partie mal formée, sans rien écrire', () => {
    const refus = [
      partie({ uid: 'x' }),
      partie({ jeu: 'inconnu' }),
      partie({ format: 'defi' }),
      partie({ reponses: [] }),
      partie({ format: 'serie', total: 12 }),
      partie({ reponses: [{ jeu: 'nimporte', cle: 'a', reponse: null, juste: true, tempsMs: 1, lent: false }] }),
    ]
    for (const p of refus) expect(() => enregistrerPartie(p, db), JSON.stringify(p).slice(0, 80)).toThrow()
    expect((db.prepare('SELECT COUNT(*) AS n FROM automatisme_partie').get() as { n: number }).n).toBe(0)
  })

  it('ne marque « lente » qu’une réponse juste, et borne les temps', () => {
    enregistrerPartie(
      partie({
        reponses: [
          { jeu: 'puissances', cle: 'carre:11', reponse: '120', juste: false, tempsMs: 9000, lent: true },
          { jeu: 'puissances', cle: 'carre:12', reponse: '144', juste: true, tempsMs: 1e12, lent: true },
        ],
      }),
      db,
    )
    expect(db.prepare('SELECT cle, lent, temps_ms FROM automatisme_reponse ORDER BY ordre').all()).toEqual([
      { cle: 'carre:11', lent: 0, temps_ms: 9000 },
      { cle: 'carre:12', lent: 1, temps_ms: 30 * 60 * 1000 },
    ])
  })

  it('compte les faits à revoir d’après leur DERNIÈRE réponse', () => {
    const r = (cle: string, juste: boolean, lent = false) => ({ jeu: 'puissances', cle, reponse: null, juste, tempsMs: 1000, lent })
    // Première partie : 11 faux, 12 lent, 13 juste.
    enregistrerPartie(partie({ reponses: [r('carre:11', false), r('carre:12', true, true), r('carre:13', true)] }), db)
    let s = statsAutomatismes(['puissances', 'lettres'], db)
    expect(s.get('puissances')!.aRevoir).toBe(2)

    // Plus tard, 11 réussi : il sort ; 13 raté : il entre.
    db.prepare(`UPDATE automatisme_partie SET le = '2020-01-01T00:00:00.000Z'`).run()
    enregistrerPartie(partie({ reponses: [r('carre:11', true), r('carre:13', false)] }), db)
    s = statsAutomatismes(['puissances', 'lettres'], db)
    expect(s.get('puissances')!.aRevoir).toBe(2) // 12 (lent) et 13 (faux)
    expect(s.get('puissances')!.parties).toBe(2)
    expect(s.get('lettres')).toMatchObject({ parties: 0, aRevoir: 0, reussite: null })
  })

  it('calcule la réussite sur les 30 derniers jours seulement', () => {
    enregistrerPartie(partie({ justes: 0, total: 4 }), db)
    db.prepare(`UPDATE automatisme_partie SET le = '2020-01-01T00:00:00.000Z'`).run()
    enregistrerPartie(partie({ justes: 3, total: 4 }), db)
    const s = statsAutomatismes(['puissances'], db).get('puissances')!
    expect(s.reussite).toBeCloseTo(0.75)
    expect(s.tempsMoyenMs).toBe(2000)
    expect(s.records.chrono?.justes).toBe(3)
  })
})
