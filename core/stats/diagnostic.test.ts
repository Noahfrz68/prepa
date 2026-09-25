import { describe, expect, it } from 'vitest'
import { ECHELLE_MAX } from '@/core/scoring/tagemage'
import {
  CIBLE_REUSSITE_LEVIER,
  MINIMUM_ESTIMATION,
  TOLERANCE_FATIGUE,
  analyserFatigue,
  ecartACible,
  estimerScore,
  estimerScoreParSousTest,
  intervalleWilson,
  pointsParQuestion,
  troisLeviers,
  type PointFatigue,
} from './diagnostic'

describe('intervalleWilson', () => {
  it('encadre la proportion observée', () => {
    const { bas, haut } = intervalleWilson(50, 100)
    expect(bas).toBeLessThan(0.5)
    expect(haut).toBeGreaterThan(0.5)
  })

  it('se resserre quand l’échantillon grandit', () => {
    const petit = intervalleWilson(5, 10)
    const grand = intervalleWilson(500, 1000)
    expect(haut(grand) - bas(grand)).toBeLessThan(haut(petit) - bas(petit))
  })

  it('reste dans [0, 1] aux proportions extrêmes', () => {
    const zero = intervalleWilson(0, 10)
    expect(zero.bas).toBe(0)
    expect(zero.haut).toBeLessThanOrEqual(1)

    const plein = intervalleWilson(10, 10)
    expect(plein.haut).toBe(1)
    expect(plein.bas).toBeGreaterThan(0)
  })

  it('renvoie l’intervalle maximal sans données', () => {
    expect(intervalleWilson(0, 0)).toEqual({ bas: 0, haut: 1 })
  })

  const bas = (i: { bas: number }) => i.bas
  const haut = (i: { haut: number }) => i.haut
})

