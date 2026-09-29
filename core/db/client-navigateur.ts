import type { Base } from './base'
import { ouvrirBaseNavigateur, stockageIndexedDb, type BaseNavigateur } from './navigateur'

/**
 * Connexion à la base, version iPhone : remplace client.ts dans le build
 * `PREPA_CIBLE=iphone` (resolveAlias de next.config.ts). Mêmes exports, pour
 * que tout le code qui importe `@/core/db/client` compile sans le savoir.
 *
 * La différence tient à l'ouverture : sql.js se charge de façon asynchrone,
 * alors que `getDb()` est synchrone partout dans le code. L'app ouvre donc la
 * base une fois, au démarrage (`ouvrirBase`, appelé par app/_iphone/Base.tsx),
 * et n'affiche rien qui la lise avant.
 */

/** SQLite compilé en WebAssembly, copié dans public/ par scripts/iphone.mjs. */
const urlWasm = `${process.env.NEXT_PUBLIC_CHEMIN_BASE ?? ''}/sql-wasm.wasm`

let ouverture: Promise<BaseNavigateur> | null = null
let courante: BaseNavigateur | null = null

export function ouvrirBase(): Promise<BaseNavigateur> {
  ouverture ??= ouvrirBaseNavigateur({
    stockage: stockageIndexedDb(),
    urlWasm,
    surErreur: (e) => {
      console.error('[db] enregistrement impossible :', e)
      window.dispatchEvent(new CustomEvent('prepa:enregistrement-impossible', { detail: e }))
    },
  }).then((b) => (courante = b))
  // Un échec (stockage refusé, WebAssembly absent) doit pouvoir être retenté.
  ouverture.catch(() => (ouverture = null))
  return ouverture
}

export function getDb(): Base {
  if (!courante) throw new Error('La base n’est pas encore ouverte : ouvrirBase() doit être attendu avant.')
  return courante.base
}

/** Enregistre tout de suite ce qui est en attente (avant un export, par exemple). */
export function enregistrerBase(): Promise<void> {
  return courante?.enregistrer() ?? Promise.resolve()
}

/** La base entière, en octets : le même fichier SQLite que sur le PC. */
export async function copieBase(): Promise<Uint8Array> {
  if (!courante) throw new Error('La base n’est pas encore ouverte.')
  await courante.enregistrer()
  return courante.base.exporter()
}

/* Les sauvegardes quotidiennes sont propres au PC : sur l'iPhone, la copie de
   sûreté est le fichier de synchronisation. Les mêmes exports, vides. */

export const SAUVEGARDES_GARDEES = 0
export const DB_PATH = 'IndexedDB : prepa / app.db'

export function dossierSauvegardesExternes(): string | null {
  return null
}

export function listeSauvegardes(): Array<{ nom: string; octets: number; quotidienne: boolean; le: Date }> {
  return []
}

export function rangerSauvegardesNommees(): string[] {
  return []
}
