import Database from 'better-sqlite3'
import initSqlJs from 'sql.js'
import type { Base } from './base'
import { adapterSqlJs } from './sqljs'
import { lireMigrations } from './migrer.mjs'
import { appliquerMigrations } from './migrer-coeur.mjs'

/**
 * Les deux moteurs de base, pour les tests : chaque test de la base tourne
 * sur l'un et l'autre (`describe.each(MOTEURS)`). Une règle qui ne tiendrait
 * que sur le PC casserait la version iPhone sans que rien ne le signale.
 */
export interface Moteur {
  nom: string
  /** Base vide en mémoire, clés étrangères actives. */
  ouvrir(): Promise<Base>
}

export const MOTEURS: Moteur[] = [
  {
    nom: 'better-sqlite3 (PC)',
    async ouvrir() {
      const d = new Database(':memory:')
      d.pragma('foreign_keys = ON')
      return d
    },
  },
  {
    nom: 'sql.js (navigateur)',
    async ouvrir() {
      const SQL = await initSqlJs()
      const b = adapterSqlJs(new SQL.Database())
      b.pragma('foreign_keys = ON')
      return b
    },
  },
]

/** Base en mémoire au schéma courant. */
export async function baseDeTest(moteur: Moteur): Promise<Base> {
  const b = await moteur.ouvrir()
  appliquerMigrations(b, lireMigrations(), () => {})
  return b
}
