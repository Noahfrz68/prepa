/**
 * Recopie core/db/migrations/*.sql dans core/db/migrations.gen.ts.
 *
 * Le navigateur n'a pas de disque où lire les migrations : il les reçoit
 * embarquées dans ce module. Un test (moteurs.test.ts) échoue si le module
 * est en retard sur le dossier — relancer alors `npm run migrations:gen`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { lireMigrations } from '../core/db/migrer.mjs'

export function contenuModuleMigrations(racine = process.cwd()) {
  const lignes = lireMigrations(racine).map(
    ({ nom, sql }) => `  { nom: ${JSON.stringify(nom)}, sql: ${JSON.stringify(sql)} },`,
  )
  return [
    '// Généré par scripts/generer-migrations.mjs — ne pas modifier à la main.',
    '// Source : core/db/migrations/*.sql',
    '',
    "import type { Migration } from './migrer.mjs'",
    '',
    'export const MIGRATIONS: readonly Migration[] = [',
    ...lignes,
    ']',
    '',
  ].join('\n')
}

export const CHEMIN_MODULE = path.join('core', 'db', 'migrations.gen.ts')

// Lancé directement (et non importé par le test) : on écrit le module.
if (process.argv[1]?.endsWith('generer-migrations.mjs')) {
  fs.writeFileSync(path.join(process.cwd(), CHEMIN_MODULE), contenuModuleMigrations())
  console.log(`[migrations] ${CHEMIN_MODULE} régénéré`)
}
