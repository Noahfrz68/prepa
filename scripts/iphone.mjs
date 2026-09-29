/**
 * Build et développement de la version iPhone (site statique, base dans le
 * navigateur). Voir next.config.ts.
 *
 *   npm run iphone:dev     → http://127.0.0.1:3001, à ouvrir dans un navigateur
 *   npm run iphone:build   → out-iphone/, le site à publier
 *
 * `PREPA_CHEMIN_BASE=/prepa` pour un site publié sous un sous-chemin
 * (GitHub Pages : https://<compte>.github.io/<dépôt>/).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const commande = process.argv[2]
const args =
  commande === 'dev' ? ['next', 'dev', '-H', '127.0.0.1', '-p', '3001'] : commande === 'build' ? ['next', 'build'] : null

if (!args) {
  console.error('Usage : node scripts/iphone.mjs dev|build')
  process.exit(1)
}

// SQLite en WebAssembly, servi tel quel à côté des pages (non versionné).
fs.copyFileSync(
  path.join('node_modules', 'sql.js', 'dist', 'sql-wasm-browser.wasm'),
  path.join('public', 'sql-wasm.wasm'),
)

const r = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PREPA_CIBLE: 'iphone' },
})

if (commande === 'build' && r.status === 0) aplatirSegments(path.resolve('out-iphone'))
process.exit(r.status ?? 1)

/**
 * Next écrit les données de préchargement de chaque page dans des
 * sous-dossiers (`tagemage/__next.tagemage/__PAGE__.txt`) mais les demande à
 * plat (`tagemage/__next.tagemage.__PAGE__.txt`) : un serveur Next fait la
 * correspondance, GitHub Pages non. Sans elle, chaque préchargement finit en
 * 404 et la navigation retombe sur un chargement complet. On pose donc une
 * copie à plat à côté de chaque fichier.
 */
function aplatirSegments(racine) {
  let copies = 0
  const parcourir = (dossier) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      const p = path.join(dossier, e.name)
      if (!e.isDirectory()) continue
      if (e.name.startsWith('__next.')) {
        for (const f of fichiersSous(p)) {
          const relatif = path.relative(dossier, f).split(path.sep).join('.')
          fs.copyFileSync(f, path.join(dossier, relatif))
          copies++
        }
      } else {
        parcourir(p)
      }
    }
  }
  parcourir(racine)
  console.log(`[iphone] ${copies} fichiers de préchargement mis à plat`)
}

function fichiersSous(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath ?? e.path, e.name))
}
