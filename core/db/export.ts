import { db } from './queries'

// La copie SQLite dépend du moteur : sauvegarde SQLite sur le PC, base
// sérialisée sur l'iPhone. Chacun la fournit par son module de connexion.
export { copieBase } from '@/core/db/client'

/**
 * « Exporter mes données » : toute la progression, hors de l'application.
 *
 * Deux formats, deux usages :
 *
 *   — la base SQLite entière, copiée par l'API de sauvegarde (cohérente même
 *     pendant une écriture). C'est le format de restauration : remis à la
 *     place de data/app.db, il redonne l'application exactement dans cet état ;
 *   — un JSON lisible, table par table, pour relire ou analyser ailleurs.
 *     Les images (table media) en sont exclues : du binaire en base64 ne se
 *     relit pas, et elles sont dans la copie SQLite.
 */

/** Tables internes ou binaires, laissées hors du JSON. */
const HORS_JSON = new Set(['_migration', 'sqlite_sequence', 'media'])

export interface ExportJson {
  application: 'prepa'
  exporteLe: string
  tables: Record<string, Array<Record<string, unknown>>>
}

export function exportJson(): ExportJson {
  const d = db()
  const noms = (
    d
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .all() as Array<{ name: string }>
  )
    .map((t) => t.name)
    .filter((n) => !HORS_JSON.has(n))

  // Une seule transaction de lecture : toutes les tables au même instant.
  const tables = d.transaction(() =>
    Object.fromEntries(
      noms.map((n) => [
        n,
        d.prepare(`SELECT * FROM "${n.replace(/"/g, '""')}"`).all() as Array<Record<string, unknown>>,
      ]),
    ),
  )()

  return { application: 'prepa', exporteLe: new Date().toISOString(), tables }
}
