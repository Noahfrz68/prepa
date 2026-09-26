/**
 * Composition d'une épreuve complète ou d'un diagnostic.
 *
 * L'ordre des sous-tests suit l'ordre officiel. Il n'est pas configurable :
 * une partie de ce que le blanc entraîne est justement la fatigue accumulée
 * dans cet ordre-là.
 */

import { SECONDES_PAR_QUESTION, SECTIONS, type SectionTageMage } from './index'

export type ModeEpreuve = 'blanc' | 'diagnostic'

export interface Etape {
  section: SectionTageMage
  numero: number
  libelle: string
  bloc: string
  typeItem: 'qcm' | 'conditions_minimales'
  questions: number
  secondes: number
}

/** Un diagnostic couvre les 6 sous-tests, mais 7 questions chacun au lieu de 15. */
export const QUESTIONS_DIAGNOSTIC = 7

/**
 * Sauf la compréhension, qui se sert par textes entiers de cinq questions.
 * En demander 7 faisait tirer deux textes, donc 10 questions à traiter dans
 * le temps de 7 : le sous-test était à la fois plus lourd et plus court que
 * les autres. Un texte, cinq questions, 400 s — la cadence réelle.
 *
 * C'est le repli : quand la banque a un texte long de sept questions
 * validées, la préparation (core/db/epreuve.ts) le sert à la place, 560 s.
 */
export const QUESTIONS_DIAGNOSTIC_COMPREHENSION = 5

/**
 * Le diagnostic garde exactement la même cadence que l'épreuve réelle
 * (80 s par question). C'est ce qui rend son résultat extrapolable : un
 * diagnostic plus confortable mesurerait autre chose que le TAGE MAGE.
 */
export function composerEpreuve(mode: ModeEpreuve): Etape[] {
  return SECTIONS.map((s) => {
    const questions =
      mode === 'blanc'
        ? s.questions
        : s.id === 'comprehension'
          ? QUESTIONS_DIAGNOSTIC_COMPREHENSION
          : QUESTIONS_DIAGNOSTIC
    return {
      section: s.id,
      numero: s.numero,
      libelle: s.libelle,
      bloc: s.bloc,
      typeItem: s.typeItem,
      questions,
      secondes: mode === 'blanc' ? s.minutes * 60 : questions * SECONDES_PAR_QUESTION,
    }
  })
}

/**
 * Coupure tolérée pendant une épreuve (onglet fermé par erreur, page
 * rechargée). Au-delà, le chronomètre est resté gelé assez longtemps pour
 * qu'on ait pu réfléchir hors du temps : l'épreuve n'est plus en conditions
 * réelles.
 */
export const COUPURE_TOLEREE_MS = 5 * 60 * 1000

export function dureeTotaleMinutes(etapes: Etape[]): number {
  return Math.round(etapes.reduce((acc, e) => acc + e.secondes, 0) / 60)
}

export const LIBELLE_MODE: Record<ModeEpreuve, string> = {
  blanc: 'Blanc complet',
  diagnostic: 'Diagnostic',
}
