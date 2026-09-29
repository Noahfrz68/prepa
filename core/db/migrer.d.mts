import type { Base } from './base'

export interface Migration {
  nom: string
  sql: string
}

/** Les migrations de core/db/migrations/, lues sur le disque, dans l'ordre. */
export function lireMigrations(racine?: string): Migration[]

/** Applique les migrations en attente et renvoie la liste de celles qui l'ont été. */
export function migrer(db: Base, racine?: string): string[]
