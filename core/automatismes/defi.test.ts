import { describe, expect, it } from 'vitest'
import { defiDuJour, estJour, JEUX_MIN_DEFI, jourDecale, jourLocal, QUESTIONS_DEFI } from './defi'
import { verifier } from './reponses'

describe('défi du jour', () => {
  it('donne les mêmes questions pour un même jour, sur n’importe quel appareil', () => {
    expect(defiDuJour('2026-10-01').map((q) => q.enonce)).toEqual(defiDuJour('2026-10-01').map((q) => q.enonce))
  })

  it('change d’un jour à l’autre', () => {
    const vus = new Set<string>()
    for (let i = 0; i < 60; i++) vus.add(defiDuJour(jourDecale('2026-10-01', i)).map((q) => q.enonce).join('|'))
    expect(vus.size).toBe(60)
  })

  it(`compte ${QUESTIONS_DEFI} questions, de ${JEUX_MIN_DEFI} jeux au moins, sans fait répété`, () => {
    for (let i = 0; i < 365; i++) {
      const jour = jourDecale('2026-01-01', i)
      const qs = defiDuJour(jour)
      expect(qs, jour).toHaveLength(QUESTIONS_DEFI)
      expect(new Set(qs.map((q) => q.jeu)).size, jour).toBeGreaterThanOrEqual(JEUX_MIN_DEFI)
      expect(new Set(qs.map((q) => q.cle)).size, jour).toBe(QUESTIONS_DEFI)
      for (const q of qs) {
        const juste = q.attendu.genre === 'choix' ? String(q.attendu.valeur) : q.reponse.replace(/^[≈×]\s*/, '')
        expect(verifier(q.attendu, juste), q.enonce).toBe(true)
      }
    }
  })
})

describe('jours', () => {
  it('avance et recule sur le calendrier, fins de mois et d’année comprises', () => {
    expect(jourDecale('2026-10-01', -1)).toBe('2026-09-30')
    expect(jourDecale('2026-12-31', 1)).toBe('2027-01-01')
    expect(jourDecale('2028-02-28', 1)).toBe('2028-02-29')
    expect(jourDecale('2027-03-01', -1)).toBe('2027-02-28')
  })

  it('lit le jour local, et reconnaît un jour valide', () => {
    expect(jourLocal(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01')
    expect(jourLocal(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
    expect(estJour('2026-10-01')).toBe(true)
    for (const j of ['2026-13-01', '2026-1-1', '', null, 20261001]) expect(estJour(j), String(j)).toBe(false)
  })
})
