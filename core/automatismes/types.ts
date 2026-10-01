import type { Alea } from '@/core/generation/alea'

/**
 * Les automatismes : ce qui doit sortir sans calcul le jour de l'épreuve.
 *
 * Contrairement aux questions du drill, celles-ci ne sont jamais stockées :
 * elles sont tirées à la volée, dans le navigateur, et ne vivent que le temps
 * d'une partie. Ce qu'on garde, c'est le FAIT travaillé (`cle`) : « 17² »,
 * « rang de P », « 91 est-il premier ». C'est sur lui que portent la
 * répétition et les records, pas sur un énoncé.
 */

export type JeuId =
  | 'calcul'
  | 'puissances'
  | 'fractions'
  | 'premiers'
  | 'lettres'
  | 'ordres'
  | 'suites'
  | 'calendrier'
  | 'pythagore'
  | 'formules'
  | 'identites'

/** Ce qu'on attend, et comment le reconnaître dans une saisie libre. */
export type Attendu =
  /** `tolerance` absolue : 14,3 et 14,29 valent 1/7 en pourcentage. */
  | { genre: 'nombre'; valeur: number; tolerance?: number }
  /** Une fraction exigée comme telle : « 3/8 », ou toute fraction égale. */
  | { genre: 'fraction'; numerateur: number; denominateur: number }
  | { genre: 'lettre'; valeur: string }
  | { genre: 'ouinon'; valeur: boolean }
  /** Une décomposition : les facteurs premiers avec leur multiplicité. */
  | { genre: 'facteurs'; valeur: number }
  /** L'indice de la bonne proposition dans `Question.choix`, à partir de 0. */
  | { genre: 'choix'; valeur: number }

/**
 * Le clavier à proposer : numérique, numérique avec signe (le pavé décimal de
 * l'iPhone n'a pas de « − »), texte, deux boutons, ou une proposition à
 * choisir (`Question.choix`).
 */
export type Saisie = 'nombre' | 'relatif' | 'texte' | 'ouinon' | 'choix'

export interface Question {
  jeu: JeuId
  /** Le fait travaillé, stable d'une partie à l'autre : `carre:17`, `rang:P`. */
  cle: string
  enonce: string
  /** Indication de format, sous l'énoncé, quand elle n'est pas évidente. */
  aide?: string
  attendu: Attendu
  saisie: Saisie
  /** La réponse telle qu'on l'affiche : « 289 », « oui », « 2³ × 3² × 5 ». */
  reponse: string
  /** Correction courte, quand c'est juste : « 17² = 289 ». */
  solution: string
  /** Correction longue, quand c'est faux : le geste qui donne la réponse. */
  astuce: string
  /** Titre de la table du cours (TABLES) à revoir, s'il y en a une. */
  table?: string
  /** Seuil « trop lent » propre à cette question, s'il diffère de celui du jeu. */
  lentMs?: number
  /** Les propositions, pour une saisie `choix`. */
  choix?: string[]
}

export interface Jeu {
  id: JeuId
  nom: string
  description: string
  /** Au-delà, une réponse juste compte comme « trop lente » : à revoir. */
  seuilLentMs: number
  /**
   * Premier jour (AAAA-MM-JJ) où le jeu entre dans le défi du jour. Un jeu
   * ajouté changerait sinon le tirage des défis déjà joués, et deux appareils
   * pas encore à la même version n'auraient plus le même défi.
   */
  defiDepuis?: string
  produire(a: Alea): Question
  /**
   * Une question sur un fait précis, pour la répétition : c'est ainsi qu'un
   * fait raté revient, même rare au tirage (une table parmi cent). Une clé
   * de catégorie (`x5`, `decomposition`) donne une autre question du même
   * genre. Null si la clé n'est pas de ce jeu.
   */
  produireCle(a: Alea, cle: string): Question | null
}
