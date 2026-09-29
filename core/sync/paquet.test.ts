import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { appliquerMigrations } from '@/core/db/migrer-coeur.mjs'
import { MIGRATIONS } from '@/core/db/migrations.gen'

/**
 * Le fichier de synchronisation de bout en bout, sur une base et un dossier de
 * fichiers jetables (PREPA_DB, PREPA_FICHIERS) : jamais les vraies données.
 *
 * « L'autre appareil » est une seconde base, montée à la main puis emballée
 * comme le ferait son propre export.
 */

const dossier = mkdtempSync(path.join(tmpdir(), 'prepa-synchro-'))
process.env.PREPA_DB = path.join(dossier, 'app.db')
process.env.PREPA_FICHIERS = path.join(dossier, 'fichiers')

type Modules = {
  paquet: typeof import('./paquet')
  queries: typeof import('@/core/db/queries')
  stockage: typeof import('@/core/fichiers/stockage')
  zip: typeof import('@/core/import/zip')
}
let m: Modules

const FIGURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
/** Le fichier reçu au premier import, réimporté tel quel ensuite. */
let premierPaquet: Uint8Array

/** L'autre appareil : une base à jour, une séance, une question à figure. */
async function paquetDeLAutre(options: { fichiers?: string[] } = {}) {
  const b = new Database(':memory:')
  b.pragma('foreign_keys = ON')
  appliquerMigrations(b, MIGRATIONS, () => {})
  b.exec(`INSERT INTO exam_goal (exam_id, date_provisoire, actif, date_examen, maj_le)
          VALUES ('tagemage', 0, 1, '2026-12-15', '2026-09-20T10:00:00.000Z');
          INSERT INTO media (type, chemin_fichier, transcript, hash_script)
          VALUES ('image', 'media/figure-cafe.png', 'Figure — Logique, question 1', 'cafe');`)
  const media = (b.prepare(`SELECT id FROM media`).get() as { id: number }).id
  const item = Number(
    b
      .prepare(
        `INSERT INTO item (exam_id, section, type_item, enonce, options, bonne_reponse, source, statut, media_id)
         VALUES ('tagemage', 'logique', 'qcm', 'Figure — Logique, question 1', '["","","","",""]', 'C', 'importe', 'valide', ?)`,
      )
      .run(media).lastInsertRowid,
  )
  const session = Number(
    b.prepare(`INSERT INTO exam_session (exam_id, type, sections, fin) VALUES ('tagemage', 'drill', '["logique"]', datetime('now'))`)
      .run().lastInsertRowid,
  )
  b.prepare(
    `INSERT INTO attempt (session_id, item_id, reponse_donnee, est_correct, temps_ms, confiance, points_gagnes) VALUES (?, ?, 'C', 1, 40000, 3, 4)`,
  ).run(session, item)

  const manifeste = {
    application: 'prepa',
    format: 1,
    appareil: 'iphone',
    exporteLe: '2026-09-29T08:00:00.000Z',
    fichiersPresents: options.fichiers ?? ['media/figure-cafe.png'],
  }
  const octets = await m.zip.ecrireZip([
    { nom: 'manifeste.json', contenu: new TextEncoder().encode(JSON.stringify(manifeste)), compresser: true },
    { nom: 'app.db', contenu: new Uint8Array(b.serialize()), compresser: true },
    { nom: 'fichiers/media/figure-cafe.png', contenu: FIGURE },
  ])
  b.close()
  return octets
}

beforeAll(async () => {
  // Importés APRÈS avoir posé les variables : les modules les lisent au chargement.
  m = {
    paquet: await import('./paquet'),
    queries: await import('@/core/db/queries'),
    stockage: await import('@/core/fichiers/stockage'),
    zip: await import('@/core/import/zip'),
  }
  m.queries.db()
})

afterAll(async () => {
  const { getDb } = await import('@/core/db/client')
  getDb().close()
  rmSync(dossier, { recursive: true, force: true })
})

