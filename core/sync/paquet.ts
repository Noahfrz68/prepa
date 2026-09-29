import { copieBase, ouvrirCopie } from '@/core/db/client'
import { db } from '@/core/db/queries'
import { MIGRATIONS } from '@/core/db/migrations.gen'
import { appliquerMigrations } from '@/core/db/migrer-coeur.mjs'
import { reconstruireSkillState } from '@/core/db/planification'
import { reconstruireCarte } from '@/core/db/vocabulaire'
import { ecrireFichier, fichierExiste, lireFichier, listerFichiers } from '@/core/fichiers/stockage'
import { ecrireZip, lireZip } from '@/core/import/zip'
import { ErreurRequete } from '@/core/erreurs'
import { fusionner, type Bilan } from './fusion'

/**
 * Le fichier de synchronisation : une archive ZIP qui porte
 *
 *   — manifeste.json : quel appareil, quand, et quels fichiers il possède ;
 *   — app.db : sa base entière ;
 *   — fichiers/… : les figures et audios que l'autre appareil n'a pas encore.
 *
 * On l'exporte d'un appareil et on l'importe sur l'autre, dans les deux sens.
 * L'import FUSIONNE (fusion.ts) : on peut s'entraîner des deux côtés entre deux
 * synchronisations sans rien perdre.
 */

export type Appareil = 'pc' | 'iphone'

export const APPAREIL: Appareil = process.env.NEXT_PUBLIC_CIBLE === 'iphone' ? 'iphone' : 'pc'

const FORMAT = 1
const DOSSIERS_FICHIERS = ['media', 'audio']
/** Copie de la base faite juste avant chaque import, pour revenir en arrière. */
export const COPIE_AVANT_SYNCHRO = 'sauvegardes/avant-derniere-synchro.db'

export interface Manifeste {
  application: 'prepa'
  format: number
  appareil: Appareil
  exporteLe: string
  /** Fichiers (figures, audios) présents sur l'appareil qui exporte. */
  fichiersPresents: string[]
}

export const LIBELLE_APPAREIL: Record<Appareil, string> = { pc: 'PC', iphone: 'iPhone' }

/* ---------------------------------------------------------------- export -- */

/**
 * `complet` : tous les fichiers, même ceux que l'autre appareil a déclaré
 * posséder à la dernière synchronisation (téléphone réinstallé, par exemple).
 */
export async function creerPaquet(complet = false): Promise<{ octets: Uint8Array; nom: string; fichiers: number }> {
  const d = db()
  const presents = await listerFichiers(DOSSIERS_FICHIERS)
  const dejaLaBas = complet
    ? new Set<string>()
    : new Set((d.prepare('SELECT chemin FROM fichier_distant').all() as Array<{ chemin: string }>).map((f) => f.chemin))

  const manifeste: Manifeste = {
    application: 'prepa',
    format: FORMAT,
    appareil: APPAREIL,
    exporteLe: new Date().toISOString(),
    fichiersPresents: presents,
  }

  const entrees: Array<{ nom: string; contenu: Uint8Array; compresser?: boolean }> = [
    { nom: 'manifeste.json', contenu: new TextEncoder().encode(JSON.stringify(manifeste, null, 2)), compresser: true },
    { nom: 'app.db', contenu: await copieBase(), compresser: true },
  ]
  let fichiers = 0
  for (const chemin of presents) {
    if (dejaLaBas.has(chemin)) continue
    const contenu = await lireFichier(chemin)
    if (!contenu) continue
    entrees.push({ nom: `fichiers/${chemin}`, contenu })
    fichiers++
  }

  d.prepare(`INSERT INTO synchronisation (sens, appareil, bilan) VALUES ('export', ?, ?)`).run(
    APPAREIL === 'pc' ? 'iphone' : 'pc',
    JSON.stringify({ fichiers, complet }),
  )

  const jour = manifeste.exporteLe.slice(0, 10)
  return {
    octets: await ecrireZip(entrees),
    nom: `prepa-synchro-${APPAREIL}-${jour}.zip`,
    fichiers,
  }
}

/* ---------------------------------------------------------------- import -- */

export interface ResultatImport {
  appareil: Appareil
  exporteLe: string
  bilan: Bilan
  fichiersRecus: number
  /** Médias dont la base connaît le fichier, absent de cet appareil. */
  fichiersManquants: number
}

