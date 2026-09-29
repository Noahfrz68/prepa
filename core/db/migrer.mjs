import fs from 'node:fs'
import path from 'node:path'
import { appliquerMigrations } from './migrer-coeur.mjs'

/** Les migrations de core/db/migrations/, lues sur le disque. */
export function lireMigrations(racine = process.cwd()) {
  const dossier = path.join(racine, 'core', 'db', 'migrations')
  if (!fs.existsSync(dossier)) return []
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((nom) => ({ nom, sql: fs.readFileSync(path.join(dossier, nom), 'utf8') }))
}

/**
 * Applique les migrations en attente, lues sur le disque. Côté PC et scripts ;
 * la logique elle-même est dans `migrer-coeur.mjs`, commune au navigateur.
 */
export function migrer(db, racine = process.cwd()) {
  return appliquerMigrations(db, lireMigrations(racine))
}
