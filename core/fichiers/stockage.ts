import fs from 'node:fs'
import path from 'node:path'

/**
 * Fichiers de travail de l'application — figures des annales, audios du
 * Listening — désignés par leur chemin relatif (`media/figure-….png`,
 * `audio/….wav`), celui que la base range dans `media.chemin_fichier`.
 *
 * Sur le PC ils sont dans data/. Sur l'iPhone, `stockage-navigateur.ts`
 * prend la place de ce module (resolveAlias de next.config.ts) et les range
 * dans IndexedDB, sous les mêmes chemins : un média synchronisé d'un appareil
 * à l'autre retrouve son fichier.
 */

/**
 * `PREPA_FICHIERS` désigne un autre dossier : les tests s'en servent, comme de
 * `PREPA_DB` pour la base, pour ne jamais écrire dans les vraies données.
 */
const RACINE = path.resolve(process.env.PREPA_FICHIERS?.trim() || path.join(process.cwd(), 'data'))

/** Refuse tout chemin qui sortirait de data/. */
function complet(chemin: string): string {
  const p = path.resolve(RACINE, chemin)
  if (!p.startsWith(RACINE + path.sep)) throw new Error(`Chemin de fichier refusé : ${chemin}`)
  return p
}

export async function lireFichier(chemin: string): Promise<Uint8Array | null> {
  const p = complet(chemin)
  return fs.existsSync(p) ? new Uint8Array(await fs.promises.readFile(p)) : null
}

export async function ecrireFichier(chemin: string, octets: Uint8Array): Promise<void> {
  const p = complet(chemin)
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
  await fs.promises.writeFile(p, octets)
}

export async function fichierExiste(chemin: string): Promise<boolean> {
  return fs.existsSync(complet(chemin))
}

/** Les fichiers présents sous ces dossiers (`media`, `audio`…), en chemins relatifs. */
export async function listerFichiers(dossiers: string[]): Promise<string[]> {
  const chemins: string[] = []
  for (const d of dossiers) {
    const racine = complet(d)
    if (!fs.existsSync(racine)) continue
    for (const e of fs.readdirSync(racine, { withFileTypes: true, recursive: true })) {
      if (!e.isFile()) continue
      const absolu = path.join(e.parentPath, e.name)
      chemins.push(path.relative(RACINE, absolu).split(path.sep).join('/'))
    }
  }
  return chemins.sort()
}
