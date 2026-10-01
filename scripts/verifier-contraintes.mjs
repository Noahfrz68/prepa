/**
 * Vérifie que la base refuse elle-même une tentative incomplète
 * (critère d'acceptation n°4), puis purge les données de test.
 *
 * Usage : node scripts/verifier-contraintes.mjs [--purge]
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { migrer } from '../core/db/migrer.mjs'

const db = new Database(path.join(process.cwd(), 'data', 'app.db'))
db.pragma('foreign_keys = ON')
// L'application peut tourner en même temps : attendre qu'elle libère la base.
db.pragma('busy_timeout = 5000')
// Un script ne doit jamais écrire dans un schéma périmé.
migrer(db)

const purgeDemandee = process.argv.includes('--purge')

const sessionId = db
  .prepare(`INSERT INTO exam_session (exam_id, type) VALUES ('tagemage', 'drill')`)
  .run().lastInsertRowid

const itemId = db.prepare(`SELECT id FROM item LIMIT 1`).get()?.id

function attendreEchec(libelle, fn) {
  try {
    fn()
    console.log(`ÉCHEC — ${libelle} : la base a accepté une écriture qu'elle aurait dû refuser.`)
    process.exitCode = 1
  } catch (e) {
    console.log(`OK — ${libelle} refusé par la base (${e.code ?? e.message}).`)
  }
}

// Les contraintes se testent sur un item réel. Sans banque, on saute le test
// mais on exécute quand même la purge si elle est demandée.
if (!itemId) {
  console.log('Aucun item en banque : test de contrainte ignoré.')
}

if (itemId) attendreEchec('confiance NULL', () => {
  db.prepare(
    `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
     VALUES (?, ?, 1, 1000, NULL, 4)`,
  ).run(sessionId, itemId)
})

if (itemId) attendreEchec('confiance hors bornes (5)', () => {
  db.prepare(
    `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
     VALUES (?, ?, 1, 1000, 5, 4)`,
  ).run(sessionId, itemId)
})

if (itemId) attendreEchec('temps_ms NULL', () => {
  db.prepare(
    `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
     VALUES (?, ?, 1, NULL, 3, 4)`,
  ).run(sessionId, itemId)
})

if (itemId) attendreEchec('temps_ms négatif', () => {
  db.prepare(
    `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
     VALUES (?, ?, 1, -1, 3, 4)`,
  ).run(sessionId, itemId)
})

db.prepare(`DELETE FROM exam_session WHERE id = ?`).run(sessionId)

if (purgeDemandee) {
  const purge = db.transaction(() => {
    db.prepare(`DELETE FROM attempt`).run()
    db.prepare(`DELETE FROM exam_session`).run()
    db.prepare(`DELETE FROM item`).run()
    db.prepare(`DELETE FROM skill_state`).run()
    db.prepare(`DELETE FROM study_plan`).run()
    db.prepare(`DELETE FROM vocab_revision`).run()
    db.prepare(`DELETE FROM vocab_card`).run()
    db.prepare(`DELETE FROM ai_job`).run()
    db.prepare(`DELETE FROM coach_memory`).run()
    db.prepare(`DELETE FROM media`).run()
    db.prepare(`DELETE FROM production`).run()
    db.prepare(`DELETE FROM automatisme_reponse`).run()
    db.prepare(`DELETE FROM automatisme_partie`).run()
  })
  purge()
  // Les fichiers audio synthétisés suivent leurs médias : les laisser
  // orphelins sur le disque serait une incohérence.
  fs.rmSync(path.join(process.cwd(), 'data', 'audio'), { recursive: true, force: true })
  console.log('Purge effectuée : banque, sessions, tentatives, calendrier, plans, vocabulaire, mémoire du tuteur, automatismes et audio remis à zéro.')
}

console.log(
  `État : ${db.prepare('SELECT COUNT(*) n FROM item').get().n} items, ` +
    `${db.prepare('SELECT COUNT(*) n FROM attempt').get().n} tentatives, ` +
    `${db.prepare('SELECT COUNT(*) n FROM skill').get().n} sous-compétences.`,
)
