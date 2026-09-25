import { db } from './queries'
import {
  GRILLES,
  TACHES_PAR_TYPE,
  estimerWriting,
  noteGlobale,
  type NoteCritere,
  type TypeTacheWriting,
} from '@/exams/toeic/writing'

const EXAM = 'toeic_sw'

/* --------------------------------------------------------------- seed -- */

/**
 * Sujets d'entraînement originaux.
 *
 * Rédigés pour ce projet, au format ETS mais sans reprendre aucun sujet
 * officiel. Ils existent pour que le module serve dès le premier lancement ;
 * l'import permet d'en ajouter.
 */
const SUJETS: Array<{
  type: TypeTacheWriting
  numero: number
  consigne: string
}> = [
  {
    type: 'reponse_courriel',
    numero: 6,
    consigne: `From: Marta Lindqvist, Facilities Manager
To: All department heads
Subject: Relocation of the third-floor offices

Our third-floor offices will be relocated to the new annex during the last week of March. Please reply with the number of workstations your team requires, any equipment that must be moved intact, and a date on which your team could be temporarily unavailable.

CONSIGNE — Réponds en tant que responsable de service. Ton message doit :
· indiquer le nombre de postes nécessaires,
· signaler UN équipement à déplacer avec précaution,
· proposer une date, et poser UNE question sur le déménagement.`,
  },
  {
    type: 'reponse_courriel',
    numero: 7,
    consigne: `From: Daniel Okafor, Purchasing
To: Supplier relations
Subject: Delayed delivery — order 4471

Order 4471 was due on 12 May but has not arrived. Our production line will stop on 18 May without these components. Please explain the delay and tell us what you can guarantee.

CONSIGNE — Réponds en tant que fournisseur. Ton message doit :
· présenter des excuses et expliquer la cause du retard,
· proposer UNE solution concrète avec une date,
· demander UNE information nécessaire pour la mettre en œuvre.`,
  },
  {
    type: 'essai_opinion',
    numero: 8,
    consigne: `Some companies allow employees to choose their own working hours, while others require everyone to work the same fixed schedule.

Which approach do you think is better for a company, and why? Use specific reasons and examples to support your opinion.

Attendu : environ 300 mots.`,
  },
  {
    type: 'essai_opinion',
    numero: 8,
    consigne: `Many organisations now conduct job interviews by video rather than in person.

Do you think video interviews are as effective as in-person interviews? Use specific reasons and examples to support your opinion.

Attendu : environ 300 mots.`,
  },
]

let amorce = false

/** Sème grilles et sujets, une seule fois, de façon idempotente. */
export function seedWriting(): void {
  if (amorce) return
  const d = db()

  const insererGrille = d.prepare(
    `INSERT INTO rubric (type_tache, criteres, note_max) VALUES (?, ?, ?)
     ON CONFLICT (type_tache) DO UPDATE SET criteres = excluded.criteres, note_max = excluded.note_max`,
  )

  const insererSujet = d.prepare(
    `INSERT INTO prompt_task (exam_id, section, type_tache, numero, consigne, duree_reponse_s, source)
     SELECT ?, 'writing', ?, ?, ?, ?, 'saisi'
      WHERE NOT EXISTS (SELECT 1 FROM prompt_task WHERE consigne = ?)`,
  )

  const tout = d.transaction(() => {
    for (const [type, criteres] of Object.entries(GRILLES)) {
      insererGrille.run(
        type,
        JSON.stringify(criteres),
        TACHES_PAR_TYPE.get(type as TypeTacheWriting)!.noteMax,
      )
    }

    for (const s of SUJETS) {
      insererSujet.run(
        EXAM,
        s.type,
        s.numero,
        s.consigne,
        TACHES_PAR_TYPE.get(s.type)!.dureeReponseS,
        s.consigne,
      )
    }
  })

  tout()
  amorce = true
}

/* -------------------------------------------------------------- sujets -- */

export interface Sujet {
  id: number
  type: TypeTacheWriting
  numero: number
  libelle: string
  consigne: string
  dureeReponseS: number
  noteMax: number
  dejaFait: number
}

export function sujets(): Sujet[] {
  seedWriting()

  return (
    db()
      .prepare(
        `SELECT t.id, t.type_tache AS type, t.numero, t.consigne, t.duree_reponse_s AS duree,
                (SELECT COUNT(*) FROM production p WHERE p.prompt_task_id = t.id) AS dejaFait
           FROM prompt_task t
          WHERE t.section = 'writing' AND t.statut = 'valide'
          ORDER BY t.numero, t.id`,
      )
      .all() as Array<Record<string, unknown>>
  ).map((l) => {
    const type = l.type as TypeTacheWriting
    const tache = TACHES_PAR_TYPE.get(type)!
    return {
      id: l.id as number,
      type,
      numero: l.numero as number,
      libelle: tache.libelle,
      consigne: l.consigne as string,
      dureeReponseS: l.duree as number,
      noteMax: tache.noteMax,
      dejaFait: l.dejaFait as number,
    }
  })
}