export async function importerPaquet(octets: Uint8Array): Promise<ResultatImport> {
  const archive = await lireZip(octets)
  const entree = (nom: string) => archive.fichiers.find((f) => f.nom === nom)?.contenu

  const brut = entree('manifeste.json')
  const base = entree('app.db')
  if (!brut || !base) throw new ErreurRequete('Ce n’est pas un fichier de synchronisation : manifeste ou base absents.')

  let manifeste: Manifeste
  try {
    manifeste = JSON.parse(new TextDecoder().decode(brut)) as Manifeste
  } catch {
    throw new ErreurRequete('Manifeste illisible : le fichier est abîmé.')
  }
  if (manifeste.application !== 'prepa') throw new ErreurRequete('Ce fichier ne vient pas de cette application.')
  if (manifeste.format > FORMAT) {
    throw new ErreurRequete('Ce fichier vient d’une version plus récente de l’application : mets celle-ci à jour.')
  }

  // La base de l'autre appareil, amenée au schéma de celui-ci. Plus récente,
  // elle aurait des colonnes que la fusion ignorerait en silence : on refuse.
  const E = await ouvrirCopie(base)
  try {
    // Seules les migrations de schéma comptent : `_migration` trace aussi les
    // corrections de données faites par des scripts (« script:… »), propres
    // à l'appareil où elles ont tourné.
    const connues = new Set(MIGRATIONS.map((m) => m.nom))
    const siennes = (E.prepare('SELECT nom FROM _migration').all() as Array<{ nom: string }>)
      .map((m) => m.nom)
      .filter((n) => n.endsWith('.sql'))
    const inconnues = siennes.filter((n) => !connues.has(n))
    if (inconnues.length > 0) {
      throw new ErreurRequete(
        `La base reçue a un schéma plus récent (${inconnues.join(', ')}) : mets l’application à jour sur cet appareil.`,
      )
    }
    E.pragma('foreign_keys = OFF')
    appliquerMigrations(E, MIGRATIONS, () => {})

    // Copie de sûreté de la base locale, avant d'y toucher.
    await ecrireFichier(COPIE_AVANT_SYNCHRO, await copieBase())

    // Les fichiers d'abord : leur nom est leur contenu (hash), en écrire un de
    // trop ne coûte rien, alors qu'une base qui pointe vers un fichier absent
    // afficherait une figure manquante.
    let fichiersRecus = 0
    for (const f of archive.fichiers) {
      if (!f.nom.startsWith('fichiers/')) continue
      const chemin = f.nom.slice('fichiers/'.length)
      if (!DOSSIERS_FICHIERS.some((d) => chemin.startsWith(`${d}/`))) continue
      if (await fichierExiste(chemin)) continue
      await ecrireFichier(chemin, f.contenu)
      fichiersRecus++
    }

    const d = db()
    const bilan = fusionner(d, E)
    recalculer()

    // Ce que l'autre appareil possède : on ne le lui renverra pas.
    d.transaction(() => {
      d.prepare('DELETE FROM fichier_distant').run()
      const inserer = d.prepare('INSERT OR IGNORE INTO fichier_distant (chemin) VALUES (?)')
      for (const c of manifeste.fichiersPresents ?? []) inserer.run(c)
    })()

    const presents = new Set(await listerFichiers(DOSSIERS_FICHIERS))
    const attendus = (
      d.prepare('SELECT chemin_fichier FROM media WHERE chemin_fichier IS NOT NULL').all() as Array<{
        chemin_fichier: string
      }>
    ).map((m) => m.chemin_fichier)
    const fichiersManquants = attendus.filter((c) => !presents.has(c)).length

    d.prepare(`INSERT INTO synchronisation (sens, appareil, bilan) VALUES ('import', ?, ?)`).run(
      manifeste.appareil,
      JSON.stringify({ bilan, fichiersRecus, fichiersManquants }),
    )

    return { appareil: manifeste.appareil, exporteLe: manifeste.exporteLe, bilan, fichiersRecus, fichiersManquants }
  } finally {
    E.close()
  }
}

/**
 * Les caches calculés depuis l'historique, refaits sur l'historique fusionné.
 * Sous `sync_verrou` : un recalcul n'est pas une modification, il ne doit pas
 * rendre ces lignes « plus récentes » que celles de l'autre appareil.
 */
function recalculer() {
  const d = db()
  d.transaction(() => {
    d.prepare('INSERT INTO sync_verrou (present) VALUES (1)').run()
    for (const exam of ['tagemage', 'toeic_lr']) reconstruireSkillState(exam)
    for (const c of d.prepare('SELECT id FROM vocab_card').all() as Array<{ id: number }>) reconstruireCarte(c.id)
    d.prepare('DELETE FROM sync_verrou').run()
  })()
}

/* --------------------------------------------------------------- journal -- */

export interface Synchronisation {
  le: string
  sens: 'export' | 'import'
  appareil: Appareil | null
  bilan: unknown
}

export function historiqueSynchronisations(limite = 5): Synchronisation[] {
  return (
    db()
      .prepare(`SELECT le, sens, appareil, bilan FROM synchronisation ORDER BY id DESC LIMIT ?`)
      .all(limite) as Array<{ le: string; sens: 'export' | 'import'; appareil: Appareil | null; bilan: string | null }>
  ).map((s) => ({ ...s, bilan: s.bilan ? JSON.parse(s.bilan) : null }))
}
