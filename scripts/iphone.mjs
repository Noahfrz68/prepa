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
import crypto from 'node:crypto'
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
  if (r.status === 0) {
    const site = path.resolve('out-iphone')
    aplatirSegments(site)
    ecrireManifeste(site)
    ecrireServiceWorker(site)
    // Sans lui, GitHub Pages passerait le site à Jekyll, qui ignore les
    // dossiers commençant par « _ » — dont _next/, tout le code de l'app.
    fs.writeFileSync(path.join(site, '.nojekyll'), '')
  }
} else {
  r = lancer()
}
process.exit(r.status ?? 1)

/**
 * Le manifeste de l'app installée : nom, icônes, couleurs, et l'adresse où
 * elle démarre — sous le sous-chemin du site publié.
 */
function ecrireManifeste(site) {
  const base = process.env.PREPA_CHEMIN_BASE ?? ''
  const manifeste = {
    name: 'Prépa — TAGE MAGE & TOEIC',
    short_name: 'Prépa',
    description: 'Instrument de mesure et coach de stratégie de score.',
    lang: 'fr',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#0f1115',
    theme_color: '#0f1115',
    icons: [
      { src: `${base}/icones/icone-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icones/icone-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icones/icone-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  fs.writeFileSync(path.join(site, 'manifest.webmanifest'), JSON.stringify(manifeste, null, 2))
}

/**
 * Le service worker : tout le site est mis en cache à l'installation, pour
 * que l'app s'ouvre et fonctionne sans réseau — dans le métro, en avion, en
 * salle d'examen.
 *
 * Sa version est l'empreinte des fichiers du site : un nouveau build change
 * sw.js, le navigateur installe la nouvelle version en arrière-plan, et l'app
 * la propose (app/_iphone/MiseAJour.tsx) au lieu de s'interrompre en pleine
 * série.
 */
function ecrireServiceWorker(site) {
  const base = process.env.PREPA_CHEMIN_BASE ?? ''
  const fichiers = []
  const parcourir = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) parcourir(p)
      else if (e.name !== 'sw.js' && e.name !== '.nojekyll' && !e.name.endsWith('.map')) fichiers.push(p)
    }
  }
  parcourir(site)

  const empreinte = crypto.createHash('sha256')
  const adresses = []
  for (const f of fichiers.sort()) {
    const relatif = path.relative(site, f).split(path.sep).join('/')
    empreinte.update(relatif).update(fs.readFileSync(f))
    // Une page s'appelle par son dossier (`/plan/`), pas par `plan/index.html`.
    adresses.push(`${base}/${relatif.replace(/(^|\/)index\.html$/, '$1')}`)
  }
  const version = empreinte.digest('hex').slice(0, 16)

  const modele = fs.readFileSync(path.join('scripts', 'sw.modele.js'), 'utf8')
  fs.writeFileSync(
    path.join(site, 'sw.js'),
    modele
      .replace('__VERSION__', version)
      .replace('__BASE__', JSON.stringify(base))
      .replace('__ADRESSES__', JSON.stringify(adresses)),
  )
  console.log(`[iphone] service worker ${version} : ${adresses.length} fichiers mis en cache`)
}

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
