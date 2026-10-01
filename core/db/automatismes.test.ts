import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { Base } from './base'
import { MOTEURS, baseDeTest } from './moteurs-test'
import {
  enregistrerPartie,
  etatDefi,
  etatsFaits,
  jeuxConseilles,
  meilleurDefi,
  recordDe,
  serieDefi,
  statsAutomatismes,
  type PartieEnvoyee,
} from './automatismes'
import { defiDuJour, jourDecale, jourLocal } from '@/core/automatismes/defi'
import { QUESTIONS_SERIE } from '@/core/automatismes'
import { skillsTageMage } from '@/exams/tagemage'

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

  describe('état des faits, pour la répétition', () => {
    const r = (cle: string, juste: boolean, lent = false) => ({ jeu: 'puissances', cle, reponse: null, juste, tempsMs: 1000, lent })
    /** Une partie datée, pour ordonner l'historique sans dépendre de l'horloge. */
    const jouerLe = (le: string, reponses: ReturnType<typeof r>[]) => {
      const p = partie({ reponses })
      enregistrerPartie(p, db)
      db.prepare('UPDATE automatisme_partie SET le = ? WHERE uid = ?').run(le, p.uid)
    }

    it('compte les réponses justes et rapides d’affilée depuis la dernière', () => {
      jouerLe('2026-09-01T10:00:00.000Z', [r('carre:11', false), r('carre:12', true), r('carre:13', true)])
      jouerLe('2026-09-02T10:00:00.000Z', [r('carre:11', true), r('carre:12', true), r('carre:13', true, true)])
      jouerLe('2026-09-03T10:00:00.000Z', [r('carre:11', true), r('carre:12', true)])

      const e = etatsFaits(db)
      // 11 : faux, juste, juste → série de 2.
      expect(e['carre:11']).toEqual({ serie: 2, aRevoir: false, vuLe: Date.parse('2026-09-03T10:00:00.000Z') })
      // 12 : trois justes → maîtrisé (la série ne lit que les 3 dernières).
      expect(e['carre:12'].serie).toBe(3)
      // 13 : la dernière réponse était lente → à revoir.
      expect(e['carre:13']).toMatchObject({ serie: 0, aRevoir: true })
      expect(e['carre:14']).toBeUndefined()
    })

    it('départage deux réponses d’une même partie par leur ordre', () => {
      jouerLe('2026-09-01T10:00:00.000Z', [r('carre:11', true), r('carre:11', false)])
      expect(etatsFaits(db)['carre:11'].aRevoir).toBe(true)
    })
  })

  describe('Mélange', () => {
    it('s’enregistre avec ses propres records, ses réponses gardant leur jeu', () => {
      const p = partie({
        jeu: 'melange',
        reponses: [
          { jeu: 'lettres', cle: 'rang:P', reponse: '16', juste: true, tempsMs: 900, lent: false },
          { jeu: 'puissances', cle: 'carre:17', reponse: '279', juste: false, tempsMs: 3000, lent: false },
        ],
      })
      expect(enregistrerPartie(p, db).nouveauRecord).toBe(true)
      expect(recordDe('melange', 'chrono', db)?.justes).toBe(1)
      expect(recordDe('lettres', 'chrono', db)).toBeNull()

      const s = statsAutomatismes(['melange', 'lettres', 'puissances'], db)
      // Les statistiques par jeu viennent des questions, d'où qu'elles soient jouées.
      expect(s.get('lettres')).toMatchObject({ parties: 0, reussite: 1 })
      expect(s.get('puissances')).toMatchObject({ parties: 0, reussite: 0, aRevoir: 1 })
      // Le Mélange résume l'ensemble.
      expect(s.get('melange')).toMatchObject({ parties: 1, reussite: 0.5, tempsMoyenMs: 1950, aRevoir: 1 })
    })

    it('refuse une réponse rangée sous « melange » : elle doit garder son jeu', () => {
      const p = partie({
        jeu: 'melange',
        reponses: [{ jeu: 'melange', cle: 'rang:P', reponse: '16', juste: true, tempsMs: 900, lent: false }],
      })
      expect(() => enregistrerPartie(p, db)).toThrow()
    })
  })

  describe('défi du jour', () => {
    const aujourdhui = jourLocal()

    /** Le défi d'aujourd'hui, `justes` premières réponses justes. */
    const defi = (justes: number, dureeMs = 60_000, jour = aujourdhui): PartieEnvoyee => ({
      uid: `defi-${String(++n).padStart(4, '0')}`,
      jeu: 'melange',
      format: 'defi',
      defiDu: jour,
      dureeMs,
      reponses: defiDuJour(jour).map((q, i) => ({
        jeu: q.jeu,
        cle: q.cle,
        reponse: null,
        juste: i < justes,
        tempsMs: 3000,
        lent: false,
      })),
    })

    /** Un défi d'un autre jour, posé directement : la validation n'accepte que celui du jour. */
    const defiPasse = (jour: string, justes = 7) =>
      db
        .prepare(
          `INSERT INTO automatisme_partie (uid, jeu, format, defi_du, duree_ms, nb, justes)
           VALUES (?, 'melange', 'defi', ?, 60000, 10, ?)`,
        )
        .run(`passe-${jour}-${++n}`, jour, justes)

    it('compte la première partie du jour, pas les suivantes', () => {
      const premier = enregistrerPartie(defi(6), db)
      expect(premier.defi).toEqual({ premiere: true, serie: 1 })
      expect(premier.nouveauRecord).toBe(true)

      const rejoue = enregistrerPartie(defi(10, 30_000), db)
      expect(rejoue.defi?.premiere).toBe(false)
      // Un 10/10 rejoué ne bat pas le 6/10 du matin.
      expect(rejoue.nouveauRecord).toBe(false)
      expect(meilleurDefi(db)?.justes).toBe(6)
      expect(etatDefi(aujourdhui, db).aujourdhui?.justes).toBe(6)
    })

    it('tient le meilleur défi sur les premières parties de chaque jour', () => {
      defiPasse(jourDecale(aujourdhui, -3), 9)
      defiPasse(jourDecale(aujourdhui, -2), 4)
      expect(enregistrerPartie(defi(8), db).nouveauRecord).toBe(false)
      expect(meilleurDefi(db)?.justes).toBe(9)
      expect(etatDefi(aujourdhui, db)).toMatchObject({ jours: 3, aujourdhui: { justes: 8 } })
    })

    it('compte les jours d’affilée, sans casser la série tant qu’aujourd’hui reste à faire', () => {
      for (const k of [1, 2, 3, 5]) defiPasse(jourDecale(aujourdhui, -k))
      // Hier, avant-hier, il y a trois jours ; le trou d'il y a quatre jours arrête.
      expect(serieDefi(aujourdhui, db)).toBe(3)
      enregistrerPartie(defi(5), db)
      expect(serieDefi(aujourdhui, db)).toBe(4)
      // Le lendemain, avant d'avoir joué : la série tient toujours.
      expect(serieDefi(jourDecale(aujourdhui, 1), db)).toBe(4)
      // Deux jours plus tard sans jouer : elle est tombée.
      expect(serieDefi(jourDecale(aujourdhui, 2), db)).toBe(0)
    })

    it('refuse un défi qui n’est pas celui du jour', () => {
      const mauvais: PartieEnvoyee[] = [
        { ...defi(5), jeu: 'calcul' },
        { ...defi(5), defiDu: undefined },
        { ...defi(5), defiDu: '2020-01-01' },
        { ...defi(5), reponses: defi(5).reponses.slice(0, 9) },
        { ...defi(5), reponses: [...defi(5).reponses].reverse() },
        // Le défi d'un autre jour, rendu sous la date d'aujourd'hui.
        { ...defi(5, 60_000, jourDecale(aujourdhui, -1)), defiDu: aujourdhui },
      ]
      for (const p of mauvais) expect(() => enregistrerPartie(p, db), JSON.stringify(p).slice(0, 90)).toThrow()
      expect((db.prepare('SELECT COUNT(*) AS n FROM automatisme_partie').get() as { n: number }).n).toBe(0)
    })

    it('accepte le défi d’hier, commencé avant minuit', () => {
      expect(enregistrerPartie(defi(5, 60_000, jourDecale(aujourdhui, -1)), db).defi?.premiere).toBe(true)
    })

    it('ne compte pas un défi comme une partie de Mélange', () => {
      enregistrerPartie(defi(5), db)
      const s = statsAutomatismes(['melange'], db).get('melange')!
      expect(s.parties).toBe(0)
      expect(s.records.chrono).toBeNull()
      // Mais ses réponses nourrissent la répétition et les statistiques.
      expect(Object.keys(etatsFaits(db))).toHaveLength(10)
      expect(s.reussite).toBeCloseTo(0.5)
    })
  })

  describe('jeux conseillés d’après les erreurs réelles', () => {
    let item = 0

    beforeEach(() => {
      const s = db.prepare(
        `INSERT OR IGNORE INTO skill (id, exam_id, section, libelle, poids_examen, ordre) VALUES (?, 'tagemage', ?, ?, 1, 0)`,
      )
      for (const k of skillsTageMage()) s.run(k.id, k.section, k.libelle)
      db.prepare(`INSERT INTO exam_session (id, exam_id, type, sections) VALUES (1, 'tagemage', 'drill', '[]')`).run()
    })

    /** Une réponse à une question du sous-test donné, il y a `jours` jours. */
    function reponse(
      skill: string,
      jours: number,
      o: { juste?: boolean; saute?: boolean; motif?: string; cause?: string } = {},
    ) {
      const id = ++item
      db.prepare(
        `INSERT INTO item (id, exam_id, section, skill_id, type_item, enonce, options, bonne_reponse, source, statut)
         VALUES (?, 'tagemage', 'calcul', ?, 'qcm', ?, '["a","b","c","d","e"]', 'A', 'genere', 'valide')`,
      ).run(id, skill, `Q${id}`)
      db.prepare(
        `INSERT INTO attempt (session_id, item_id, est_correct, a_saute, motif_blanc, temps_ms, confiance, points_gagnes, created_at)
         VALUES (1, ?, ?, ?, ?, 1000, 2, 0, datetime('now', ?))`,
      ).run(id, o.juste ? 1 : 0, o.saute ? 1 : 0, o.motif ?? null, `-${jours} days`)
      if (o.cause) db.prepare(`INSERT INTO carnet_note (item_id, cause) VALUES (?, ?)`).run(id, o.cause)
    }

    const POURCENTAGES = 'tm.calcul.pourcentages_et_variations'

    it('ne conseille rien sans erreur', () => {
      reponse(POURCENTAGES, 1, { juste: true })
      expect(jeuxConseilles(db)).toEqual([])
    })

    it('désigne les jeux du sous-test raté, avec son motif', () => {
      for (let i = 0; i < 3; i++) reponse(POURCENTAGES, 2)
      const c = jeuxConseilles(db)
      expect(c.map((x) => x.jeu).sort()).toEqual(['calcul', 'fractions'])
      expect(c[0].motif).toEqual({ skillId: POURCENTAGES, libelle: 'pourcentages et variations', erreurs: 3 })
    })

    it('compte une question sautée, pas une question non traitée faute de temps', () => {
      reponse('tm.calcul.arithmetique_et_divisibilite', 1, { saute: true })
      reponse('tm.logique.suites_de_lettres', 1, { saute: true, motif: 'non_traite' })
      expect(jeuxConseilles(db).map((x) => x.jeu)).toEqual(['premiers'])
    })

    it('oublie les erreurs de plus de 30 jours, et laisse s’estomper les anciennes', () => {
      reponse(POURCENTAGES, 40)
      reponse(POURCENTAGES, 40)
      // Une seule erreur de 20 jours pèse 0,3 : pas assez pour un conseil.
      reponse('tm.calcul.arithmetique_et_divisibilite', 20)
      expect(jeuxConseilles(db)).toEqual([])
    })

    it('compte double une erreur que le carnet attribue au calcul ou au temps', () => {
      // 10 jours : 0,6 — sous le seuil seule, au-dessus une fois doublée.
      reponse('tm.calcul.arithmetique_et_divisibilite', 10)
      expect(jeuxConseilles(db)).toEqual([])
      reponse('tm.calcul.aires_et_volumes', 10, { cause: 'calcul' })
      expect(jeuxConseilles(db).map((x) => x.jeu)).toEqual(['puissances'])
    })

    it('ne retient une erreur de méthode que si le carnet l’attribue au calcul', () => {
      for (let i = 0; i < 5; i++) reponse('tm.calcul.systemes', 1)
      expect(jeuxConseilles(db)).toEqual([])
      reponse('tm.calcul.systemes', 1, { cause: 'temps' })
      expect(jeuxConseilles(db)).toMatchObject([{ jeu: 'calcul', poids: 2, motif: { erreurs: 1 } }])
    })

    it('ignore les sous-tests sans automatisme, et garde les deux jeux les plus désignés', () => {
      for (let i = 0; i < 5; i++) reponse('tm.comprehension.inference', 1)
      for (let i = 0; i < 4; i++) reponse('tm.logique.suites_de_lettres', 1)
      for (let i = 0; i < 2; i++) reponse('tm.calcul.arithmetique_et_divisibilite', 1)
      reponse('tm.calcul.suites_et_progressions', 1)
      const c = jeuxConseilles(db)
      // lettres 4, suites 4 + 1 = 5, premiers 2.
      expect(c.map((x) => x.jeu)).toEqual(['suites', 'lettres'])
      expect(c[0].poids).toBeCloseTo(5)
    })
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
