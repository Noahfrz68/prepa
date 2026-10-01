import type { Alea } from '@/core/generation/alea'
import { calcul } from './jeux/calcul'
import { calendrier } from './jeux/calendrier'
import { formules } from './jeux/formules'
import { fractions } from './jeux/fractions'
import { identites } from './jeux/identites'
import { lettres } from './jeux/lettres'
import { ordres } from './jeux/ordres'
import { premiers } from './jeux/premiers'
import { puissances } from './jeux/puissances'
import { pythagore } from './jeux/pythagore'
import { suites } from './jeux/suites'
import { poidsFait, tirerPondere, type EtatsFaits } from './poids'
import type { Jeu, JeuId, Question } from './types'

export type { Attendu, Jeu, JeuId, Question, Saisie } from './types'
export type { EtatFait, EtatsFaits } from './poids'
export { apresReponse } from './poids'
export { verifier } from './reponses'

/**
 * Deux formats de partie : contre la montre (combien en 60 s) et en série
 * (combien de temps pour 20). Le chronomètre ne compte que le temps de jeu :
 * il s'arrête pendant la lecture d'une correction.
 */
export type FormatPartie = 'chrono' | 'serie'

export const DUREE_CHRONO_MS = 60_000
export const QUESTIONS_SERIE = 20

export const FORMATS: Record<FormatPartie, { libelle: string; but: string }> = {
  chrono: { libelle: '60 secondes', but: 'le plus de bonnes réponses' },
  serie: { libelle: `${QUESTIONS_SERIE} questions`, but: 'le plus de justes, puis le plus vite' },
}

export function estFormat(f: unknown): f is FormatPartie {
  return f === 'chrono' || f === 'serie'
}

/** Dans l'ordre d'affichage : du plus utile au plus spécialisé. */
// Les nouveaux jeux s'ajoutent EN FIN de liste : le défi tire dans cette
// liste, et l'ordre des jeux déjà présents doit rester le même pour que les
// défis passés ne changent pas (voir `defiDepuis`).
export const JEUX: Jeu[] = [
  calcul, puissances, fractions, premiers, lettres, ordres, suites, calendrier,
  pythagore, formules, identites,
]

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

/** Candidats tirés au hasard avant d'en retenir un. */
export const CANDIDATS = 30

/** Faits à revoir proposés à chaque question, les plus récemment ratés d'abord. */
export const REPRISES_MAX = 15

/**
 * La question suivante, pondérée par la répétition (poids.ts).
 *
 * Deux sortes de candidats : des questions tirées au hasard dans les jeux
 * donnés (un seul, ou tous pour le Mélange), et une question ciblée pour
 * chaque fait à revoir — sans elle, un fait rare au tirage (une table parmi
 * cent) ne reviendrait presque jamais. On en retient un selon le poids de son
 * fait. Les faits à revoir pèsent au plus autant que tout le reste : une
 * question sur deux au maximum est une reprise, la partie reste une partie.
 * Les faits des `ECART_MIN` dernières questions sont écartés.
 *
 * `poidsJeux` (Mélange) : un jeu de poids 2 fournit deux fois plus de
 * candidats — ceux que désignent les erreurs réelles. 1 par défaut.
 */
export function choisirQuestion(
  jeux: readonly Jeu[],
  a: Alea,
  recentes: readonly string[],
  etats: EtatsFaits,
  maintenant: number,
  poidsJeux: Partial<Record<JeuId, number>> = {},
): Question {
  const evites = new Set(recentes.slice(-ECART_MIN))
  const poidsDesJeux = jeux.map((j) => poidsJeux[j.id] ?? 1)
  const candidats: Question[] = []
  for (let essai = 0; essai < CANDIDATS * 3 && candidats.length < CANDIDATS; essai++) {
    const q = tirerPondere(a, jeux, poidsDesJeux).produire(a)
    if (!evites.has(q.cle)) candidats.push(q)
  }

  const aReprendre = Object.entries(etats)
    .filter(([cle, e]) => e.aRevoir && !evites.has(cle))
    .sort(([, x], [, y]) => y.vuLe - x.vuLe)
    .slice(0, REPRISES_MAX)
  for (const [cle] of aReprendre) {
    for (const j of jeux) {
      const q = j.produireCle(a, cle)
      if (q) {
        candidats.push(q)
        break
      }
    }
  }

  if (candidats.length === 0) return questionSuivante(a.choix(jeux), a, recentes)

  const poids = candidats.map((q) => poidsFait(etats[q.cle], maintenant))
  const reprise = candidats.map((q) => etats[q.cle]?.aRevoir === true)
  const total = (garder: boolean) => poids.reduce((t, p, i) => (reprise[i] === garder ? t + p : t), 0)
  const repris = total(true)
  const reste = total(false)
  if (repris > reste && reste > 0) {
    const f = reste / repris
    for (let i = 0; i < poids.length; i++) if (reprise[i]) poids[i] *= f
  }
  return tirerPondere(a, candidats, poids)
}

/* ------------------------------------------------------------ mélange -- */

/** Le Mélange : tous les jeux à la fois. Il a ses propres records. */
export const MELANGE = {
  id: 'melange',
  nom: 'Mélange',
  description: 'Tous les jeux mêlés, ce qui est à revoir en priorité. L’échauffement idéal avant une série.',
} as const

/** Ce qu'on joue dans une partie : un jeu, ou le Mélange. */
export type PartieJeuId = JeuId | typeof MELANGE.id

export function estJeuPartie(id: unknown): id is PartieJeuId {
  return id === MELANGE.id || (typeof id === 'string' && PAR_ID.has(id as JeuId))
}

export function jeuxDe(id: PartieJeuId): Jeu[] {
  return id === MELANGE.id ? JEUX : [PAR_ID.get(id)!]
}

export function nomDe(id: PartieJeuId): string {
  return id === MELANGE.id ? MELANGE.nom : PAR_ID.get(id)!.nom
}

export function descriptionDe(id: PartieJeuId): string {
  return id === MELANGE.id ? MELANGE.description : PAR_ID.get(id)!.description
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
