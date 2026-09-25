import fs from 'node:fs'
import path from 'node:path'
import { db } from './queries'
import {
  accentsDisponibles,
  hashScript,
  moteurActif,
  type Segment,
} from '@/core/audio/moteurs'
import {
  LIBELLE_ACCENT,
  PARTS_LISTENING,
  PARTS_LISTENING_PAR_ID,
  accentFaible,
  accentPourIndex,
  type Accent,
  type StatAccent,
} from '@/exams/toeic/listening'
import { BAREME_TOEIC } from '@/core/scoring/toeic'

const EXAM = 'toeic_lr'

/* -------------------------------------------------------------- média -- */

export interface NouveauMedia {
  segments: Segment[]
  accent: Accent
}

/** Crée le média s'il n'existe pas déjà, et renvoie son identifiant. */
export function creerMedia(m: NouveauMedia): number {
  const d = db()
  const hash = hashScript(m.segments, m.accent)

  const existant = d.prepare(`SELECT id FROM media WHERE hash_script = ?`).get(hash) as
    | { id: number }
    | undefined
  if (existant) return existant.id

  const transcript = m.segments
    .map((s) => (m.segments.length > 1 ? `[${s.locuteur + 1}] ${s.texte}` : s.texte))
    .join('\n')

  const info = d
    .prepare(
      `INSERT INTO media (type, transcript, segments, accent, hash_script)
       VALUES ('audio', ?, ?, ?, ?)`,
    )
    .run(transcript, JSON.stringify(m.segments), m.accent, hash)

  return Number(info.lastInsertRowid)
}

export interface EtatSynthese {
  total: number
  synthetises: number
  enAttente: number
  parAccent: Record<string, number>
}

export function etatSynthese(): EtatSynthese {
  const d = db()
  const lignes = d
    .prepare(`SELECT accent, chemin_fichier FROM media WHERE type = 'audio'`)
    .all() as Array<{ accent: string | null; chemin_fichier: string | null }>

  return {
    total: lignes.length,
    synthetises: lignes.filter((l) => l.chemin_fichier).length,
    enAttente: lignes.filter((l) => !l.chemin_fichier).length,
    parAccent: lignes.reduce<Record<string, number>>((acc, l) => {
      const a = l.accent ?? '?'
      acc[a] = (acc[a] ?? 0) + 1
      return acc
    }, {}),
  }
}

export interface ResultatLot {
  synthetises: number
  echecs: Array<{ mediaId: number; erreur: string }>
}

/**
 * Synthétise les médias en attente.
 *
 * Un script inchangé n'est jamais resynthétisé : le hash sert de clé de cache.
 * La génération se fait en lot et hors d'une série — jamais à la volée pendant
 * un entraînement, le processeur étant partagé avec le navigateur.
 */
export async function synthetiserEnAttente(limite = 20): Promise<ResultatLot> {
  const d = db()
  const moteur = moteurActif()

  if (moteur.indisponible() !== null) {
    throw new Error(moteur.indisponible()!)
  }

  const enAttente = d
    .prepare(
      `SELECT id, segments, accent FROM media
        WHERE type = 'audio' AND chemin_fichier IS NULL
        ORDER BY id LIMIT ?`,
    )
    .all(limite) as Array<{ id: number; segments: string; accent: Accent }>

  const echecs: ResultatLot['echecs'] = []
  let synthetises = 0

  for (const m of enAttente) {
    try {
      const segments = JSON.parse(m.segments) as Segment[]
      const hash = hashScript(segments, m.accent)
      const r = await moteur.synthetiser({ segments, accent: m.accent }, hash)

      d.prepare(
        `UPDATE media SET chemin_fichier = ?, moteur_tts = ?, voix = ?, duree_ms = ? WHERE id = ?`,
      ).run(r.cheminRelatif, r.moteur, r.voix, r.dureeMs, m.id)

      synthetises++
    } catch (e) {
      echecs.push({ mediaId: m.id, erreur: (e as Error).message })
    }
  }

  return { synthetises, echecs }
}

export function cheminAudio(hash: string): string | null {
  const l = db()
    .prepare(`SELECT chemin_fichier FROM media WHERE hash_script = ?`)
    .get(hash) as { chemin_fichier: string | null } | undefined

  if (!l?.chemin_fichier) return null

  const complet = path.join(process.cwd(), 'data', l.chemin_fichier)
  return fs.existsSync(complet) ? complet : null
}

/* ------------------------------------------------------------- import -- */

