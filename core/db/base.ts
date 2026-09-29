/**
 * Ce que le code attend d'une base SQLite, quel que soit le moteur.
 *
 * Deux moteurs le fournissent :
 *   — better-sqlite3 sur le PC, qui satisfait cette interface tel quel ;
 *   — sql.js dans le navigateur (version iPhone), par l'adaptateur de
 *     `sqljs.ts`, qui en reproduit la sémantique : même liaison des
 *     paramètres, mêmes valeurs rendues, mêmes erreurs.
 *
 * C'est volontairement le sous-ensemble de better-sqlite3 dont le code se
 * sert, et rien de plus : ce qui n'est pas ici n'existe pas dans le
 * navigateur. `backup` par exemple reste propre au PC (voir client.ts).
 */

/** Valeur qu'on peut lier à un paramètre `?` ou `@nom`. */
export type ValeurSql = number | bigint | string | Uint8Array | null

/**
 * Paramètres d'une requête : positionnels (`run(a, b)` ou `run([a, b])`),
 * nommés (`run({ nom })` pour `@nom`, sans le préfixe dans la clé), ou les deux.
 */
export type ParametresSql = ValeurSql | readonly ValeurSql[] | Readonly<Record<string, unknown>>

export interface ResultatEcriture {
  /** Lignes modifiées, insérées ou supprimées par l'instruction. */
  changes: number
  lastInsertRowid: number | bigint
}

export interface Requete {
  /** Première ligne, ou `undefined` s'il n'y en a aucune. */
  get(...params: ParametresSql[]): unknown
  all(...params: ParametresSql[]): unknown[]
  run(...params: ParametresSql[]): ResultatEcriture
}

export interface Base {
  prepare(sql: string): Requete
  /** Exécute une ou plusieurs instructions, sans paramètres ni résultat. */
  exec(sql: string): this
  /**
   * Enveloppe `fn` dans une transaction : validée si `fn` rend la main,
   * annulée si elle lève. Imbriquée, elle devient un point de sauvegarde.
   * `fn` doit être synchrone.
   */
  transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R
  /**
   * `PRAGMA …` : rend les lignes, ou la première valeur de la première ligne
   * avec `{ simple: true }`.
   */
  pragma(source: string, options?: { simple?: boolean }): unknown
  close(): void
}
