/**
 * Difficulté observée d'une question, tirée des réponses réelles.
 *
 * Le problème d'une application mono-utilisateur : chaque question n'a qu'une
 * à trois réponses. Un taux brut y vaut 0 % ou 100 % au hasard d'une seule
 * réponse — une question ratée une fois n'est pas « impossible ». On emploie
 * donc un estimateur rétréci (bayésien, prior bêta) : le taux de la question
 * est tiré vers celui de son type de question, d'autant plus fort qu'elle a
 * peu de réponses. Avec FORCE_PRIOR = 4, une question répondue une fois pèse
 * pour un cinquième ; à vingt réponses, elle parle presque seule.
 */

/** Poids du taux de référence, en « réponses fictives ». */
export const FORCE_PRIOR = 4

/** En dessous, la difficulté affichée reste une indication. */
export const REPONSES_POUR_FIABLE = 5

export interface DifficulteObservee {
  /** Réussite estimée, entre 0 et 1. */
  reussiteEstimee: number
  /** 1 = très facile … 5 = très difficile. */
  niveau: 1 | 2 | 3 | 4 | 5
  n: number
  justes: number
  fiable: boolean
}

export const LIBELLE_DIFFICULTE: Record<DifficulteObservee['niveau'], string> = {
  1: 'très facile',
  2: 'facile',
  3: 'moyenne',
  4: 'difficile',
  5: 'très difficile',
}

export function difficulteObservee(
  justes: number,
  n: number,
  tauxReference: number | null,
): DifficulteObservee {
  const ref = tauxReference ?? 0.6
  const p = (justes + FORCE_PRIOR * ref) / (n + FORCE_PRIOR)
  const niveau: DifficulteObservee['niveau'] =
    p >= 0.85 ? 1 : p >= 0.7 ? 2 : p >= 0.5 ? 3 : p >= 0.3 ? 4 : 5
  return { reussiteEstimee: p, niveau, n, justes, fiable: n >= REPONSES_POUR_FIABLE }
}