export interface GroupeAInserer {
  accent: Accent
  segments: Segment[]
  questions: Array<{
    enonce: string
    options: string[]
    bonneReponse: string
    explication?: string
  }>
}

/**
 * Insère des groupes Listening : un média par enregistrement, et les questions
 * qui s'y rattachent. L'audio n'est pas synthétisé ici — la génération se fait
 * en lot depuis l'atelier audio.
 */
export function insererGroupesListening(
  groupes: GroupeAInserer[],
  part: string,
  skillId: string | null = null,
): { medias: number; questions: number } {
  const d = db()

  const insererItem = d.prepare(`
    INSERT INTO item
      (exam_id, section, skill_id, type_item, enonce, options, bonne_reponse,
       explication_reference, source, statut, media_id)
    VALUES (?, ?, ?, 'qcm', ?, ?, ?, ?, 'importe', 'valide', ?)
  `)

  let medias = 0
  let questions = 0

  const tout = d.transaction((liste: GroupeAInserer[]) => {
    for (const g of liste) {
      const mediaId = creerMedia({ segments: g.segments, accent: g.accent })
      medias++

      for (const q of g.questions) {
        insererItem.run(
          EXAM,
          part,
          skillId,
          q.enonce,
          JSON.stringify(q.options),
          q.bonneReponse,
          q.explication ?? null,
          mediaId,
        )
        questions++
      }
    }
  })

  tout(groupes)
  return { medias, questions }
}

/* -------------------------------------------------------------- série -- */

export interface ItemListening {
  id: number
  enonce: string
  options: string[]
}

export interface GroupeListening {
  mediaId: number
  hash: string
  accent: Accent
  dureeMs: number | null
  items: ItemListening[]
  /** Secondes de lecture des questions avant l'audio. 0 en Part 1 et 2. */
  secondesPreparation: number
  questionsVisiblesAvant: boolean
}

export interface SerieListening {
  sessionId: number
  part: string
  libelle: string
  groupes: GroupeListening[]
  /** Items écartés faute d'audio synthétisé — jamais servis en silence. */
  ecartes: number
}

/**
 * Constitue une série Listening.
 *
 * Les items dont l'audio n'est pas synthétisé sont **écartés**, jamais servis
 * avec le transcript à l'écran : lire au lieu d'écouter n'entraîne pas la
 * compétence testée.
 */
