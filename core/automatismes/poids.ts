import type { Alea } from '@/core/generation/alea'

/**
 * La répétition : quels faits reviennent, et à quelle fréquence.
 *
 * Pas de calendrier de révision à la SM-2 : une partie dure une minute, on y
 * tire des dizaines de faits, et l'enjeu est de faire revenir VITE ce qui a
 * été raté. Chaque fait reçoit un poids d'après sa dernière réponse et sa
 * série de réponses justes et rapides :
 *
 *   — à revoir (dernière réponse fausse ou trop lente) : très fort ;
 *   — jamais vu : un peu plus que la moyenne, pour découvrir le reste ;
 *   — en cours : normal ;
 *   — maîtrisé (trois réponses justes et rapides d'affilée) : rare juste
 *     après, puis de plus en plus présent à mesure que le temps passe — c'est
 *     l'espacement.
 */

export interface EtatFait {
  /** Réponses justes et rapides consécutives, en partant de la dernière. */
  serie: number
  /** La dernière réponse était fausse, ou juste mais trop lente. */
  aRevoir: boolean
  /** Date de la dernière réponse, en millisecondes. */
  vuLe: number
}

/** Par clé de fait (`carre:17`, `rang:P`…). */
export type EtatsFaits = Record<string, EtatFait>

export const SERIE_MAITRISE = 3

const JOUR_MS = 86_400_000

export const POIDS = {
  aRevoir: 10,
  nouveau: 1.5,
  enCours: 1,
  /** Maîtrisé, selon l'ancienneté de la dernière réponse. */
  maitriseRecent: 0.2,
  maitriseSemaine: 0.5,
  maitriseAncien: 1.2,
}

export function poidsFait(e: EtatFait | undefined, maintenant: number): number {
  if (!e) return POIDS.nouveau
  if (e.aRevoir) return POIDS.aRevoir
  if (e.serie < SERIE_MAITRISE) return POIDS.enCours
  const jours = (maintenant - e.vuLe) / JOUR_MS
  return jours < 2 ? POIDS.maitriseRecent : jours < 7 ? POIDS.maitriseSemaine : POIDS.maitriseAncien
}

/** L'état d'un fait après une réponse : ce que la base calculera au prochain affichage. */
export function apresReponse(e: EtatFait | undefined, juste: boolean, lent: boolean, maintenant: number): EtatFait {
  const bonne = juste && !lent
  return { serie: bonne ? (e?.serie ?? 0) + 1 : 0, aRevoir: !bonne, vuLe: maintenant }
}

/** Un élément tiré avec une probabilité proportionnelle à son poids. */
export function tirerPondere<T>(a: Alea, elements: readonly T[], poids: readonly number[]): T {
  const total = poids.reduce((s, p) => s + p, 0)
  // Le tirage passe par `entier` pour rester rejouable à graine égale.
  let x = (a.entier(0, 999_999) / 1_000_000) * total
  for (let i = 0; i < elements.length; i++) {
    x -= poids[i]
    if (x < 0) return elements[i]
  }
  return elements[elements.length - 1]
}
