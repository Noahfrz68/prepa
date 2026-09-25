import { describe, expect, it } from 'vitest'
import { intervalleWilson } from '@/core/stats/diagnostic'
import {
  BAREME_TOEIC,
  ECHELLE_MAX_SECTION,
  ECHELLE_MIN,
  MINIMUM_ESTIMATION_TOEIC,
  NB_PROPOSITIONS,
  PENALISE_ERREUR,
  QUESTIONS_PAR_SECTION,
  TOTAL_MAX,
  TOTAL_MIN,
  estimerSection,
  gainEspereRemplissage,
  rawToScaled,
  scoreTotal,
} from './toeic'

describe('barème', () => {
  // La confusion avec le TAGE MAGE est l'erreur la plus coûteuse du produit.
  it('ne pénalise jamais une mauvaise réponse', () => {
    expect(PENALISE_ERREUR).toBe(false)
    expect(BAREME_TOEIC.faux).toBe(0)
    expect(BAREME_TOEIC.blanc).toBe(0)
    expect(BAREME_TOEIC.faux).toBe(BAREME_TOEIC.blanc)
  })

  it('ne rapporte rien de plus à laisser vide qu’à se tromper', () => {
    expect(BAREME_TOEIC.blanc).not.toBeGreaterThan(BAREME_TOEIC.faux)
  })
})

describe('rawToScaled', () => {
  it('respecte les bornes de l’échelle', () => {
    expect(rawToScaled('listening', 0)).toBe(ECHELLE_MIN)
    expect(rawToScaled('reading', 0)).toBe(ECHELLE_MIN)
    expect(rawToScaled('listening', QUESTIONS_PAR_SECTION)).toBe(ECHELLE_MAX_SECTION)
    expect(rawToScaled('reading', QUESTIONS_PAR_SECTION)).toBe(ECHELLE_MAX_SECTION)
  })

  it('borne les valeurs hors domaine', () => {
    expect(rawToScaled('reading', -10)).toBe(ECHELLE_MIN)
    expect(rawToScaled('reading', 500)).toBe(ECHELLE_MAX_SECTION)
  })

  it('est monotone croissante sur toute la plage', () => {
    for (const section of ['listening', 'reading'] as const) {
      for (let n = 0; n < QUESTIONS_PAR_SECTION; n++) {
        expect(rawToScaled(section, n + 1)).toBeGreaterThanOrEqual(rawToScaled(section, n))
      }
    }
  })

  it('note le Reading plus sévèrement que le Listening à brut égal', () => {
    for (const n of [20, 40, 60, 80]) {
      expect(rawToScaled('reading', n)).toBeLessThan(rawToScaled('listening', n))
    }
  })

  it('interpole entre deux ancrages', () => {
    const a = rawToScaled('reading', 40)
    const b = rawToScaled('reading', 50)
    const milieu = rawToScaled('reading', 45)
    expect(milieu).toBeGreaterThan(a)
    expect(milieu).toBeLessThan(b)
  })
})

describe('scoreTotal', () => {
  it('reste dans les bornes officielles', () => {
    expect(scoreTotal(0, 0)).toBe(TOTAL_MIN)
    expect(scoreTotal(100, 100)).toBe(TOTAL_MAX)
  })

  it('additionne les deux sections', () => {
    expect(scoreTotal(60, 40)).toBe(rawToScaled('listening', 60) + rawToScaled('reading', 40))
  })
})

describe('estimerSection', () => {
  it('extrapole une série partielle à 100 questions', () => {
    const e = estimerSection('reading', 15, 30, intervalleWilson)
    expect(e.tauxReussite).toBeCloseTo(0.5)
    expect(e.justesExtrapoles).toBe(50)
    expect(e.scoreSection).toBe(rawToScaled('reading', 50))
  })

  it('encadre le score par un intervalle', () => {
    const e = estimerSection('reading', 15, 30, intervalleWilson)
    expect(e.bas).toBeLessThanOrEqual(e.scoreSection)
    expect(e.scoreSection).toBeLessThanOrEqual(e.haut)
  })

  it('resserre l’intervalle quand l’échantillon grandit', () => {
    const petit = estimerSection('reading', 10, 20, intervalleWilson)
    const grand = estimerSection('reading', 50, 100, intervalleWilson)
    expect(grand.haut - grand.bas).toBeLessThan(petit.haut - petit.bas)
  })

  it('signale un échantillon trop mince', () => {
    expect(estimerSection('reading', 5, MINIMUM_ESTIMATION_TOEIC - 1, intervalleWilson).fiable).toBe(false)
    expect(estimerSection('reading', 5, MINIMUM_ESTIMATION_TOEIC, intervalleWilson).fiable).toBe(true)
  })

  it('ne divise pas par zéro sur une série vide', () => {
    const e = estimerSection('reading', 0, 0, intervalleWilson)
    expect(e.tauxReussite).toBe(0)
    expect(e.justesExtrapoles).toBe(0)
  })
})

describe('gainEspereRemplissage', () => {
  it('vaut une chance sur quatre par case laissée vide', () => {
    expect(gainEspereRemplissage(4)).toBe(1)
    expect(gainEspereRemplissage(20)).toBe(20 / NB_PROPOSITIONS)
  })

  it('est nul quand tout a été traité', () => {
    expect(gainEspereRemplissage(0)).toBe(0)
  })
})
