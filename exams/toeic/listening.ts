/**
 * TOEIC Listening — structure, accents et temps de préparation.
 *
 * CE QUE CE MODULE ENTRAÎNE VRAIMENT
 * ----------------------------------
 * En Part 3 et 4, la compétence testée n'est pas « comprendre l'anglais » :
 * c'est **lire les questions pendant le silence qui précède l'audio**. Celui
 * qui découvre les questions après l'écoute a déjà perdu. Le module affiche
 * donc les questions AVANT de lancer l'audio, chronomètre ce temps de
 * préparation, et mesure s'il est réellement utilisé.
 *
 * Deuxième règle : **l'audio ne se joue qu'une fois**. Pas de bouton rejouer
 * pendant une série. Le rejeu et le transcript n'apparaissent qu'après la
 * correction.
 */

import { PARTS, type PartSpec } from './index'

export type Accent = 'US' | 'UK' | 'AU' | 'CA'

/**
 * Les quatre accents du TOEIC. Une faiblesse concentrée sur un seul est un
 * diagnostic actionnable qu'aucun outil ne donne — d'où la mesure par accent.
 */
export const ACCENTS: Accent[] = ['US', 'UK', 'AU', 'CA']

export const LIBELLE_ACCENT: Record<Accent, string> = {
  US: 'américain',
  UK: 'britannique',
  AU: 'australien',
  CA: 'canadien',
}

/** Étiquettes BCP-47 correspondantes, pour la synthèse vocale. */
export const LANGUE_ACCENT: Record<Accent, string> = {
  US: 'en-US',
  UK: 'en-GB',
  AU: 'en-AU',
  CA: 'en-CA',
}

export interface PartListening extends PartSpec {
  /** Questions rattachées à un même enregistrement. */
  questionsParAudio: number
  /** Secondes de lecture des questions avant le lancement de l'audio. */
  secondesPreparation: number
  /** Nombre de locuteurs distincts attendus dans l'enregistrement. */
  locuteurs: number
  /** L'énoncé est-il visible avant l'écoute ? Faux en Part 1 et 2. */
  questionsVisiblesAvant: boolean
}

/**
 * Détails par part.
 *
 * En Part 1 et 2 il n'y a rien à lire avant : la question elle-même est dans
 * l'audio. En Part 3 et 4, les trois questions sont écrites et c'est là que se
 * joue la préparation.
 */
export const PARTS_LISTENING: PartListening[] = [
  {
    ...PARTS.find((p) => p.id === 'p1')!,
    questionsParAudio: 1,
    secondesPreparation: 0,
    locuteurs: 1,
    questionsVisiblesAvant: false,
  },
  {
    ...PARTS.find((p) => p.id === 'p2')!,
    questionsParAudio: 1,
    secondesPreparation: 0,
    locuteurs: 2,
    questionsVisiblesAvant: false,
  },
  {
    ...PARTS.find((p) => p.id === 'p3')!,
    questionsParAudio: 3,
    secondesPreparation: 25,
    locuteurs: 2,
    questionsVisiblesAvant: true,
  },
  {
    ...PARTS.find((p) => p.id === 'p4')!,
    questionsParAudio: 3,
    secondesPreparation: 25,
    locuteurs: 1,
    questionsVisiblesAvant: true,
  },
]

export const PARTS_LISTENING_PAR_ID = new Map(PARTS_LISTENING.map((p) => [p.id, p]))

/** Secondes laissées après l'audio pour répondre, avant l'enchaînement. */
export const SECONDES_REPONSE = 8

/**
 * Répartit les accents sur une série, en tournant.
 *
 * Une série homogène en accent ne mesure rien : c'est l'alternance qui révèle
 * une faiblesse sur l'un d'eux.
 */
export function accentPourIndex(index: number, disponibles: Accent[] = ACCENTS): Accent {
  if (disponibles.length === 0) return 'US'
  return disponibles[index % disponibles.length]
}

export interface StatAccent {
  accent: Accent
  libelle: string
  n: number
  justes: number
  tauxReussite: number | null
}

/**
 * Détecte un accent nettement en retrait des autres.
 *
 * Renvoie null tant qu'il n'y a pas assez de matière : un écart sur cinq
 * questions ne veut rien dire.
 */
export const MINIMUM_PAR_ACCENT = 10
export const ECART_ACCENT_SIGNIFICATIF = 0.15

export function accentFaible(stats: StatAccent[]): StatAccent | null {
  const fiables = stats.filter((s) => s.n >= MINIMUM_PAR_ACCENT && s.tauxReussite !== null)
  if (fiables.length < 2) return null

  const tries = [...fiables].sort((a, b) => a.tauxReussite! - b.tauxReussite!)
  const pire = tries[0]
  const moyenneAutres =
    tries.slice(1).reduce((acc, s) => acc + s.tauxReussite!, 0) / (tries.length - 1)

  return moyenneAutres - pire.tauxReussite! >= ECART_ACCENT_SIGNIFICATIF ? pire : null
}
