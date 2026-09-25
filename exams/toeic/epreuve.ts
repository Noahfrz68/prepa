/**
 * Composition des épreuves TOEIC Reading.
 *
 * Le Listening arrive au lot 8 : il demande la chaîne de synthèse vocale.
 * Le Reading est construit d'abord parce que c'est le point faible déclaré,
 * et parce qu'il ne demande aucun média.
 */

import { BUDGET_READING_MINUTES, MINUTES_READING, PARTS, type PartSpec } from './index'

export type ModeReading = 'section' | 'serie'

export interface EtapeReading extends PartSpec {
  questions: number
  secondes: number
  /** Budget de référence pour cette part, en minutes. */
  budgetMinutes: number
}

export const PARTS_READING = PARTS.filter((p) => p.section === 'reading')

/**
 * Section Reading complète : 100 questions, 75 minutes **globales**.
 *
 * Le budget par part n'est pas un couperet — à l'examen le temps est commun
 * aux trois parts. C'est un repère affiché, parce que l'erreur classique est
 * de surinvestir la Part 5 et de ne pas finir la Part 7, où les questions
 * valent exactement autant.
 */
export function composerReading(): EtapeReading[] {
  return PARTS_READING.map((p) => ({
    ...p,
    questions: p.questions,
    secondes: BUDGET_READING_MINUTES[p.id] * 60,
    budgetMinutes: BUDGET_READING_MINUTES[p.id],
  }))
}

export const SECONDES_READING = MINUTES_READING * 60

/** Cadence moyenne imposée par la section : 75 min pour 100 questions. */
export const SECONDES_PAR_QUESTION_READING = Math.round(SECONDES_READING / 100)

export function budgetCumule(): Array<{ part: string; finMinutes: number }> {
  let cumul = 0
  return PARTS_READING.map((p) => {
    cumul += BUDGET_READING_MINUTES[p.id]
    return { part: p.id, finMinutes: cumul }
  })
}

/**
 * Retard sur le budget, en minutes, à un instant donné de la section.
 * Positif = en retard. C'est le seul indicateur qui compte pendant l'épreuve.
 */
export function retardSurBudget(partCourante: string, minutesEcoulees: number): number {
  const bornes = budgetCumule()
  const index = PARTS_READING.findIndex((p) => p.id === partCourante)
  if (index <= 0) return minutesEcoulees - BUDGET_READING_MINUTES[partCourante]

  const attenduAvant = bornes[index - 1].finMinutes
  return minutesEcoulees - attenduAvant
}
