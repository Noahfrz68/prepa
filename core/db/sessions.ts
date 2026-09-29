import type { Base } from './base'
import { db } from './queries'
import { COUPURE_TOLEREE_MS } from '@/exams/tagemage/epreuve'

/**
 * Cycle de vie des sessions : ce qui reste ouvert, ce qui est abandonné.
 *
 * Une session s'ouvre au lancement d'une série ou d'une épreuve et ne se
 * fermait qu'à sa dernière réponse. Tout ce qui était quitté en route restait
 * « en cours » pour toujours : 66 séries ouvertes, dont 67 sessions sans une
 * seule réponse, fantômes de lancements abandonnés ou du double démarrage
 * corrigé depuis. La colonne `interrompue` existait pour ça et n'était jamais
 * écrite.
 *
 * La règle : passé DELAI_ABANDON_HEURES sans clôture, une session est rangée.
 * Vide, elle est supprimée — elle ne mesure rien. Avec des réponses, elle est
 * marquée interrompue : ses réponses restent des mesures (calibration, carnet),
 * mais elle ne se reprend plus et ne compte comme aucune épreuve passée.
 *
 * Le délai protège une épreuve en cours : pendant un sous-test, rien n'est
 * encore écrit, et une session vide depuis vingt minutes peut très bien être
 * un blanc qu'on est en train de passer.
 */
export const DELAI_ABANDON_HEURES = 12

export interface Rangement {
  supprimees: number[]
  interrompues: number[]
}

export function rangerSessionsAbandonnees(d: Base = db()): Rangement {
  const res: Rangement = { supprimees: [], interrompues: [] }

  const candidates = d
    .prepare(
      `SELECT s.id,
              (SELECT COUNT(*) FROM attempt a WHERE a.session_id = s.id) AS n
         FROM exam_session s
        WHERE s.fin IS NULL AND s.interrompue = 0
          AND s.debut < datetime('now', ?)`,
    )
    .all(`-${DELAI_ABANDON_HEURES} hours`) as Array<{ id: number; n: number }>

  if (candidates.length === 0) return res

  // Suppression par identifiant exact, et seulement si la session est encore
  // vide au moment d'écrire : la garde est dans la requête elle-même.
  const supprimer = d.prepare(
    `DELETE FROM exam_session
      WHERE id = ? AND fin IS NULL
        AND NOT EXISTS (SELECT 1 FROM attempt a WHERE a.session_id = exam_session.id)`,
  )
  const interrompre = d.prepare(
    `UPDATE exam_session SET interrompue = 1 WHERE id = ? AND fin IS NULL`,
  )

  d.transaction(() => {
    for (const c of candidates) {
      if (c.n === 0) {
        if (supprimer.run(c.id).changes === 1) res.supprimees.push(c.id)
      } else if (interrompre.run(c.id).changes === 1) {
        res.interrompues.push(c.id)
      }
    }
  })()

  return res
}

/**
 * Ajoute le temps de lecture des corrections d'une séance close. Plafonné à
 * une heure au total : au-delà, ce n'est plus de la lecture.
 */
export function ajouterTempsCorrection(
  sessionId: number,
  ms: number,
  d: Base = db(),
): void {
  const borne = Math.max(0, Math.min(30 * 60 * 1000, Math.round(Number(ms) || 0)))
  d.prepare(
    `UPDATE exam_session SET correction_ms = MIN(3600000, correction_ms + ?)
      WHERE id = ? AND fin IS NOT NULL`,
  ).run(borne, sessionId)
}

/** Abandon explicite d'une session par l'utilisateur (bouton « Abandonner »). */
export function abandonnerSession(sessionId: number, d: Base = db()): void {
  d.transaction(() => {
    const vide = d
      .prepare(
        `DELETE FROM exam_session
          WHERE id = ? AND fin IS NULL
            AND NOT EXISTS (SELECT 1 FROM attempt a WHERE a.session_id = exam_session.id)`,
      )
      .run(sessionId)
    if (vide.changes === 0) {
      d.prepare(`UPDATE exam_session SET interrompue = 1 WHERE id = ? AND fin IS NULL`).run(
        sessionId,
      )
    }
  })()
}

export interface EtatSession {
  existe: boolean
  type: string | null
  terminee: boolean
  interrompue: boolean
  /** Sous-tests dont les réponses sont déjà en base. */
  sectionsEnregistrees: string[]
  /** Encore reprenable : ouverte, non abandonnée, dans le délai. */
  reprenable: boolean
}

export function etatSession(sessionId: number, d: Base = db()): EtatSession {
  const s = d
    .prepare(
      `SELECT type, fin, interrompue, debut >= datetime('now', ?) AS recente
         FROM exam_session WHERE id = ?`,
    )
    .get(`-${DELAI_ABANDON_HEURES} hours`, sessionId) as
    | { type: string; fin: string | null; interrompue: number; recente: number }
    | undefined

  if (!s) {
    return {
      existe: false,
      type: null,
      terminee: false,
      interrompue: false,
      sectionsEnregistrees: [],
      reprenable: false,
    }
  }

  const sections = (
    d
      .prepare(
        `SELECT DISTINCT i.section FROM attempt a JOIN item i ON i.id = a.item_id
          WHERE a.session_id = ?`,
      )
      .all(sessionId) as Array<{ section: string }>
  ).map((r) => r.section)

  return {
    existe: true,
    type: s.type,
    terminee: s.fin !== null,
    interrompue: s.interrompue === 1,
    sectionsEnregistrees: sections,
    reprenable: s.fin === null && s.interrompue === 0 && s.recente === 1,
  }
}

/**
 * Enregistre une coupure pendant une épreuve (onglet fermé, page rechargée),
 * constatée à la reprise. Le chronomètre était gelé : au-delà de
 * COUPURE_TOLEREE_MS cumulées, on a pu réfléchir hors du temps, et l'épreuve
 * perd son statut de conditions réelles. Seule une épreuve encore ouverte
 * est concernée ; une coupure est bornée au délai de reprise (12 h).
 */
export function ajouterCoupure(sessionId: number, ms: number, d: Base = db()): void {
  const borne = Math.max(0, Math.min(DELAI_ABANDON_HEURES * 3600_000, Math.round(Number(ms) || 0)))
  d.prepare(
    `UPDATE exam_session
        SET coupure_ms = coupure_ms + @ms,
            conditions_reelles = CASE WHEN coupure_ms + @ms > @tolere THEN 0 ELSE conditions_reelles END
      WHERE id = @id AND fin IS NULL AND type IN ('blanc', 'diagnostic')`,
  ).run({ ms: borne, tolere: COUPURE_TOLEREE_MS, id: sessionId })
}
