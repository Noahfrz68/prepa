import type { Base } from './base'
import { ErreurRequete } from '@/core/erreurs'

/**
 * Gardes communes à l'enregistrement des réponses, en série comme en épreuve.
 *
 * Elles prennent la base en paramètre : ce module est importé par
 * `queries.ts`, et en importer `db()` créerait un cycle.
 */

/**
 * Plafond du temps d'une réponse. Le navigateur mesure et envoie ce temps :
 * sans plafond, un onglet laissé ouvert une nuit sur une question inscrivait
 * dix heures de réflexion, et faussait toutes les médianes de temps. Trente
 * minutes couvrent largement le plus long des cas légitimes — un texte de
 * compréhension lu avant sa première question.
 */
export const TEMPS_MAX_MS = 30 * 60 * 1000

export function tempsBorne(ms: number): number {
  return Math.min(TEMPS_MAX_MS, Math.max(0, Math.round(Number.isFinite(ms) ? ms : 0)))
}

/**
 * Une réponse ne s'ajoute qu'à une séance qui existe et qui n'est pas close.
 *
 * Séance disparue : c'était le message brut de SQLite, « FOREIGN KEY
 * constraint failed », qui s'affichait au milieu d'une série. Séance close :
 * rien ne l'empêchait, et une réponse arrivée après la clôture changeait un
 * bilan déjà calculé et un score déjà enregistré.
 */
export function verifierSessionOuverte(d: Base, sessionId: number): void {
  const s = d.prepare(`SELECT fin, interrompue FROM exam_session WHERE id = ?`).get(sessionId) as
    | { fin: string | null; interrompue: number }
    | undefined

  if (!s) {
    throw new ErreurRequete(
      `Cette séance n’existe plus en base (session ${sessionId}) : la réponse ne peut pas être enregistrée. Relance une série.`,
      409,
    )
  }
  if (s.fin !== null) {
    throw new ErreurRequete('Cette séance est déjà close : ses réponses ne se modifient plus.', 409)
  }
  if (s.interrompue === 1) {
    throw new ErreurRequete(
      'Cette séance a été abandonnée : ses réponses ne se complètent plus. Relance une série.',
      409,
    )
  }
}
