import fs from 'node:fs'
import path from 'node:path'

/**
 * Applique les migrations en attente. Implémentation unique, partagée par le
 * client de l'application et par les scripts en ligne de commande : un script
 * qui écrirait dans un schéma périmé corromprait les données en silence.
 *
 * Fichiers `.sql` numérotés, appliqués dans l'ordre lexicographique, tracés
 * dans `_migration`. Chaque migration est atomique.
 */
export function migrer(db, racine = process.cwd()) {
  const dossier = path.join(racine, 'core', 'db', 'migrations')

  db.exec(`CREATE TABLE IF NOT EXISTS _migration (
    nom         TEXT PRIMARY KEY,
    applique_le TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const dejaApplique = new Set(db.prepare('SELECT nom FROM _migration').all().map((r) => r.nom))

  const fichiers = fs.existsSync(dossier)
    ? fs.readdirSync(dossier).filter((f) => f.endsWith('.sql')).sort()
    : []

  const appliquees = []

  for (const fichier of fichiers) {
    if (dejaApplique.has(fichier)) continue
    const sql = fs.readFileSync(path.join(dossier, fichier), 'utf8')

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
      db.prepare('INSERT INTO _migration (nom) VALUES (?)').run(fichier)
    })

    try {
      appliquer()

      if (sansCles) {
        const casses = db.pragma('foreign_key_check')
        if (casses.length > 0) {
          throw new Error(
            `${fichier} a laissé ${casses.length} référence(s) orpheline(s) : ` +
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

    appliquees.push(fichier)
    console.log(`[db] migration appliquée : ${fichier}`)
  }

  return appliquees
}