describe('pointsParQuestion', () => {
  it('vaut 4 quand on répond à tout et qu’on a tout juste', () => {
    expect(pointsParQuestion(1, 1)).toBe(4)
  })

  it('est nul quand on ne répond à rien', () => {
    expect(pointsParQuestion(0, 1)).toBe(0)
  })

  // Sans pénalité, répondre à tout au pur hasard rapporte encore 0,8 par question.
  it('reste positif même au pur hasard', () => {
    expect(pointsParQuestion(1, 0.2)).toBeCloseTo(0.8)
  })

  it('ne devient jamais négatif, si bas que soit le taux', () => {
    for (const p of [0, 0.05, 0.1, 0.2]) {
      expect(pointsParQuestion(1, p)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('estimerScore', () => {
  it('donne 600 pour un sans-faute intégral', () => {
    const s = estimerScore({ nItems: 90, justes: 90, fausses: 0, blanches: 0 })
    expect(s.score).toBe(ECHELLE_MAX)
    expect(s.tauxReponse).toBe(1)
  })

  it('donne 0 quand tout est laissé blanc', () => {
    const s = estimerScore({ nItems: 90, justes: 0, fausses: 0, blanches: 90 })
    expect(s.score).toBe(0)
    expect(s.tauxReponse).toBe(0)
    expect(s.nRepondues).toBe(0)
  })

  it('encadre le score par un intervalle croissant', () => {
    const s = estimerScore({ nItems: 42, justes: 21, fausses: 21, blanches: 0 })
    expect(s.bas).toBeLessThanOrEqual(s.score)
    expect(s.score).toBeLessThanOrEqual(s.haut)
  })

  it('resserre l’intervalle quand l’échantillon grandit', () => {
    const petit = estimerScore({ nItems: 20, justes: 10, fausses: 10, blanches: 0 })
    const grand = estimerScore({ nItems: 200, justes: 100, fausses: 100, blanches: 0 })
    expect(grand.haut - grand.bas).toBeLessThan(petit.haut - petit.bas)
  })

  it('signale un échantillon trop mince', () => {
    expect(estimerScore({ nItems: MINIMUM_ESTIMATION - 1, justes: 5, fausses: 5, blanches: 0 }).fiable).toBe(false)
    expect(estimerScore({ nItems: MINIMUM_ESTIMATION, justes: 5, fausses: 5, blanches: 0 }).fiable).toBe(true)
  })

  it('ne récompense pas les blanches, mais ne les punit pas non plus', () => {
    // Même réussite sur les répondues, mais l'un répond à tout et l'autre à moitié.
    const tout = estimerScore({ nItems: 40, justes: 30, fausses: 10, blanches: 0 })
    const moitie = estimerScore({ nItems: 40, justes: 15, fausses: 5, blanches: 20 })
    expect(tout.tauxReussiteRepondues).toBeCloseTo(moitie.tauxReussiteRepondues)
    expect(moitie.score).toBeLessThan(tout.score)
  })
})

describe('ecartACible', () => {
  it('chiffre l’écart en bonnes réponses à gagner', () => {
    // 100 points d'échelle = 60 points bruts = 12 conversions à 5 points.
    const e = ecartACible(300, 400)
    expect(e.pointsEchelleManquants).toBe(100)
    expect(e.pointsBrutsManquants).toBe(60)
    expect(e.bonnesReponsesSupplementaires).toBe(15) // 60 points bruts ÷ 4
    expect(e.parSousTest).toBe(3)
    expect(e.atteint).toBe(false)
  })

  it('reconnaît une cible déjà atteinte', () => {
    const e = ecartACible(460, 450)
    expect(e.atteint).toBe(true)
    expect(e.bonnesReponsesSupplementaires).toBe(0)
    expect(e.pointsEchelleManquants).toBe(0)
  })
})

describe('analyserFatigue', () => {
  const point = (position: number, justes: number, n = 15, nonTraitees = 0): PointFatigue => ({
    position,
    section: `s${position}`,
    libelle: `Sous-test ${position}`,
    n,
    justes,
    tauxReussite: n === 0 ? 0 : justes / n,
    tempsMoyenMs: 60_000,
    nonTraitees,
  })

  it('détecte une dégradation en fin d’épreuve', () => {
    const a = analyserFatigue([point(1, 12), point(2, 12), point(3, 11), point(4, 6), point(5, 5), point(6, 4)])
    expect(a.verdict).toBe('degradation')
    expect(a.ecart).toBeLessThan(-TOLERANCE_FATIGUE)
  })

  it('juge stable une performance régulière', () => {
    const a = analyserFatigue([point(1, 9), point(2, 9), point(3, 9), point(4, 9), point(5, 9), point(6, 9)])
    expect(a.verdict).toBe('stable')
  })

  it('détecte une montée en régime', () => {
    const a = analyserFatigue([point(1, 4), point(2, 5), point(3, 5), point(4, 11), point(5, 12), point(6, 12)])
    expect(a.verdict).toBe('progression')
  })

  it('agrège les questions non traitées de la seconde moitié', () => {
    const a = analyserFatigue([point(1, 9), point(2, 9), point(3, 9), point(4, 5, 15, 3), point(5, 5, 15, 4), point(6, 5, 15, 2)])
    expect(a.nonTraiteesSecondeMoitie).toBe(9)
  })

  it('refuse de conclure sur une seule section', () => {
    expect(analyserFatigue([point(1, 9)]).verdict).toBe('donnees_insuffisantes')
  })

  it('écarte les sous-tests vides et refuse de conclure sur moins de quatre', () => {
    const a = analyserFatigue([point(1, 0, 0), point(2, 0, 0), point(3, 9), point(4, 9)])
    expect(a.verdict).toBe('donnees_insuffisantes')
    expect(a.points.map((p) => p.position)).toEqual([3, 4])
  })

  it('compare chaque sous-test à sa réussite habituelle quand elle est connue', () => {
    // Taux bruts en baisse (80 % puis 50 %), mais les sous-tests de fin sont
    // aussi ceux où l'on réussit habituellement 50 % : aucune fatigue.
    const avec = (p: PointFatigue, h: number) => ({ ...p, tauxHabituel: h })
    const a = analyserFatigue([
      avec(point(1, 12), 0.8), avec(point(2, 12), 0.8), avec(point(3, 12), 0.8),
      avec(point(4, 7.5), 0.5), avec(point(5, 7.5), 0.5), avec(point(6, 7.5), 0.5),
    ])
    expect(a.relatif).toBe(true)
    expect(a.verdict).toBe('stable')

    const brut = analyserFatigue([point(1, 12), point(2, 12), point(3, 12), point(4, 7.5), point(5, 7.5), point(6, 7.5)])
    expect(brut.relatif).toBe(false)
    expect(brut.verdict).toBe('degradation')
  })

  it('détecte une vraie fatigue : la fin sous ses propres habitudes', () => {
    const avec = (p: PointFatigue, h: number) => ({ ...p, tauxHabituel: h })
    const a = analyserFatigue([
      avec(point(1, 12), 0.8), avec(point(2, 12), 0.8), avec(point(3, 12), 0.8),
      avec(point(4, 12), 0.8), avec(point(5, 9), 0.8), avec(point(6, 9), 0.8),
    ])
    expect(a.verdict).toBe('degradation')
  })
})

describe('troisLeviers', () => {
  const s = (section: string, justes: number, n = 15, nonTraitees = 0) => ({
    section,
    libelle: section,
    n,
    justes,
    nonTraitees,
  })

  it('classe par points récupérables et n’en garde que trois', () => {
    const l = troisLeviers([s('a', 3), s('b', 12), s('c', 6), s('d', 9)])
    expect(l).toHaveLength(3)
    expect(l[0].section).toBe('a')
    expect(l[0].pointsRecuperables).toBeGreaterThan(l[1].pointsRecuperables)
  })

  it('écarte un sous-test déjà au-delà de la cible : il n’a rien à rapporter', () => {
    const l = troisLeviers([s('a', Math.round(CIBLE_REUSSITE_LEVIER * 15) + 2), s('b', 6)])
    expect(l.map((x) => x.section)).toEqual(['b'])
    expect(l.every((x) => x.pointsRecuperables > 0)).toBe(true)
  })

  it('garde le taux de réussite et y ajoute les questions non traitées', () => {
    const [l] = troisLeviers([s('a', 3, 15, 5)])
    expect(l.raison).toMatch(/20 % de réussite/)
    expect(l.raison).toMatch(/5 questions non traitées/)
  })

  it('ignore les sections jamais vues', () => {
    expect(troisLeviers([s('a', 0, 0)])).toHaveLength(0)
  })
})

describe('estimerScoreParSousTest', () => {
  const st = (nItems: number, justes: number) => ({ nItems, justes, fausses: nItems - justes, blanches: 0 })

  it('donne à chaque sous-test le même poids, quel que soit son nombre de questions', () => {
    // 10 questions à 60 % et 5 sous-tests de 7 questions à 6/7.
    const r = estimerScoreParSousTest([st(10, 6), st(7, 6), st(7, 6), st(7, 6), st(7, 4), st(7, 4)])
    const attendu = Math.round(((0.6 + 3 * (6 / 7) + 2 * (4 / 7)) / 6) * ECHELLE_MAX)
    expect(r.score).toBe(attendu)
  })

  it('coïncide avec l’estimation simple quand les sous-tests sont de même taille', () => {
    const parts = [st(7, 5), st(7, 6), st(7, 3), st(7, 7), st(7, 2), st(7, 4)]
    const simple = estimerScore({ nItems: 42, justes: 27, fausses: 15, blanches: 0 })
    expect(estimerScoreParSousTest(parts).score).toBe(simple.score)
  })

  it('encadre le score par un intervalle qui le contient', () => {
    const r = estimerScoreParSousTest([st(5, 3), st(7, 6), st(7, 6), st(7, 6), st(7, 4), st(7, 4)])
    expect(r.bas).toBeLessThanOrEqual(r.score)
    expect(r.haut).toBeGreaterThanOrEqual(r.score)
    expect(r.haut - r.bas).toBeGreaterThan(50)
  })

  it('écarte les sous-tests vides au lieu de les compter à zéro', () => {
    const r = estimerScoreParSousTest([st(7, 7), st(0, 0), st(7, 7)])
    expect(r.score).toBe(ECHELLE_MAX)
  })
})
