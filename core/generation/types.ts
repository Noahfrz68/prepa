import type { SectionTageMage } from '@/exams/tagemage'
import type { Case, Figure } from '@/core/figures/types'

/** Une question fabriquée, avant toute écriture en base. */
export interface QuestionGeneree {
  section: SectionTageMage
  skillId: string
  typeItem: 'qcm' | 'conditions_minimales'
  enonce: string
  /** Vide pour les conditions minimales : les cinq propositions sont fixes. */
  options: string[]
  info1?: string
  info2?: string
  bonneReponse: 'A' | 'B' | 'C' | 'D' | 'E'
  /**
   * La démarche complète, étape par étape.
   *
   * C'est ce qu'on lit quand on s'est trompé ou qu'on a sauté : à ce
   * moment-là, connaître le bon résultat ne sert à rien, ce qu'il faut voir
   * c'est où le chemin bifurque.
   */
  explication: string
  /**
   * Une ligne, le réflexe à retenir. C'est ce qu'on lit quand on a juste.
   *
   * Relire une démarche de cinq lignes pour confirmer ce qu'on vient de faire
   * correctement, c'est du temps de révision dépensé à zéro : on saute le
   * paragraphe, et on prend l'habitude de sauter les corrections.
   */
  rappel?: string
  /**
   * Ce que signifie chaque mauvaise proposition, par lettre.
   *
   * Rendu en face de la proposition effectivement cochée : « tu as répondu C —
   * c'est la plus petite racine ». Une erreur nommée se corrige ; une erreur
   * dont on sait seulement qu'elle en est une se répète.
   */
  diagnostics?: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E', string>>
  /**
   * La disposition de l'énoncé, quand la question est graphique.
   *
   * Le sous-test de logique se joue autant sur la lecture de la disposition
   * que sur la règle : une croix de deux séries rendue en deux lignes de texte
   * supprime la moitié du travail. `enonce` reste rempli — il sert de repli,
   * et c'est lui que lisent la recherche et l'export.
   */
  figure?: Figure
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure?: Case[]
  difficulte: 1 | 2 | 3 | 4 | 5
  /**
   * Demande une relecture avant d'être servie.
   *
   * Les sous-tests calculables n'en ont pas besoin : la réponse est un résultat.
   * Mais dès qu'une famille repose sur un jugement de langue plutôt que sur une
   * règle binaire — registre, reformulation — la bonne réponse est une opinion
   * écrite d'avance, et elle doit passer devant quelqu'un.
   */
  aRelire?: boolean
}

/**
 * Une famille de questions : un moule paramétré.
 *
 * `produire` reçoit un tirage et rend UNE question dont il connaît la réponse
 * parce qu'il l'a calculée. Rien n'est deviné, rien n'est demandé à une IA.
 */
export interface Famille {
  skillId: string
  /** Identifiant court, pour dire d'où vient une question dans un rapport. */
  nom: string
  produire(a: import('./alea').Alea): QuestionGeneree
}

export const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
export type Lettre = (typeof LETTRES)[number]
