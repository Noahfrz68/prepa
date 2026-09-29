import initSqlJs from 'sql.js'
import { adapterSqlJs, type BaseSqlJs } from './sqljs'
import { appliquerMigrations } from './migrer-coeur.mjs'
import { MIGRATIONS } from './migrations.gen'

/**
 * La base de la version navigateur (iPhone) : SQLite compilé en WebAssembly
 * (sql.js), tenu en mémoire, et recopié dans le stockage du téléphone après
 * chaque écriture.
 *
 * sql.js travaille en mémoire : c'est ce qui lui donne l'API synchrone de
 * better-sqlite3, donc le même code de requêtes. La contrepartie est qu'il
 * faut enregistrer la base soi-même. On le fait peu après chaque écriture
 * (les écritures d'une série se regroupent en un seul enregistrement), et
 * immédiatement quand l'app passe en arrière-plan : iOS peut la fermer sans
 * prévenir ensuite.
 */

/** Où la base est rangée entre deux ouvertures de l'app. */
export interface Stockage {
  lire(): Promise<Uint8Array | null>
  ecrire(octets: Uint8Array): Promise<void>
}

export interface OptionsNavigateur {
  stockage: Stockage
  /** Adresse du fichier sql-wasm.wasm ; inutile sous Node (tests). */
  urlWasm?: string
  /** Délai de regroupement des écritures avant enregistrement. */
  delaiMs?: number
  /** Appelé si un enregistrement échoue (stockage plein, refusé…). */
  surErreur?: (e: unknown) => void
}

export interface BaseNavigateur {
  base: BaseSqlJs
  /** Enregistre tout de suite ce qui est en attente. */
  enregistrer(): Promise<void>
  /** Enregistre ce qui est en attente, puis ferme. */
  fermer(): Promise<void>
}

export async function ouvrirBaseNavigateur(options: OptionsNavigateur): Promise<BaseNavigateur> {
  const { stockage, urlWasm, delaiMs = 400, surErreur = (e) => console.error('[db] enregistrement impossible :', e) } =
    options

  const SQL = await initSqlJs(urlWasm ? { locateFile: () => urlWasm } : undefined)
  const octets = await stockage.lire()

  let minuterie: ReturnType<typeof setTimeout> | null = null
  /** Enregistrements enchaînés : jamais deux écritures concurrentes du stockage. */
  let file: Promise<void> = Promise.resolve()
  let enAttente = false

  function planifier() {
    enAttente = true
    if (minuterie !== null) clearTimeout(minuterie)
    minuterie = setTimeout(() => void enregistrer(), delaiMs)
  }

  function enregistrer(): Promise<void> {
    if (minuterie !== null) {
      clearTimeout(minuterie)
      minuterie = null
    }
    if (!enAttente) return file
    enAttente = false
    // L'export est synchrone, pris maintenant : l'état enregistré est celui
    // de cet instant, même si d'autres écritures suivent pendant l'écriture.
    const copie = base.exporter()
    file = file.then(() => stockage.ecrire(copie)).catch((e) => {
      enAttente = true
      surErreur(e)
    })
    return file
  }

  const base = adapterSqlJs(new SQL.Database(octets ?? undefined), { surEcriture: planifier })
  base.pragma('foreign_keys = ON')
  appliquerMigrations(base, MIGRATIONS)

  const auPassageArrierePlan = () => {
    if (document.visibilityState === 'hidden') void enregistrer()
  }
  const aLaFermeture = () => void enregistrer()
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', auPassageArrierePlan)
    window.addEventListener('pagehide', aLaFermeture)
  }

  return {
    base,
    enregistrer,
    async fermer() {
      await enregistrer()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', auPassageArrierePlan)
        window.removeEventListener('pagehide', aLaFermeture)
      }
      base.close()
    },
  }
}

/* ------------------------------------------------------- Stockages -- */

/**
 * IndexedDB : le stockage durable du navigateur. Sur iPhone, les données
 * d'une app ajoutée à l'écran d'accueil sont conservées tant que l'icône
 * existe — la supprimer les efface, d'où la synchronisation par fichier.
 */
export function stockageIndexedDb(nomBase = 'prepa', cle = 'app.db'): Stockage {
  const MAGASIN = 'base'

  function ouvrir(): Promise<IDBDatabase> {
    return new Promise((ok, ko) => {
      const r = indexedDB.open(nomBase, 1)
      r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN)
      r.onsuccess = () => ok(r.result)
      r.onerror = () => ko(r.error)
    })
  }

  async function operation<T>(mode: IDBTransactionMode, fn: (m: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const idb = await ouvrir()
    try {
      return await new Promise<T>((ok, ko) => {
        const t = idb.transaction(MAGASIN, mode)
        const r = fn(t.objectStore(MAGASIN))
        // On attend la fin de la transaction, pas seulement de la requête :
        // c'est elle qui garantit que l'écriture est sur le disque.
        t.oncomplete = () => ok(r.result)
        t.onerror = () => ko(t.error)
        t.onabort = () => ko(t.error)
      })
    } finally {
      idb.close()
    }
  }

  // Demande au navigateur de ne pas évincer ces données sous pression de
  // stockage. Sans effet si refusé : on essaie, sans en dépendre.
  if (typeof navigator !== 'undefined') void navigator.storage?.persist?.().catch(() => false)

  return {
    async lire() {
      const v = await operation<unknown>('readonly', (m) => m.get(cle))
      return v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : null
    },
    async ecrire(octets) {
      await operation('readwrite', (m) => m.put(octets, cle))
    },
  }
}

/** Stockage en mémoire, pour les tests. */
export function stockageMemoire(initial: Uint8Array | null = null): Stockage & { ecritures: number } {
  let contenu = initial
  const s = {
    ecritures: 0,
    async lire() {
      return contenu
    },
    async ecrire(octets: Uint8Array) {
      contenu = octets.slice()
      s.ecritures++
    },
  }
  return s
}
