/**
 * Applique les migrations en attente. Implémentation unique, partagée par le
 * client du PC, par celui du navigateur et par les scripts en ligne de
 * commande : un script qui écrirait dans un schéma périmé corromprait les
 * données en silence.
 *
 * Ce module ne touche pas au disque : il reçoit les migrations déjà lues
 * (`migrer.mjs` les lit dans core/db/migrations/ ; le navigateur les tient de
 * `migrations.gen.ts`). Appliquées dans l'ordre lexicographique de leur nom,
 * tracées dans `_migration`, chacune atomique.
 *
 * @param {import('./base').Base} db
 * @param {ReadonlyArray<{ nom: string, sql: string }>} migrations
 * @param {(ligne: string) => void} [journal] où annoncer chaque migration appliquée
 * @returns {string[]} les migrations appliquées par cet appel
 */
export function appliquerMigrations(db, migrations, journal = console.log) {
  db.exec(`CREATE TABLE IF NOT EXISTS _migration (
    nom         TEXT PRIMARY KEY,
    applique_le TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const dejaApplique = new Set(db.prepare('SELECT nom FROM _migration').all().map((r) => r.nom))
  const ordonnees = [...migrations].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0))

  const appliquees = []

  for (const { nom, sql } of ordonnees) {
    if (dejaApplique.has(nom)) continue

    // Reconstruire une table (le seul moyen de modifier une contrainte CHECK
    // dans SQLite) suppose de couper les clés étrangères : le DELETE implicite
    // d'un DROP TABLE viole immédiatement les références, et `defer_foreign_keys`
    // ne le couvre pas. Or `foreign_keys` est sans effet dans une transaction —
    // il faut donc l'ouvrir autour. Ce qui suit n'est pas un contournement :
    // l'intégrité est revérifiée juste après, et la migration est rejetée si
    // elle a cassé quoi que ce soit.
    const sansCles = /^\s*--\s*@sans-cles-etrangeres\s*$/m.test(sql)
    if (sansCles) db.pragma('foreign_keys = OFF')

    const appliquer = db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO _migration (nom) VALUES (?)').run(nom)
    })

    try {
      appliquer()

      if (sansCles) {
        const casses = db.pragma('foreign_key_check')
        if (casses.length > 0) {
          throw new Error(
            `${nom} a laissé ${casses.length} référence(s) orpheline(s) : ` +
              casses
                .slice(0, 3)
                .map((c) => `${c.table}.${c.rowid} → ${c.parent}`)
                .join(', '),
          )
        }
      }
    } finally {
      if (sansCles) db.pragma('foreign_keys = ON')
    }

    appliquees.push(nom)
    journal(`[db] migration appliquée : ${nom}`)
  }

  return appliquees
}
