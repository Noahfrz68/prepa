import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { migrer } from './migrer.mjs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'app.db')
const MIGRATIONS_DIR = path.join(process.cwd(), 'core', 'db', 'migrations')
const SAUVEGARDES_DIR = path.join(DB_DIR, 'sauvegardes')

/** Sauvegardes quotidiennes conservées ; les plus anciennes sont supprimées. */
export const SAUVEGARDES_GARDEES = 14

/**
 * Attente maximale quand un autre programme écrit dans la base (un script
 * lancé pendant que l'application tourne). Sans elle, SQLite échouait
 * immédiatement sur `SQLITE_BUSY`.
 */
const ATTENTE_VERROU_MS = 5000

// Next.js recharge les modules à chaud en développement : sans ce cache global,
// chaque rechargement ouvrirait une nouvelle connexion sur le même fichier.
const cache = globalThis as unknown as {
  __prepaDb?: Database.Database
  /** Date de modification du dossier des migrations au dernier passage. */
  __prepaMigrations?: number
  /** Dernier contrôle de la sauvegarde du jour (ms). */
  __prepaSauvegarde?: number
  /** Réglages de connexion posés. */
  __prepaReglee?: boolean
}

export function getDb(): Database.Database {
  if (cache.__prepaDb) {
    // La connexion est mise en cache, mais pas le schéma : une migration
    // ajoutée pendant que le serveur tourne doit être appliquée. On ne relit
    // plus le dossier et la table `_migration` à CHAQUE requête : seulement
    // quand le dossier a changé depuis le dernier passage — un `stat`.
    if (process.env.NODE_ENV !== 'production') migrerSiNecessaire(cache.__prepaDb)
    // Une connexion ouverte par une version précédente du module (rechargement
    // à chaud) n'a pas forcément le délai d'attente : on le pose une fois.
    if (!cache.__prepaReglee) {
      cache.__prepaDb.pragma(`busy_timeout = ${ATTENTE_VERROU_MS}`)
      cache.__prepaDb.pragma('journal_size_limit = 4194304')
      cache.__prepaReglee = true
    }
    sauvegarderSiNecessaire(cache.__prepaDb)
    return cache.__prepaDb
  }

  fs.mkdirSync(DB_DIR, { recursive: true })
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma(`busy_timeout = ${ATTENTE_VERROU_MS}`)
  // Le journal WAL n'était jamais reversé dans la base : 4 Mo de journal pour
  // 4 Mo de base. On le fusionne à l'ouverture, et on borne sa taille
  // résiduelle après chaque fusion automatique.
  db.pragma('journal_size_limit = 4194304')
  try {
    db.pragma('wal_checkpoint(TRUNCATE)')
  } catch {
    /* un lecteur tient le journal : la fusion se fera au prochain passage */
  }
  migrerSiNecessaire(db)

  cache.__prepaDb = db
  cache.__prepaReglee = true
  sauvegarderSiNecessaire(db)
  return db
}

function migrerSiNecessaire(db: Database.Database) {
  let modifie = 0
  try {
    modifie = fs.statSync(MIGRATIONS_DIR).mtimeMs
  } catch {
    /* dossier absent : migrer() le signalera */
  }
  if (cache.__prepaMigrations === modifie && modifie !== 0) return
  migrer(db)
  cache.__prepaMigrations = modifie
}

/**
 * Une copie de la base par jour, dans `data/sauvegardes/app-AAAA-MM-JJ.db`,
 * les SAUVEGARDES_GARDEES plus récentes conservées.
 *
 * Toute la progression tient dans un fichier, qu'aucune copie ne protégeait :
 * une migration ratée, une purge de trop, un disque qui lâche, et des
 * semaines de mesures disparaissaient. La copie passe par l'API de sauvegarde
 * de SQLite, cohérente même pendant une écriture, et tourne en arrière-plan.
 * Le contrôle est fait au plus une fois par heure, pour qu'un serveur ouvert
 * plusieurs jours continue d'en produire une chaque jour.
 */
function sauvegarderSiNecessaire(db: Database.Database) {
  const maintenant = Date.now()
  if (cache.__prepaSauvegarde && maintenant - cache.__prepaSauvegarde < 3600_000) return
  cache.__prepaSauvegarde = maintenant

  try {
    fs.mkdirSync(SAUVEGARDES_DIR, { recursive: true })
    const jour = new Date().toLocaleDateString('sv-SE')
    const cible = path.join(SAUVEGARDES_DIR, `app-${jour}.db`)
    if (fs.existsSync(cible)) return

    db.backup(cible)
      .then(() => elaguerSauvegardes())
      .catch((e: unknown) => console.error('[sauvegarde] échec :', e))
  } catch (e) {
    console.error('[sauvegarde] échec :', e)
  }
}

/** Ne touche qu'aux sauvegardes quotidiennes : les copies nommées à la main restent. */
function elaguerSauvegardes() {
  const quotidiennes = fs
    .readdirSync(SAUVEGARDES_DIR)
    .filter((f) => /^app-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
  for (const f of quotidiennes.slice(0, Math.max(0, quotidiennes.length - SAUVEGARDES_GARDEES))) {
    fs.rmSync(path.join(SAUVEGARDES_DIR, f), { force: true })
  }
}

export { DB_PATH }
