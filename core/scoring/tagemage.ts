/**
 * TAGE MAGE — barème et conversion de score.
 *
 * TOUTE la logique de barème vit dans ce fichier et nulle part ailleurs
 * (spécification §6). Si la formule officielle change, un seul endroit bouge.
 */

/**
 * Barème officiel.
 *
 * La pénalité de −1 par mauvaise réponse a été supprimée : une erreur vaut
 * désormais 0, comme une case vide. Ce n'est pas un détail de calcul, c'est un
 * renversement de stratégie : laisser une case blanche n'a plus jamais de sens.
 * Voir estRentableDeRepondre plus bas.
 */
export const BAREME = {
  juste: 4,
  faux: 0,
  blanc: 0,
} as const

export const NB_QUESTIONS = 90
export const POINTS_BRUTS_MAX = NB_QUESTIONS * BAREME.juste // 360
export const ECHELLE_MAX = 600
export const NB_PROPOSITIONS = 5

/**
 * Probabilité de tomber juste au hasard entre cinq propositions.
 *
 * Sans pénalité, ce nombre n'est plus un SEUIL : il n'y a plus rien à
 * franchir. Répondre au hasard rapporte 0,2 × 4 = 0,8 point en moyenne,
 * laisser vide rapporte 0. Il est conservé parce qu'il sert encore à chiffrer
 * ce que coûte une case laissée blanche.
 */
export const HASARD = 1 / NB_PROPOSITIONS // 0.2

/** Ce qu'une case vide laisse sur la table, en points bruts : l'espérance d'une croix au hasard. */
export const MANQUE_CASE_VIDE = HASARD * BAREME.juste // 0.8

export type Issue = 'juste' | 'faux' | 'blanc'

export function issueDe(reponse: string | null, bonneReponse: string): Issue {
  if (reponse === null || reponse === '') return 'blanc'
  return reponse === bonneReponse ? 'juste' : 'faux'
}

export function pointsDe(issue: Issue): number {
  return BAREME[issue]
}

/**
 * Score brut sur l'épreuve.
 *
 * Le plancher à 0 ne sert plus à rien depuis la suppression de la pénalité —
 * aucune issue ne retire de points. Il est gardé pour que la fonction reste
 * juste si le barème redevenait pénalisant.
 */
export function scoreBrut(issues: Issue[]): number {
  const total = issues.reduce((acc, i) => acc + pointsDe(i), 0)
  return Math.max(0, total)
}

/**
 * Conversion score brut → échelle sur 600.
 *
 * TODO — vérifier la formule officielle FNEGE et la substituer ici.
 * L'approximation linéaire ci-dessous est un placeholder assumé : tout score
 * affiché à partir d'elle doit être présenté comme une estimation.
 */
export function bruteToScaled(pointsBruts: number): number {
  const borne = Math.max(0, Math.min(POINTS_BRUTS_MAX, pointsBruts))
  return Math.round((borne / POINTS_BRUTS_MAX) * ECHELLE_MAX)
}

/** Espérance de points en répondant, sachant une probabilité p d'avoir juste. */
export function esperancePoints(p: number): number {
  return p * BAREME.juste + (1 - p) * BAREME.faux
}

/**
 * Répondre est-il rentable ?
 *
 * Toujours, désormais, et la fonction le dit plutôt que de le calculer : sans
 * pénalité, une mauvaise réponse et une case vide valent 0 toutes les deux,
 * mais la mauvaise réponse avait une chance d'être bonne. Laisser une case
 * blanche est donc strictement dominé — il n'existe aucune situation, aucun
 * niveau de doute, où s'abstenir rapporte davantage.
 */
export function estRentableDeRepondre(_p: number): boolean {
  return true
}

/**
 * Ce que coûte, en points bruts, le fait de laisser des cases vides.
 *
 * C'est le chiffre qui remplace l'ancien calcul de seuil : il ne s'agit plus
 * de savoir QUAND répondre, mais de mesurer ce qu'on a perdu à ne pas l'avoir
 * fait. Une case blanche coûte en moyenne 0,8 point brut.
 */
export function coutDesBlanches(nbBlanches: number): number {
  return nbBlanches * HASARD * BAREME.juste
}

export interface Reperes {
  moyenneNationale: [number, number]
  bon: number
  tresBon: number
  topEcoles: number
}

export const REPERES: Reperes = {
  moyenneNationale: [200, 210],
  bon: 300,
  tresBon: 400,
  topEcoles: 450,
}

export interface ResultatSerie {
  nbItems: number
  justes: number
  fausses: number
  blanches: number
  pointsBruts: number
  /** Score sur 600 extrapolé au format complet. Estimation, à afficher comme telle. */
  scoreExtrapole: number
  tauxReussite: number
}

/**
 * Résultat d'une série d'entraînement plus courte que l'épreuve réelle.
 * Le score est extrapolé au prorata : c'est une estimation grossière sur un
 * petit échantillon, et l'interface doit le dire.
 */
export function resultatSerie(issues: Issue[]): ResultatSerie {
  const justes = issues.filter((i) => i === 'juste').length
  const fausses = issues.filter((i) => i === 'faux').length
  const blanches = issues.filter((i) => i === 'blanc').length
  const pointsBruts = scoreBrut(issues)
  const maxSerie = issues.length * BAREME.juste

  return {
    nbItems: issues.length,
    justes,
    fausses,
    blanches,
    pointsBruts,
    scoreExtrapole:
      maxSerie === 0 ? 0 : Math.round((pointsBruts / maxSerie) * ECHELLE_MAX),
    tauxReussite: issues.length === 0 ? 0 : justes / issues.length,
  }
}
