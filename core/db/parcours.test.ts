import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Parcours de bout en bout : les VRAIES routes de l'API, appelées comme le
 * navigateur les appelle, sur une base jetable (PREPA_DB).
 *
 * Les autres tests vérifient des règles une par une ; celui-ci vérifie que
 * les morceaux tiennent ensemble — lancer une série, y répondre, renvoyer une
 * réponse après une coupure, la clore, puis passer une épreuve entière et en
 * lire le bilan. C'est là que casse une migration oubliée ou une route qui ne
 * suit plus le module qu'elle appelle.
 */

const dossier = mkdtempSync(path.join(tmpdir(), 'prepa-parcours-'))
process.env.PREPA_DB = path.join(dossier, 'parcours.db')

type Route = (r: Request) => Promise<Response>
let routes: Record<string, Route>

async function appeler<T = Record<string, unknown>>(
  nom: string,
  corps: unknown,
): Promise<{ statut: number; data: T }> {
  const r = await routes[nom](
    new Request(`http://127.0.0.1:3000/api/${nom}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    }),
  )
  return { statut: r.status, data: (await r.json()) as T }
}

const LETTRES = ['A', 'B', 'C', 'D', 'E']
/** Bonne réponse de chaque item inséré : le test répond juste ou faux à dessein. */
const bonnes = new Map<number, string>()

interface ItemServi {
  id: number
}

beforeAll(async () => {
  // Importés APRÈS avoir posé PREPA_DB : le client lit la variable au chargement.
  const { db } = await import('./queries')
  routes = {
    'drill/start': (await import('@/app/api/drill/start/route')).POST,
    'drill/attempt': (await import('@/app/api/drill/attempt/route')).POST,
    'drill/finish': (await import('@/app/api/drill/finish/route')).POST,
    'epreuve/start': (await import('@/app/api/epreuve/start/route')).POST,
    'epreuve/lot': (await import('@/app/api/epreuve/lot/route')).POST,
    'epreuve/finish': (await import('@/app/api/epreuve/finish/route')).POST,
    'epreuve/papier': (await import('@/app/api/epreuve/papier/route')).POST,
    session: (await import('@/app/api/session/route')).POST,
  }

  const d = db()
  const skills = d
    .prepare(`SELECT id, section FROM skill WHERE exam_id = 'tagemage' ORDER BY ordre`)
    .all() as Array<{ id: string; section: string }>
  const premierSkill = new Map<string, string>()
  for (const s of skills) if (!premierSkill.has(s.section)) premierSkill.set(s.section, s.id)

  const inserer = d.prepare(
    `INSERT INTO item (exam_id, section, skill_id, type_item, enonce, contexte_texte, options,
                       bonne_reponse, explication_reference, source, statut)
     VALUES ('tagemage', ?, ?, ?, ?, ?, ?, ?, 'Démarche de test.', 'saisi', 'valide')`,
  )
  const ajouter = (section: string, i: number, texte: string | null = null) => {
    const conditions = section === 'conditions_minimales'
    const lettre = LETTRES[i % 5]
    const id = Number(
      inserer.run(
        section,
        premierSkill.get(section),
        conditions ? 'conditions_minimales' : 'qcm',
        `Question ${section} n° ${i} : énoncé de test assez distinct ${i * 7}.`,
        texte,
        conditions ? null : JSON.stringify(LETTRES.map((l) => `Proposition ${l} ${i}`)),
        lettre,
      ).lastInsertRowid,
    )
    bonnes.set(id, lettre)
  }

  for (const section of ['calcul', 'raisonnement', 'conditions_minimales', 'expression', 'logique']) {
    for (let i = 0; i < 16; i++) ajouter(section, i)
  }
  // Compréhension : trois textes de cinq questions, le format de l'épreuve.
  for (let t = 0; t < 3; t++) {
    const texte = `Texte support n° ${t}. `.repeat(40)
    for (let q = 0; q < 5; q++) ajouter('comprehension', t * 5 + q, texte)
  }
})

afterAll(async () => {
  const { getDb } = await import('./client')
  getDb().close()
  rmSync(dossier, { recursive: true, force: true })
})

describe('parcours : une série d’entraînement', () => {
  let sessionId: number
  let items: ItemServi[]

  it('se lance et sert le nombre de questions demandé, sans les corrigés', async () => {
    const { statut, data } = await appeler<{ sessionId: number; items: Array<Record<string, unknown>> }>(
      'drill/start',
      { section: 'calcul', taille: 5 },
    )
    expect(statut).toBe(200)
    expect(data.items).toHaveLength(5)
    expect(data.items.every((i) => !('bonneReponse' in i) && !('bonne_reponse' in i))).toBe(true)
    sessionId = data.sessionId
    items = data.items as unknown as ItemServi[]
  })

  it('enregistre les réponses, et un renvoi après coupure ne compte pas deux fois', async () => {
    for (const [k, it] of items.entries()) {
      // Trois justes, une fausse, un saut.
      const juste = bonnes.get(it.id)!
      const fausse = LETTRES.find((l) => l !== juste)!
      const corps =
        k === 4
          ? { sessionId, itemId: it.id, reponse: null, aSaute: true, tempsMs: 30_000, confiance: 1 }
          : { sessionId, itemId: it.id, reponse: k === 3 ? fausse : juste, aSaute: false, tempsMs: 60_000, confiance: 3 }
      expect((await appeler('drill/attempt', corps)).statut).toBe(200)
      if (k === 0) expect((await appeler('drill/attempt', corps)).statut).toBe(200)
    }
  })

  it('refuse une tentative mal formée avec un 400', async () => {
    const { statut } = await appeler('drill/attempt', { sessionId, itemId: items[0].id, confiance: 9 })
    expect(statut).toBe(400)
  })

  it('se clôt avec le bon décompte et libère les corrections', async () => {
    const { statut, data } = await appeler<{
      resultat: { nbItems: number; justes: number; fausses: number; sautees: number }
      corrections: Array<{ bonneReponse: string }>
    }>('drill/finish', { sessionId })
    expect(statut).toBe(200)
    expect(data.resultat.nbItems).toBe(5)
    expect(data.resultat.justes).toBe(3)
    expect(data.corrections).toHaveLength(5)
    expect(data.corrections.every((c) => LETTRES.includes(c.bonneReponse))).toBe(true)
  })

  it('refuse toute réponse sur une série close', async () => {
    const { statut } = await appeler('drill/attempt', {
      sessionId,
      itemId: items[0].id,
      reponse: 'A',
      aSaute: false,
      tempsMs: 1000,
      confiance: 2,
    })
    expect(statut).toBeGreaterThanOrEqual(400)
    expect(statut).toBeLessThan(500)
  })
})

describe('parcours : un diagnostic à l’écran', () => {
  it('se passe sous-test par sous-test et donne un bilan complet', async () => {
    const depart = await appeler<{
      sessionId: number
      complete: boolean
      etapes: Array<{ section: string; items: ItemServi[] }>
    }>('epreuve/start', { mode: 'diagnostic' })
    expect(depart.statut).toBe(200)
    expect(depart.data.complete).toBe(true)
    expect(depart.data.etapes).toHaveLength(6)
    const { sessionId, etapes } = depart.data

    for (const e of etapes) {
      const tentatives = e.items.map((it, k) => ({
        itemId: it.id,
        reponse: k === 0 ? null : bonnes.get(it.id)!,
        aSaute: k === 0,
        motifBlanc: k === 0 ? 'non_traite' : null,
        tempsMs: 70_000,
        confiance: 3,
      }))
      const lot = await appeler<{ enregistrees: number }>('epreuve/lot', { sessionId, tentatives })
      expect(lot.statut).toBe(200)
      expect(lot.data.enregistrees).toBe(e.items.length)
    }

    expect((await appeler('epreuve/finish', { sessionId })).statut).toBe(200)

    const { recapEpreuve } = await import('./epreuve')
    const recap = recapEpreuve(sessionId)
    expect(recap.terminee).toBe(true)
    expect(recap.sousTestsPrevus).toBe(6)
    const attendu = etapes.reduce((acc, e) => acc + e.items.length, 0)
    expect(recap.totaux.n).toBe(attendu)
    expect(recap.totaux.nonTraitees).toBe(6)
    expect(recap.totaux.justes).toBe(attendu - 6)
  })

  it('refuse un lot sur une épreuve déjà close', async () => {
    const depart = await appeler<{ sessionId: number; etapes: Array<{ items: ItemServi[] }> }>(
      'epreuve/start',
      { mode: 'diagnostic' },
    )
    const { sessionId, etapes } = depart.data
    expect((await appeler('epreuve/finish', { sessionId })).statut).toBe(200)
    const it0 = etapes[1].items[0]
    const { statut } = await appeler('epreuve/lot', {
      sessionId,
      tentatives: [{ itemId: it0.id, reponse: 'A', aSaute: false, motifBlanc: null, tempsMs: 1000, confiance: 2 }],
    })
    expect(statut).toBeGreaterThanOrEqual(400)
    expect(statut).toBeLessThan(500)
  })
})

describe('parcours : un diagnostic sur papier', () => {
  it('se compose sans ouvrir de séance, puis s’enregistre en une fois', async () => {
    const { db } = await import('./queries')
    const avant = (db().prepare(`SELECT COUNT(*) AS n FROM exam_session`).get() as { n: number }).n

    const compo = await appeler<{ etapes: Array<{ section: string; items: ItemServi[] }> }>(
      'epreuve/papier',
      { action: 'composer', mode: 'diagnostic' },
    )
    expect(compo.statut).toBe(200)
    expect((db().prepare(`SELECT COUNT(*) AS n FROM exam_session`).get() as { n: number }).n).toBe(avant)

    const enr = await appeler<{ sessionId: number }>('epreuve/papier', {
      action: 'enregistrer',
      mode: 'diagnostic',
      sousTests: compo.data.etapes.map((e) => ({
        section: e.section,
        itemIds: e.items.map((i) => i.id),
        reponses: e.items.map((i) => ({ lettre: bonnes.get(i.id)!, confiance: 3 })),
        minutes: 8,
      })),
    })
    expect(enr.statut).toBe(200)

    const { recapEpreuve } = await import('./epreuve')
    const recap = recapEpreuve(enr.data.sessionId)
    expect(recap.terminee).toBe(true)
    expect(recap.totaux.justes).toBe(recap.totaux.n)
  })
})

describe('parcours : exporter ses données', () => {
  it('rend une copie SQLite complète et un JSON sans les images', async () => {
    const { db } = await import('./queries')
    const { copieBase, exportJson } = await import('./export')
    const tentatives = (db().prepare(`SELECT COUNT(*) AS n FROM attempt`).get() as { n: number }).n
    expect(tentatives).toBeGreaterThan(0)

    const copie = await copieBase()
    expect(copie.subarray(0, 15).toString('latin1')).toBe('SQLite format 3')

    const json = exportJson()
    expect(json.tables.attempt).toHaveLength(tentatives)
    expect(json.tables.exam_session.length).toBeGreaterThan(0)
    expect('media' in json.tables).toBe(false)
    expect('_migration' in json.tables).toBe(false)
  })
})

describe('parcours : ce qui n’a pas été mesuré ne compte pas comme mesuré', () => {
  it('une épreuve papier est marquée ; ses temps et ses confiances vides ne sont pas des mesures', async () => {
    const { db } = await import('./queries')
    const compo = await appeler<{ etapes: Array<{ section: string; items: ItemServi[] }> }>('epreuve/papier', {
      action: 'composer',
      mode: 'diagnostic',
    })
    const enr = await appeler<{ sessionId: number }>('epreuve/papier', {
      action: 'enregistrer',
      mode: 'diagnostic',
      sousTests: compo.data.etapes.map((e) => ({
        section: e.section,
        itemIds: e.items.map((i) => i.id),
        // Première réponse avec sa confiance, les autres sans.
        reponses: e.items.map((i, k) => ({ lettre: bonnes.get(i.id)!, confiance: k === 0 ? 4 : null })),
        minutes: 9,
      })),
    })
    expect(enr.statut).toBe(200)
    const id = enr.data.sessionId

    const session = db().prepare('SELECT papier FROM exam_session WHERE id = ?').get(id) as { papier: number }
    expect(session.papier).toBe(1)
    const t = db()
      .prepare(
        `SELECT COUNT(*) AS n, SUM(temps_mesure) AS mesures, SUM(confiance_declaree) AS declarees
           FROM attempt WHERE session_id = ?`,
      )
      .get(id) as { n: number; mesures: number; declarees: number }
    expect(t.mesures).toBe(0)
    expect(t.declarees).toBe(compo.data.etapes.length)

    const { recapEpreuve } = await import('./epreuve')
    expect(recapEpreuve(id).papier).toBe(true)
  })

  it('une coupure de plus de cinq minutes retire les conditions réelles, pas une courte', async () => {
    const { db } = await import('./queries')
    const lire = (id: number) =>
      db().prepare('SELECT conditions_reelles AS c, coupure_ms AS ms FROM exam_session WHERE id = ?').get(id) as {
        c: number
        ms: number
      }

    const courte = (await appeler<{ sessionId: number }>('epreuve/start', { mode: 'diagnostic' })).data.sessionId
    expect((await appeler('session', { action: 'coupure', sessionId: courte, ms: 60_000 })).statut).toBe(200)
    expect(lire(courte)).toEqual({ c: 1, ms: 60_000 })

    const longue = (await appeler<{ sessionId: number }>('epreuve/start', { mode: 'diagnostic' })).data.sessionId
    await appeler('session', { action: 'coupure', sessionId: longue, ms: 4 * 60_000 })
    expect(lire(longue).c).toBe(1)
    // Les coupures se cumulent : 4 + 2 min dépassent la tolérance.
    await appeler('session', { action: 'coupure', sessionId: longue, ms: 2 * 60_000 })
    expect(lire(longue)).toEqual({ c: 0, ms: 6 * 60_000 })
  })
})

describe('parcours : une série de compréhension ciblée', () => {
  it('sert des textes entiers, pas une question par texte', async () => {
    const { db } = await import('./queries')
    const skill = (db().prepare("SELECT skill_id AS s FROM item WHERE section = 'comprehension' LIMIT 1").get() as { s: string }).s
    const { data } = await appeler<{ items: Array<{ contexteTexte: string }> }>('drill/start', {
      section: 'comprehension',
      taille: 10,
      skills: [skill],
    })
    expect(data.items).toHaveLength(10)
    expect(new Set(data.items.map((i) => i.contexteTexte)).size).toBe(2)
  })
})

describe('parcours : réserve d’annales', () => {
  it('une série ne sert pas une annale jamais vue ; une épreuve la sert en premier', async () => {
    const { db } = await import('./queries')
    // Trois annales de logique jamais vues, et quelques questions neuves ordinaires.
    const skill = (db().prepare("SELECT skill_id AS s FROM item WHERE section = 'logique' LIMIT 1").get() as { s: string }).s
    const inserer = db().prepare(
      `INSERT INTO item (exam_id, section, skill_id, type_item, enonce, options, bonne_reponse, explication_reference, source, statut, tags)
       VALUES ('tagemage', 'logique', ?, 'qcm', ?, '["A","B","C","D","E"]', 'A', 'Démarche.', ?, 'valide', ?)`,
    )
    const inedites = [1, 2, 3].map((k) =>
      Number(inserer.run(skill, `Annale de logique inédite ${k}`, 'importe', 'annale').lastInsertRowid),
    )
    const neuves = [1, 2, 3].map((k) =>
      Number(inserer.run(skill, `Question de logique neuve ${k}`, 'saisi', null).lastInsertRowid),
    )

    const serie = await appeler<{ items: ItemServi[] }>('drill/start', { section: 'logique', taille: 10 })
    expect(serie.data.items.some((i) => inedites.includes(i.id))).toBe(false)
    // Les questions neuves ordinaires, elles, restent tirables (et passent devant).
    expect(neuves.every((id) => serie.data.items.some((i) => i.id === id))).toBe(true)

    const epreuve = await appeler<{ etapes: Array<{ section: string; items: ItemServi[] }> }>('epreuve/start', {
      mode: 'diagnostic',
    })
    const logique = epreuve.data.etapes.find((e) => e.section === 'logique')!
    expect(inedites.every((id) => logique.items.some((i) => i.id === id))).toBe(true)
  })
})

describe('parcours : le calendrier reprend le plan figé', () => {
  it('la semaine en cours du calendrier porte l’épreuve prévue par le plan, ni plus ni moins', async () => {
    const { db } = await import('./queries')
    const dans60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10)
    db().prepare(`UPDATE exam_goal SET date_examen = ? WHERE exam_id = 'tagemage'`).run(dans60)
    const { planDeLaSemaine, calendrierJusquExamen } = await import('./semaine')
    const plan = planDeLaSemaine(true)
    const calendrier = calendrierJusquExamen()
    expect(calendrier).not.toBeNull()
    const prevue = plan.taches.some((t) => t.type === 'blanc')
      ? 'blanc'
      : plan.taches.some((t) => t.type === 'diagnostic')
        ? 'diagnostic'
        : null
    expect(calendrier![0].epreuve).toBe(prevue)
  })
})
