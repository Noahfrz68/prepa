/**
 * Reprise espacée des erreurs du carnet : à J+1, puis J+3, puis J+7.
 *
 * Revoir une erreur le jour même ne teste que la mémoire immédiate ; la
 * laisser six semaines, c'est la retrouver intacte. Trois reprises à
 * intervalles croissants suffisent à savoir si la démarche est acquise :
 * réussie trois fois de suite après l'erreur, la question est « consolidée »
 * et l'écran propose de la cocher comprise. Toute nouvelle erreur remet le
 * compteur à zéro.
 */

/** Jours entre deux reprises, selon le nombre de réussites depuis la dernière erreur. */
export const INTERVALLES_REPRISE = [1, 3, 7] as const

export interface EtatReprise {
  /** Réussites consécutives depuis la dernière erreur (0 à 3). */
  etape: number
  /** Date (AAAA-MM-JJ) à partir de laquelle la reprise est due ; null si consolidée. */
  dueLe: string | null
  consolidee: boolean
}

const plusJours = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * @param derniereTentative jour (AAAA-MM-JJ) de la dernière réponse à la question
 * @param reussitesDepuisErreur réussites enregistrées après la dernière erreur
 */
export function etatReprise(derniereTentative: string, reussitesDepuisErreur: number): EtatReprise {
  const etape = Math.max(0, Math.min(INTERVALLES_REPRISE.length, reussitesDepuisErreur))
  if (etape >= INTERVALLES_REPRISE.length) return { etape, dueLe: null, consolidee: true }
  return { etape, dueLe: plusJours(derniereTentative, INTERVALLES_REPRISE[etape]), consolidee: false }
}

/**
 * Reprises servies par jour, au plus. La reprise espacée est arrivée sur un
 * carnet déjà rempli : toutes les erreurs antérieures sont devenues dues le
 * même jour — 177 « à rejouer aujourd'hui », une file qu'on ne commence même
 * pas. On en sert quinze par jour, les plus prioritaires ; les autres
 * attendent, et l'arriéré se résorbe de lui-même.
 */
export const PLAFOND_REPRISES_JOUR = 15

export function estDue(e: EtatReprise, aujourdhui: string): boolean {
  return e.dueLe !== null && e.dueLe <= aujourdhui
}
