import type { Base } from './base'

/** Applique les migrations reçues qui manquent encore, et renvoie leurs noms. */
export function appliquerMigrations(
  db: Base,
  migrations: ReadonlyArray<{ nom: string; sql: string }>,
  journal?: (ligne: string) => void,
): string[]
