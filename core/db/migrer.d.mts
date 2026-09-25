import type { Database } from 'better-sqlite3'

/** Applique les migrations en attente et renvoie la liste de celles qui l'ont été. */
export function migrer(db: Database, racine?: string): string[]