export function demarrerSerieListening(part: string, nbGroupes: number): SerieListening {
  const d = db()
  const spec = PARTS_LISTENING_PAR_ID.get(part)
  if (!spec) throw new Error(`Part « ${part} » inconnue ou hors Listening.`)

  const medias = d
    .prepare(
      `SELECT DISTINCT m.id, m.hash_script AS hash, m.accent, m.duree_ms AS dureeMs
         FROM media m
         JOIN item i ON i.media_id = m.id
        WHERE i.exam_id = ? AND i.section = ? AND i.statut = 'valide'
          AND m.chemin_fichier IS NOT NULL
        ORDER BY (SELECT COUNT(*) FROM attempt a JOIN item x ON x.id = a.item_id
                   WHERE x.media_id = m.id) ASC, RANDOM()
        LIMIT ?`,
    )
    .all(EXAM, part, nbGroupes) as Array<{
    id: number
    hash: string
    accent: Accent
    dureeMs: number | null
  }>

  const sansAudio = (
    d
      .prepare(
        `SELECT COUNT(*) AS n FROM item i
           LEFT JOIN media m ON m.id = i.media_id
          WHERE i.exam_id = ? AND i.section = ? AND i.statut = 'valide'
            AND (m.id IS NULL OR m.chemin_fichier IS NULL)`,
      )
      .get(EXAM, part) as { n: number }
  ).n

  if (medias.length === 0) {
    throw new Error(
      sansAudio > 0
        ? `Aucun audio synthétisé pour la Part ${spec.numero}. Lance la génération depuis l’atelier audio.`
        : `Aucune question en banque pour la Part ${spec.numero}.`,
    )
  }

  const lireItems = d.prepare(
    `SELECT id, enonce, options FROM item
      WHERE media_id = ? AND statut = 'valide' ORDER BY id`,
  )

  const info = d
    .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES (?, 'drill', ?)`)
    .run(EXAM, JSON.stringify([part]))

  return {
    sessionId: Number(info.lastInsertRowid),
    part,
    libelle: spec.libelle,
    ecartes: sansAudio,
    groupes: medias.map((m) => ({
      mediaId: m.id,
      hash: m.hash,
      accent: m.accent,
      dureeMs: m.dureeMs,
      secondesPreparation: spec.secondesPreparation,
      questionsVisiblesAvant: spec.questionsVisiblesAvant,
      items: (lireItems.all(m.id) as Array<Record<string, unknown>>).map((l) => ({
        id: l.id as number,
        enonce: l.enonce as string,
        options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
      })),
    })),
  }
}

export interface TentativeListening {
  itemId: number
  reponse: string | null
  nonTraitee: boolean
  tempsMs: number
  /** Temps réellement passé à lire les questions avant l'audio. */
  tempsPreparationMs: number | null
  confiance: number
}

export function enregistrerLotListening(
  sessionId: number,
  tentatives: TentativeListening[],
): number {
  const d = db()
  const lireItem = d.prepare(`SELECT bonne_reponse FROM item WHERE id = ?`)
  const inserer = d.prepare(
    `INSERT INTO attempt
       (session_id, item_id, reponse_donnee, est_correct, a_saute, motif_blanc,
        temps_ms, temps_preparation_ms, confiance, points_gagnes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const tout = d.transaction((liste: TentativeListening[]) => {
    for (const t of liste) {
      const item = lireItem.get(t.itemId) as { bonne_reponse: string } | undefined
      if (!item) throw new Error(`Item ${t.itemId} introuvable.`)

      const repondue = !t.nonTraitee && t.reponse !== null
      const juste = repondue && t.reponse === item.bonne_reponse

      inserer.run(
        sessionId,
        t.itemId,
        repondue ? t.reponse : null,
        juste ? 1 : 0,
        repondue ? 0 : 1,
        repondue ? null : 'non_traite',
        Math.max(0, Math.round(t.tempsMs)),
        t.tempsPreparationMs === null ? null : Math.max(0, Math.round(t.tempsPreparationMs)),
        Math.min(4, Math.max(1, Math.round(t.confiance))),
        juste ? BAREME_TOEIC.juste : BAREME_TOEIC.faux,
      )
    }
  })

  tout(tentatives)
  d.prepare(`UPDATE exam_session SET fin = datetime('now') WHERE id = ?`).run(sessionId)
  return tentatives.length
}

/* -------------------------------------------------------------- stats -- */

export function statsParAccent(): StatAccent[] {
  const lignes = db()
    .prepare(
      `SELECT m.accent AS accent, COUNT(*) AS n, SUM(a.est_correct) AS justes
         FROM attempt a
         JOIN item i  ON i.id = a.item_id
         JOIN media m ON m.id = i.media_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND m.accent IS NOT NULL
        GROUP BY m.accent`,
    )
    .all(EXAM) as Array<{ accent: Accent; n: number; justes: number }>

  const parAccent = new Map(lignes.map((l) => [l.accent, l]))

  return accentsDisponibles().map((accent) => {
    const l = parAccent.get(accent)
    return {
      accent,
      libelle: LIBELLE_ACCENT[accent],
      n: l?.n ?? 0,
      justes: l?.justes ?? 0,
      tauxReussite: l && l.n > 0 ? l.justes / l.n : null,
    }
  })
}

export interface EtatPreparation {
  n: number
  /** Part des groupes où le temps de préparation a été réellement utilisé. */
  tauxUtilisation: number | null
  secondesMoyennes: number | null
}

/**
 * Mesure si le temps de préparation est utilisé.
 *
 * C'est la compétence centrale des Part 3 et 4 : lire les questions pendant le
 * silence. Un temps de préparation systématiquement nul signale quelqu'un qui
 * découvre les questions après l'audio — et qui a déjà perdu.
 */
export function etatPreparation(): EtatPreparation {
  const l = db()
    .prepare(
      `SELECT COUNT(*) AS n,
              SUM(CASE WHEN a.temps_preparation_ms > 3000 THEN 1 ELSE 0 END) AS utilises,
              AVG(a.temps_preparation_ms) AS moyenne
         FROM attempt a
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND a.temps_preparation_ms IS NOT NULL`,
    )
    .get(EXAM) as { n: number; utilises: number | null; moyenne: number | null }

  return {
    n: l.n,
    tauxUtilisation: l.n > 0 ? (l.utilises ?? 0) / l.n : null,
    secondesMoyennes: l.moyenne === null ? null : Math.round(l.moyenne / 1000),
  }
}

export function diagnosticAccent() {
  return accentFaible(statsParAccent())
}

export { accentPourIndex, PARTS_LISTENING }
