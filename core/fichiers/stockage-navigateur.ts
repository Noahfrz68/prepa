/**
 * Fichiers de travail, version iPhone : remplace stockage.ts dans le build
 * `PREPA_CIBLE=iphone` (resolveAlias de next.config.ts). Mêmes exports, mêmes
 * chemins relatifs, rangés dans IndexedDB plutôt que dans data/.
 *
 * Une base IndexedDB à part de celle de SQLite : les fichiers sont gros et
 * nombreux, et n'ont pas à être réécrits à chaque enregistrement de la base.
 */

const NOM_BASE = 'prepa-fichiers'
const MAGASIN = 'fichiers'

let ouverture: Promise<IDBDatabase> | null = null

function ouvrir(): Promise<IDBDatabase> {
  ouverture ??= new Promise<IDBDatabase>((ok, ko) => {
    const r = indexedDB.open(NOM_BASE, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN)
    r.onsuccess = () => ok(r.result)
    r.onerror = () => ko(r.error)
  })
  ouverture.catch(() => (ouverture = null))
  return ouverture
}

async function operation<T>(mode: IDBTransactionMode, fn: (m: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const idb = await ouvrir()
  return new Promise<T>((ok, ko) => {
    const t = idb.transaction(MAGASIN, mode)
    const r = fn(t.objectStore(MAGASIN))
    t.oncomplete = () => ok(r.result)
    t.onerror = () => ko(t.error)
    t.onabort = () => ko(t.error)
  })
}

function verifier(chemin: string): string {
  if (chemin.startsWith('/') || chemin.split('/').includes('..')) {
    throw new Error(`Chemin de fichier refusé : ${chemin}`)
  }
  return chemin
}

export async function lireFichier(chemin: string): Promise<Uint8Array | null> {
  const v = await operation<unknown>('readonly', (m) => m.get(verifier(chemin)))
  return v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : null
}

export async function ecrireFichier(chemin: string, octets: Uint8Array): Promise<void> {
  // Copie : le tampon reçu peut être une vue sur un tampon plus grand.
  await operation('readwrite', (m) => m.put(octets.slice(), verifier(chemin)))
}

export async function fichierExiste(chemin: string): Promise<boolean> {
  const n = await operation<number>('readonly', (m) => m.count(verifier(chemin)))
  return n > 0
}
