/**
 * Jeu de données de démonstration, pour explorer l'écran de stratégie sans
 * attendre d'avoir des centaines de tentatives réelles.
 *
 *   node scripts/donnees-demo.mjs --generer
 *   node scripts/donnees-demo.mjs --purge
 *
 * Le profil simulé est volontairement déséquilibré — surconfiance marquée,
 * une sous-compétence « puits de temps » — pour que chaque indicateur de
 * l'écran ait quelque chose à montrer.
 *
 * ATTENTION : ces tentatives sont fictives. Purge-les avant de te fier à ta
 * propre calibration.
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import { migrer } from '../core/db/migrer.mjs'

const db = new Database(path.join(process.cwd(), 'data', 'app.db'))
db.pragma('foreign_keys = ON')
// L'application peut tourner en même temps : attendre qu'elle libère la base.
db.pragma('busy_timeout = 5000')
// Un script ne doit jamais écrire dans un schéma périmé.
migrer(db)

const MARQUEUR = '[DÉMO]'

if (process.argv.includes('--purge')) {
  const purge = db.transaction(() => {
    const items = db.prepare(`SELECT id FROM item WHERE tags = ?`).all(MARQUEUR).map((r) => r.id)
    if (items.length) {
      const trous = items.map(() => '?').join(',')
      db.prepare(`DELETE FROM attempt WHERE item_id IN (${trous})`).run(...items)
      db.prepare(`DELETE FROM item WHERE id IN (${trous})`).run(...items)
    }
    db.prepare(`DELETE FROM exam_session WHERE id NOT IN (SELECT DISTINCT session_id FROM attempt)`).run()
    // Cache dérivé : le laisser survivre à sa source serait une incohérence.
    db.prepare(`DELETE FROM skill_state`).run()
  })
  purge()
  console.log('Données de démonstration supprimées.')
  console.log(etat())
  process.exit(0)
}

if (!process.argv.includes('--generer')) {
  console.log('Usage : node scripts/donnees-demo.mjs --generer | --purge')
  process.exit(0)
}

/* --------------------------------------------------------- génération -- */

// Réussite réelle par niveau de confiance. Le niveau 4 est très en dessous
// de ce qu'il prétend (92 %) : c'est la surconfiance qu'on veut voir sortir.
const REUSSITE = { 1: 0.18, 2: 0.45, 3: 0.66, 4: 0.7 }
const REPARTITION = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4] // tirage du niveau

const SECTIONS = [
  'comprehension',
  'calcul',
  'raisonnement',
  'conditions_minimales',
  'expression',
  'logique',
]
const PUITS = 'tm.calcul.denombrement' // lente ET ratée, pour le puits de temps

let graine = 42
const alea = () => {
  graine = (graine * 1103515245 + 12345) % 2147483648
  return graine / 2147483648
}
const choisir = (arr) => arr[Math.floor(alea() * arr.length)]

const skills = {}
for (const s of SECTIONS) {
  skills[s] = db.prepare(`SELECT id FROM skill WHERE exam_id='tagemage' AND section=?`).all(s).map((r) => r.id)
}

const insererItem = db.prepare(`
  INSERT INTO item (exam_id, section, skill_id, type_item, enonce, options, bonne_reponse, source, statut, tags)
  VALUES ('tagemage', @section, @skill, @type, @enonce, @options, @bonne, 'saisi', 'valide', '${MARQUEUR}')
`)

const insererTentative = db.prepare(`
  INSERT INTO attempt (session_id, item_id, reponse_donnee, est_correct, a_saute, motif_blanc,
                       temps_ms, confiance, points_gagnes)
  VALUES (@session, @item, @reponse, @correct, @saute, @motif, @temps, @confiance, @points)
`)

const LETTRES = ['A', 'B', 'C', 'D', 'E']

const generer = db.transaction(() => {
  const itemsParSection = {}

  for (const section of SECTIONS) {
    itemsParSection[section] = []
    const cm = section === 'conditions_minimales'

    for (let i = 0; i < 15; i++) {
      // Une sous-compétence sur deux tirée au sort, sauf le puits qu'on force.
      const skill = section === 'calcul' && i < 5 ? PUITS : choisir(skills[section])
      const bonne = choisir(LETTRES)
      const info = insererItem.run({
        section,
        skill,
        type: cm ? 'conditions_minimales' : 'qcm',
        enonce: `${MARQUEUR} Question ${section} n°${i + 1}`,
        options: cm ? null : JSON.stringify(LETTRES.map((l) => `Proposition ${l}`)),
        bonne,
        })
      itemsParSection[section].push({ id: Number(info.lastInsertRowid), bonne, skill })
    }
  }

  let tentatives = 0

  for (let serie = 0; serie < 16; serie++) {
    const section = choisir(SECTIONS)
    const sessionId = Number(
      db
        .prepare(`INSERT INTO exam_session (exam_id, type, sections, fin) VALUES ('tagemage','drill',?,datetime('now'))`)
        .run(JSON.stringify([section])).lastInsertRowid,
    )

    for (const item of itemsParSection[section]) {
      const estPuits = item.skill === PUITS
      const saute = alea() < 0.07
      const confiance = saute ? 1 : choisir(REPARTITION)
      // Le puits est raté bien plus souvent, quelle que soit la confiance
      // déclarée : c'est ce qui en fait un candidat au saut, pas au travail.
      const proba = estPuits ? REUSSITE[confiance] * 0.35 : REUSSITE[confiance]
      const correct = saute ? 0 : alea() < proba ? 1 : 0

      // …et il prend deux à trois fois plus longtemps.
      const base = estPuits ? 150_000 : 55_000
      const temps = Math.round(base * (0.6 + alea() * 0.9))

      insererTentative.run({
        session: sessionId,
        item: item.id,
        reponse: saute ? null : correct ? item.bonne : choisir(LETTRES.filter((l) => l !== item.bonne)),
        correct,
        saute: saute ? 1 : 0,
        motif: saute ? 'saute' : null,
        temps,
        confiance,
        points: saute ? 0 : correct ? 4 : -1,
      })
      tentatives++
    }
  }

  console.log(`Généré : ${SECTIONS.length * 15} items et ${tentatives} tentatives fictives.`)
})

generer()
console.log(etat())

function etat() {
  const n = (sql) => db.prepare(sql).get().n
  return (
    `État : ${n('SELECT COUNT(*) n FROM item')} items, ` +
    `${n('SELECT COUNT(*) n FROM attempt')} tentatives, ` +
    `${n('SELECT COUNT(*) n FROM exam_session')} sessions.`
  )
}