export function sujet(id: number): Sujet | null {
  return sujets().find((s) => s.id === id) ?? null
}

/* --------------------------------------------------------- production -- */

export interface NouvelleProduction {
  promptTaskId: number
  contenu: string
  tempsMs: number
}

export function enregistrerProduction(p: NouvelleProduction): number {
  const d = db()

  const tache = d.prepare(`SELECT id FROM prompt_task WHERE id = ?`).get(p.promptTaskId)
  if (!tache) throw new Error(`Sujet ${p.promptTaskId} introuvable.`)
  if (!p.contenu.trim()) throw new Error('Production vide.')

  const sessionId = Number(
    d
      .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES (?, 'drill', '["writing"]')`)
      .run(EXAM).lastInsertRowid,
  )

  return Number(
    d
      .prepare(
        `INSERT INTO production (session_id, prompt_task_id, modalite, contenu_texte, temps_ms)
         VALUES (?, ?, 'texte', ?, ?)`,
      )
      .run(sessionId, p.promptTaskId, p.contenu.trim(), Math.max(0, Math.round(p.tempsMs)))
      .lastInsertRowid,
  )
}

export interface ProductionComplete {
  id: number
  promptTaskId: number
  type: TypeTacheWriting
  libelleTache: string
  consigne: string
  contenu: string
  tempsMs: number
  notes: NoteCritere[] | null
  noteGlobale: number | null
  noteMax: number
  feedback: string | null
  fournisseur: string | null
  modele: string | null
  creeLe: string
}

function ligneVersProduction(l: Record<string, unknown>): ProductionComplete {
  const type = l.type as TypeTacheWriting
  const tache = TACHES_PAR_TYPE.get(type)!

  return {
    id: l.id as number,
    promptTaskId: l.promptTaskId as number,
    type,
    libelleTache: tache.libelle,
    consigne: l.consigne as string,
    contenu: l.contenu as string,
    tempsMs: l.tempsMs as number,
    notes: l.notes ? (JSON.parse(l.notes as string) as NoteCritere[]) : null,
    noteGlobale: (l.noteGlobale as number) ?? null,
    noteMax: tache.noteMax,
    feedback: (l.feedback as string) ?? null,
    fournisseur: (l.fournisseur as string) ?? null,
    modele: (l.modele as string) ?? null,
    creeLe: l.creeLe as string,
  }
}

const SELECT_PRODUCTION = `
  SELECT p.id, p.prompt_task_id AS promptTaskId, t.type_tache AS type, t.consigne,
         p.contenu_texte AS contenu, p.temps_ms AS tempsMs,
         p.notes_rubrique AS notes, p.note_globale AS noteGlobale,
         p.feedback_ia AS feedback, p.fournisseur, p.modele, p.created_at AS creeLe
    FROM production p
    JOIN prompt_task t ON t.id = p.prompt_task_id
`

export function production(id: number): ProductionComplete | null {
  const l = db().prepare(`${SELECT_PRODUCTION} WHERE p.id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  return l ? ligneVersProduction(l) : null
}

export function historiqueProductions(limite = 20): ProductionComplete[] {
  return (
    db()
      .prepare(`${SELECT_PRODUCTION} ORDER BY p.id DESC LIMIT ?`)
      .all(limite) as Array<Record<string, unknown>>
  ).map(ligneVersProduction)
}

/** Productions antérieures sur la même tâche, pour mesurer la progression. */
export function precedentesSurTache(
  promptTaskId: number,
  avantId: number,
): ProductionComplete[] {
  return (
    db()
      .prepare(
        `${SELECT_PRODUCTION} WHERE p.prompt_task_id = ? AND p.id < ? ORDER BY p.id DESC LIMIT 5`,
      )
      .all(promptTaskId, avantId) as Array<Record<string, unknown>>
  ).map(ligneVersProduction)
}

export function enregistrerNotation(
  productionId: number,
  type: TypeTacheWriting,
  notes: NoteCritere[],
  feedback: string,
  fournisseur: string,
  modele: string,
): number {
  const note = noteGlobale(type, notes)

  db()
    .prepare(
      `UPDATE production SET notes_rubrique = ?, note_globale = ?, feedback_ia = ?,
              fournisseur = ?, modele = ?
        WHERE id = ?`,
    )
    .run(JSON.stringify(notes), note, feedback, fournisseur, modele, productionId)

  return note
}

export function estimationWriting() {
  const lignes = db()
    .prepare(
      `SELECT t.type_tache AS type, p.note_globale AS note
         FROM production p JOIN prompt_task t ON t.id = p.prompt_task_id
        WHERE p.note_globale IS NOT NULL`,
    )
    .all() as Array<{ type: TypeTacheWriting; note: number }>

  return estimerWriting(lignes)
}
