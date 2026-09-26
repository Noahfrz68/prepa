import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { migrer } from './migrer.mjs'

const DB_DIR = path.join(process.cwd(), 'data')
/**
 * `PREPA_DB` pointe vers une autre base : les tests de parcours s'en servent
 * pour jouer une série ou une épreuve de bout en bout sans toucher à la
 * vraie. Une base désignée ainsi n'est jamais sauvegardée.
 */
const BASE_ALTERNATIVE = process.env.PREPA_DB?.trim() || null
const DB_PATH = BASE_ALTERNATIVE ? path.resolve(BASE_ALTERNATIVE) : path.join(DB_DIR, 'app.db')
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

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
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
  if (BASE_ALTERNATIVE) return
  const maintenant = Date.now()
  if (cache.__prepaSauvegarde && maintenant - cache.__prepaSauvegarde < 3600_000) return
  cache.__prepaSauvegarde = maintenant

  try {
    fs.mkdirSync(SAUVEGARDES_DIR, { recursive: true })
    const jour = new Date().toLocaleDateString('sv-SE')
    const cible = path.join(SAUVEGARDES_DIR, `app-${jour}.db`)
    if (fs.existsSync(cible)) return

    db.backup(cible)
      .then(() => {
        elaguerSauvegardes(SAUVEGARDES_DIR)
        copierAilleurs(cible)
      })
      .catch((e: unknown) => console.error('[sauvegarde] échec :', e))
  } catch (e) {
    console.error('[sauvegarde] échec :', e)
  }
}

/** Ne touche qu'aux sauvegardes quotidiennes : les copies nommées à la main restent. */
function elaguerSauvegardes(dossier: string) {
  const quotidiennes = fs
    .readdirSync(dossier)
    .filter((f) => /^app-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
  for (const f of quotidiennes.slice(0, Math.max(0, quotidiennes.length - SAUVEGARDES_GARDEES))) {
    fs.rmSync(path.join(dossier, f), { force: true })
  }
}

/**
 * Dossier où recopier chaque sauvegarde quotidienne, hors de ce disque :
 * `PREPA_SAUVEGARDES_EXTERNES` dans .env.local (un dossier OneDrive, une clé
 * USB). Les sauvegardes de data/sauvegardes/ vivent sur le même disque que la
 * base : une panne emporterait les deux. Vide par défaut — envoyer ses
 * données ailleurs est un choix, pas un réglage implicite.
 */
export function dossierSauvegardesExternes(): string | null {
  const d = process.env.PREPA_SAUVEGARDES_EXTERNES?.trim()
  return d ? path.resolve(d) : null
}

function copierAilleurs(source: string) {
  const dossier = dossierSauvegardesExternes()
  if (!dossier || BASE_ALTERNATIVE) return
  try {
    fs.mkdirSync(dossier, { recursive: true })
    fs.copyFileSync(source, path.join(dossier, path.basename(source)))
    elaguerSauvegardes(dossier)
  } catch (e) {
    // Clé débranchée, dossier inaccessible : la sauvegarde locale reste faite.
    console.error('[sauvegarde] copie externe impossible :', e)
  }
}

/**
 * Les sauvegardes présentes, les plus récentes d'abord. Les quotidiennes
 * tournent seules (SAUVEGARDES_GARDEES) ; les copies nommées « avant-… »,
 * faites avant une opération risquée, restent jusqu'à ce qu'on les range.
 */
export function listeSauvegardes(): Array<{ nom: string; octets: number; quotidienne: boolean; le: Date }> {
  if (!fs.existsSync(SAUVEGARDES_DIR)) return []
  return fs
    .readdirSync(SAUVEGARDES_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((nom) => {
      const st = fs.statSync(path.join(SAUVEGARDES_DIR, nom))
      return { nom, octets: st.size, quotidienne: /^app-\d{4}-\d{2}-\d{2}\.db$/.test(nom), le: st.mtime }
    })
    .sort((a, b) => b.le.getTime() - a.le.getTime())
}

/**
 * Range les copies nommées (hors quotidiennes) de plus de `jours` jours.
 * Renvoie les fichiers supprimés ; `essai` ne supprime rien et dit ce qui le
 * serait. Les quotidiennes ne sont jamais touchées ici.
 */
export function rangerSauvegardesNommees(jours: number, essai = true): string[] {
  const limite = Date.now() - jours * 86_400_000
  const vieilles = listeSauvegardes().filter((s) => !s.quotidienne && s.le.getTime() < limite)
  if (!essai) for (const s of vieilles) fs.rmSync(path.join(SAUVEGARDES_DIR, s.nom), { force: true })
  return vieilles.map((s) => s.nom)
}

export { DB_PATH }
