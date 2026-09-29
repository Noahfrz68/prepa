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

// Servis tels quels à côté des pages (non versionnés) : SQLite en
// WebAssembly, et le worker de pdfjs pour lire les PDF importés.
fs.copyFileSync(
  path.join('node_modules', 'sql.js', 'dist', 'sql-wasm-browser.wasm'),
  path.join('public', 'sql-wasm.wasm'),
)
fs.copyFileSync(
  path.join('node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'),
  path.join('public', 'pdf.worker.min.mjs'),
)

const lancer = () =>
  spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PREPA_CIBLE: 'iphone', PREPA_EXPORT: commande === 'build' ? '1' : '' },
  })

let r
if (commande === 'build') {
  r = aLAbriDuBuildPc(lancer)
  if (r.status === 0) aplatirSegments(path.resolve('out-iphone'))
} else {
  r = lancer()
}
process.exit(r.status ?? 1)

/**
 * En export statique, Next écrit ses fichiers intermédiaires dans .next, quel
 * que soit `distDir` (next/dist/build : « config.distDir = '.next' ») — là
 * même où se trouve le build du PC. Sans précaution, un `next start` après un
 * build iPhone servait la version iPhone.
 *
 * On met donc le build du PC de côté pendant le build iPhone, puis on efface
 * ce que ce dernier a laissé et on remet le build du PC en place. Le serveur de
 * dev du PC (.next/dev) et le cache (.next/cache) ne sont pas touchés.
 */
function aLAbriDuBuildPc(fn) {
  const DOSSIER = '.next'
  const ABRI = '.next-pc-abri'
  const INTOUCHABLES = new Set(['dev', 'cache'])
  const entrees = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((e) => !INTOUCHABLES.has(e)) : [])

  // Un abri laissé par un build interrompu : le build PC qu'il contient est
  // le bon, on le remet avant toute chose.
  if (fs.existsSync(ABRI)) restaurer()

  fs.mkdirSync(ABRI)
  try {
    for (const e of entrees(DOSSIER)) fs.renameSync(path.join(DOSSIER, e), path.join(ABRI, e))
  } catch (e) {
    restaurer()
    console.error(`[iphone] Impossible de mettre le build du PC de côté (${e.message}).`)
    console.error('[iphone] Un serveur du PC (npm run app / npm start) tient-il ces fichiers ? Arrête-le, puis relance.')
    return { status: 1 }
  }

  try {
    return fn()
  } finally {
    restaurer()
  }

  function restaurer() {
    for (const e of entrees(DOSSIER)) fs.rmSync(path.join(DOSSIER, e), { recursive: true, force: true })
    for (const e of entrees(ABRI)) fs.renameSync(path.join(ABRI, e), path.join(DOSSIER, e))
    fs.rmSync(ABRI, { recursive: true, force: true })
  }
}

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