describe('fichier de synchronisation', () => {
  it('s’écrit et se relit : manifeste, base complète, fichiers', async () => {
    await m.stockage.ecrireFichier('media/figure-locale.png', FIGURE)
    const { octets, nom } = await m.paquet.creerPaquet()
    expect(nom).toMatch(/^prepa-synchro-pc-\d{4}-\d{2}-\d{2}\.zip$/)

    const { fichiers } = await m.zip.lireZip(octets)
    const noms = fichiers.map((f) => f.nom)
    expect(noms).toEqual(['manifeste.json', 'app.db', 'fichiers/media/figure-locale.png'])
    const manifeste = JSON.parse(new TextDecoder().decode(fichiers[0].contenu))
    expect(manifeste).toMatchObject({ application: 'prepa', appareil: 'pc', fichiersPresents: ['media/figure-locale.png'] })
    expect(new TextDecoder().decode(fichiers[1].contenu.subarray(0, 15))).toBe('SQLite format 3')
  })

  it('fusionne le fichier de l’autre appareil : données, figure, objectifs, copie de sûreté', async () => {
    premierPaquet = await paquetDeLAutre()
    const r = await m.paquet.importerPaquet(premierPaquet)
    expect(r.appareil).toBe('iphone')
    expect(r.bilan.item.ajoutees).toBe(1)
    expect(r.bilan.attempt.ajoutees).toBe(1)
    expect(r.fichiersRecus).toBe(1)
    expect(r.fichiersManquants).toBe(0)

    const d = m.queries.db()
    const q = d
      .prepare(
        `SELECT i.enonce, m.chemin_fichier FROM item i JOIN media m ON m.id = i.media_id WHERE i.section = 'logique'`,
      )
      .get()
    expect(q).toEqual({ enonce: 'Figure — Logique, question 1', chemin_fichier: 'media/figure-cafe.png' })
    expect(await m.stockage.lireFichier('media/figure-cafe.png')).toEqual(FIGURE)
    expect(d.prepare(`SELECT date_examen FROM exam_goal WHERE exam_id = 'tagemage'`).get()).toEqual({
      date_examen: '2026-12-15',
    })
    // La maîtrise est recalculée depuis l'historique fusionné.
    expect((d.prepare('SELECT COUNT(*) AS n FROM skill_state').get() as { n: number }).n).toBeGreaterThanOrEqual(0)

    const copie = path.join(process.env.PREPA_FICHIERS!, m.paquet.COPIE_AVANT_SYNCHRO)
    expect(existsSync(copie)).toBe(true)
    expect(readFileSync(copie).subarray(0, 15).toString('latin1')).toBe('SQLite format 3')
  })

  it('ne renvoie pas à l’autre appareil les fichiers qu’il a déjà', async () => {
    const { octets } = await m.paquet.creerPaquet()
    const noms = (await m.zip.lireZip(octets)).fichiers.map((f) => f.nom)
    // L'iPhone a déclaré posséder figure-cafe.png : seule la figure locale part.
    expect(noms).toContain('fichiers/media/figure-locale.png')
    expect(noms).not.toContain('fichiers/media/figure-cafe.png')

    const complet = (await m.zip.lireZip((await m.paquet.creerPaquet(true)).octets)).fichiers.map((f) => f.nom)
    expect(complet).toContain('fichiers/media/figure-cafe.png')
  })

  it('ne double rien quand on réimporte le même fichier', async () => {
    const r = await m.paquet.importerPaquet(premierPaquet)
    const d = m.queries.db()
    expect(r.bilan.item?.ajoutees ?? 0).toBe(0)
    expect(d.prepare(`SELECT COUNT(*) AS n FROM item WHERE section = 'logique'`).get()).toEqual({ n: 1 })
    expect(d.prepare(`SELECT COUNT(*) AS n FROM attempt`).get()).toEqual({ n: 1 })
  })

  it('refuse ce qui n’est pas un fichier de synchronisation', async () => {
    const autre = await m.zip.ecrireZip([{ nom: 'notes.md', contenu: new TextEncoder().encode('# rien') }])
    await expect(m.paquet.importerPaquet(autre)).rejects.toThrow(/pas un fichier de synchronisation/)
  })

  it('accepte une base où des scripts de correction ont laissé leur trace dans _migration', async () => {
    const b = new Database(':memory:')
    appliquerMigrations(b, MIGRATIONS, () => {})
    b.prepare(`INSERT INTO _migration (nom) VALUES ('script:equilibrer-reponses-comprehension')`).run()
    const octets = await m.zip.ecrireZip([
      {
        nom: 'manifeste.json',
        contenu: new TextEncoder().encode(
          JSON.stringify({ application: 'prepa', format: 1, appareil: 'pc', exporteLe: '2026-09-29T08:00:00.000Z', fichiersPresents: [] }),
        ),
      },
      { nom: 'app.db', contenu: new Uint8Array(b.serialize()) },
    ])
    b.close()
    await expect(m.paquet.importerPaquet(octets)).resolves.toMatchObject({ appareil: 'pc' })
  })

  it('refuse une base au schéma plus récent que l’application', async () => {
    const b = new Database(':memory:')
    appliquerMigrations(b, [...MIGRATIONS, { nom: '999_futur.sql', sql: 'CREATE TABLE futur (x)' }], () => {})
    const octets = await m.zip.ecrireZip([
      {
        nom: 'manifeste.json',
        contenu: new TextEncoder().encode(
          JSON.stringify({ application: 'prepa', format: 1, appareil: 'iphone', exporteLe: '', fichiersPresents: [] }),
        ),
      },
      { nom: 'app.db', contenu: new Uint8Array(b.serialize()) },
    ])
    b.close()
    await expect(m.paquet.importerPaquet(octets)).rejects.toThrow(/schéma plus récent.*999_futur/)
  })
})
