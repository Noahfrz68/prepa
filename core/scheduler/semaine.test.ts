import { describe, expect, it } from 'vitest'
import {
  MINUTES_BLANC,
  composerSemaine,
  semainesLisibles,
  type BesoinSection,
  type ParametresSemaine,
} from './semaine'

const section = (id: string, taux = 0.6): BesoinSection => ({
  section: id,
  libelle: id,
  taux,
  skillIdsDus: [],
  questionsEnBanque: 200,
})

const base: ParametresSemaine = {
  semaineDu: '2026-09-21',
  budgetMinutes: 600,
  joursRestants: 59,
  lecons: [],
  sections: ['comprehension', 'calcul', 'raisonnement', 'conditions_minimales', 'expression', 'logique'].map(
    (s) => section(s),
  ),
  semainesDepuisDernierBlanc: null,
  aDejaPasseUneEpreuve: true,
  banqueSuffisantePourBlanc: true,
}

const blanc = (p: ReturnType<typeof composerSemaine>) => p.taches.find((t) => t.type === 'blanc')

describe('composerSemaine — blancs', () => {
  it('programme un premier blanc dès maintenant quand aucun n’a jamais été passé', () => {
    const p = composerSemaine(base)
    expect(blanc(p)?.minutes).toBe(MINUTES_BLANC)
    expect(blanc(p)?.raison).toMatch(/Aucun blanc passé/)
  })

  it('attend ensuite la fenêtre des six semaines', () => {
    const p = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3 })
    expect(blanc(p)).toBeUndefined()
  })

  it('en reprogramme un toutes les deux semaines dans la fenêtre', () => {
    expect(blanc(composerSemaine({ ...base, joursRestants: 35, semainesDepuisDernierBlanc: 2 }))).toBeDefined()
    expect(blanc(composerSemaine({ ...base, joursRestants: 35, semainesDepuisDernierBlanc: 1 }))).toBeUndefined()
  })

  it('ne raccourcit jamais un blanc pour le faire tenir dans le budget, et le dit', () => {
    const p = composerSemaine({ ...base, budgetMinutes: 90 })
    expect(blanc(p)).toBeUndefined()
    expect(p.notes.join(' ')).toMatch(/deux heures d’affilée/)
  })

  it('annonce l’échéance et la fenêtre avec des nombres qui tombent juste', () => {
    // 59 jours : 8 semaines avant l'examen, la fenêtre (6 semaines) dans 2.
    const note = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3 }).notes.join(' ')
    expect(note).toMatch(/l’examen est dans 8 semaines/)
    expect(note).toMatch(/soit dans 2 semaines/)
    // Le mot « reste » laissait croire à 8 blancs à passer.
    expect(note).not.toMatch(/il en reste/)
  })
})

describe('semainesLisibles', () => {
  it('parle en jours sous une semaine, en semaines arrondies au-delà', () => {
    expect(semainesLisibles(5)).toBe('5 jours')
    expect(semainesLisibles(7)).toBe('1 semaine')
    expect(semainesLisibles(59)).toBe('8 semaines')
  })
})
