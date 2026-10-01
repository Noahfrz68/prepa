import type { Alea } from '@/core/generation/alea'
import { calcul } from './jeux/calcul'
import { fractions } from './jeux/fractions'
import { lettres } from './jeux/lettres'
import { premiers } from './jeux/premiers'
import { puissances } from './jeux/puissances'
import type { Jeu, JeuId, Question } from './types'

export type { Attendu, Jeu, JeuId, Question, Saisie } from './types'
export { verifier } from './reponses'

/** Dans l'ordre d'affichage : du plus utile au plus spécialisé. */
export const JEUX: Jeu[] = [calcul, puissances, fractions, premiers, lettres]

const PAR_ID = new Map(JEUX.map((j) => [j.id, j]))

export function jeu(id: string): Jeu | undefined {
  return PAR_ID.get(id as JeuId)
}

/** Combien de questions récentes un fait doit attendre avant de revenir. */
export const ECART_MIN = 4

/**
 * La question suivante, sans reprendre un fait vu dans les `ECART_MIN`
 * dernières : revoir « 17² » deux questions plus tard, c'est se souvenir de
 * l'écran, pas du fait. Après vingt tirages infructueux (un jeu trop étroit),
 * on accepte au moins un fait différent du précédent.
 */
export function questionSuivante(j: Jeu, a: Alea, recentes: readonly string[]): Question {
  const evites = new Set(recentes.slice(-ECART_MIN))
  let q = j.produire(a)
  for (let essai = 0; essai < 20 && evites.has(q.cle); essai++) q = j.produire(a)
  const precedente = recentes.at(-1)
  for (let essai = 0; essai < 20 && q.cle === precedente; essai++) q = j.produire(a)
  return q
}

/** Une série de n questions d'un jeu, d'un seul tirage. */
export function serie(j: Jeu, a: Alea, n: number): Question[] {
  const questions: Question[] = []
  for (let i = 0; i < n; i++) questions.push(questionSuivante(j, a, questions.map((q) => q.cle)))
  return questions
}

/** Au-delà, une réponse juste est « trop lente » : le fait est à revoir. */
export function seuilLent(q: Question): number {
  return q.lentMs ?? PAR_ID.get(q.jeu)!.seuilLentMs
}
