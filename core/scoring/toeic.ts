/**
 * TOEIC Listening & Reading — barème et conversion de score.
 *
 * L'INVERSE DU TAGE MAGE. Aucune pénalité pour une mauvaise réponse : laisser
 * une case vide ne rapporte rien et ne protège de rien. La seule stratégie
 * correcte est de répondre à tout, et le module ne doit jamais proposer
 * « sauter » comme réponse finale.
 *
 * Toute la logique de barème TOEIC vit ici et nulle part ailleurs.
 */

export const BAREME_TOEIC = {
  juste: 1,
  faux: 0,
  blanc: 0,
} as const

/** Contraste explicite avec le TAGE MAGE, à interroger plutôt qu'à supposer. */
export const PENALISE_ERREUR = false

export const QUESTIONS_PAR_SECTION = 100
export const ECHELLE_MIN = 5
export const ECHELLE_MAX_SECTION = 495
export const TOTAL_MIN = 10
export const TOTAL_MAX = 990

/** Nombre de propositions : 4 en Part 2, 4 partout ailleurs au L&R. */
export const NB_PROPOSITIONS = 4

export type SectionToeic = 'listening' | 'reading'

/**
 * Tables de conversion brut → échelle, par section.
 *
 * ATTENTION : la conversion officielle d'ETS est une table non linéaire qui
 * **change à chaque session**, et n'est pas publiée. Ce qui suit est une
 * approximation par points d'ancrage, interpolée linéairement entre eux.
 *
 * TODO — recalibrer sur des tables officielles si tu en obtiens. Tant que ce
 * TODO est là, aucun score TOEIC ne doit être affiché sans la mention
 * « estimation ».
 */
const ANCRAGES: Record<SectionToeic, Array<[brut: number, echelle: number]>> = {
  listening: [
    [0, 5], [10, 60], [20, 115], [30, 175], [40, 235], [50, 290],
    [60, 340], [70, 390], [80, 435], [90, 470], [96, 490], [100, 495],
  ],
  reading: [
    [0, 5], [10, 30], [20, 75], [30, 130], [40, 190], [50, 245],
    [60, 300], [70, 355], [80, 410], [90, 455], [96, 480], [100, 495],
  ],
}

/** Conversion brut → échelle 5-495, par interpolation entre points d'ancrage. */
export function rawToScaled(section: SectionToeic, justes: number): number {
  const table = ANCRAGES[section]
  const n = Math.max(0, Math.min(QUESTIONS_PAR_SECTION, Math.round(justes)))

  for (let i = 0; i < table.length - 1; i++) {
    const [bA, eA] = table[i]
    const [bB, eB] = table[i + 1]
    if (n >= bA && n <= bB) {
      const t = bB === bA ? 0 : (n - bA) / (bB - bA)
      return Math.round(eA + t * (eB - eA))
    }
  }

  return ECHELLE_MAX_SECTION
}

export function scoreTotal(listeningJustes: number, readingJustes: number): number {
  return rawToScaled('listening', listeningJustes) + rawToScaled('reading', readingJustes)
}

/** Repères d'usage en France, à afficher pour situer un score. */
export const REPERES_TOEIC = {
  b1: 550,
  b2: 785,
  c1: 945,
  exigenceCourante: 785,
}

export interface EstimationToeic {
  justes: number
  nItems: number
  tauxReussite: number
  /** Nombre de justes extrapolé sur 100 questions. */
  justesExtrapoles: number
  scoreSection: number
  bas: number
  haut: number
  fiable: boolean
}

/** En dessous, l'extrapolation à 100 questions ne veut rien dire. */
export const MINIMUM_ESTIMATION_TOEIC = 20

/**
 * Extrapole une série partielle à une section complète de 100 questions.
 *
 * Réutilise l'intervalle de Wilson du module diagnostic : mêmes raisons, même
 * régime de petits échantillons.
 */
export function estimerSection(
  section: SectionToeic,
  justes: number,
  nItems: number,
  intervalle: (succes: number, n: number) => { bas: number; haut: number },
): EstimationToeic {
  const taux = nItems === 0 ? 0 : justes / nItems
  const { bas, haut } = intervalle(justes, nItems)

  return {
    justes,
    nItems,
    tauxReussite: taux,
    justesExtrapoles: Math.round(taux * QUESTIONS_PAR_SECTION),
    scoreSection: rawToScaled(section, taux * QUESTIONS_PAR_SECTION),
    bas: rawToScaled(section, bas * QUESTIONS_PAR_SECTION),
    haut: rawToScaled(section, haut * QUESTIONS_PAR_SECTION),
    fiable: nItems >= MINIMUM_ESTIMATION_TOEIC,
  }
}

/**
 * Points qu'un remplissage au hasard aurait rapportés sur les cases laissées
 * vides. Sert à chiffrer ce que coûte le fait de ne pas remplir — la seule
 * erreur stratégique vraiment gratuite du TOEIC.
 */
export function gainEspereRemplissage(nonTraitees: number): number {
  return nonTraitees / NB_PROPOSITIONS
}
