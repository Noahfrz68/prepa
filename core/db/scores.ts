/**
 * Scores des épreuves : le dernier, l'historique, et ce qui dit de quelle
 * nature ils sont (part d'annales). Tout ce qui reste de l'ancien module
 * « arbitrage », dont le planificateur n'était plus appelé nulle part.
 */
import { db } from './queries'
import { estimationReading } from './toeic'
import { estimerScoreParSousTest } from '@/core/stats/diagnostic'
import { natureDe, type NatureEpreuve } from '@/core/stats/nature'

/**
 * Score estimé courant.
 *
 * TAGE MAGE : le score de la dernière épreuve close. TOEIC : l'estimation
 * Reading extrapolée, seule section construite à ce stade — donc doublée pour
 * approcher un total sur 990, avec la grossièreté que ça suppose et qui est
 * dite à l'écran.
 */
export function scoreEstime(examId: string): number | null {
  if (examId === 'toeic_lr') {
    const e = estimationReading()
    if (e.nItems === 0) return null
    // Faute de Listening (lot 8), on suppose la même performance des deux
    // côtés. C'est une hypothèse, pas une mesure.
    return e.scoreSection * 2
  }

  const l = db()
    .prepare(
      `SELECT score_echelle AS score FROM exam_session
        WHERE exam_id = ? AND type IN ('blanc','diagnostic') AND fin IS NOT NULL
          AND score_echelle IS NOT NULL
        ORDER BY id DESC LIMIT 1`,
    )
    .get(examId) as { score: number } | undefined

  return l?.score ?? null
}

/**
 * Part des questions d'une épreuve tirées d'annales réelles (étiquette
 * « annale »), entre 0 et 1. Sert à ne comparer que des épreuves de même
 * nature (voir core/stats/nature.ts).
 */
export function partAnnales(sessionId: number): number {
  const l = db()
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(i.tags = 'annale'), 0) AS annales
         FROM attempt a JOIN item i ON i.id = a.item_id
        WHERE a.session_id = ?`,
    )
    .get(sessionId) as { n: number; annales: number }
  return l.n === 0 ? 0 : l.annales / l.n
}

/**
 * Réussite sur tout l'historique, selon l'origine des questions : annales
 * réelles ou non. L'écart dit de combien une épreuve de questions générées
 * surestime le niveau mesuré sur annales. Null tant qu'une des deux origines
 * compte moins de 30 réponses.
 */
export function reussiteParOrigine(examId = 'tagemage'): { annales: number; autres: number } | null {
  const l = db()
    .prepare(
      `SELECT SUM(i.tags = 'annale') AS nA, SUM(CASE WHEN i.tags = 'annale' THEN a.est_correct ELSE 0 END) AS jA,
              SUM(i.tags IS NOT 'annale') AS nG, SUM(CASE WHEN i.tags IS NOT 'annale' THEN a.est_correct ELSE 0 END) AS jG
         FROM attempt a JOIN item i ON i.id = a.item_id
        WHERE i.exam_id = ?`,
    )
    .get(examId) as { nA: number | null; jA: number | null; nG: number | null; jG: number | null }
  if (!l.nA || !l.nG || l.nA < 30 || l.nG < 30) return null
  return { annales: (l.jA ?? 0) / l.nA, autres: (l.jG ?? 0) / l.nG }
}

/** Une épreuve close, telle qu'elle apparaît dans l'historique de l'accueil. */
export interface ScoreHistorique {
  sessionId: number
  jour: string
  score: number
  type: string
  /** Intervalle à 95 % du score (TAGE MAGE) ; null quand il n'est pas calculable. */
  bas: number | null
  haut: number | null
  /** Questions répondues dans l'épreuve. */
  n: number
  /** Part de questions d'annales, et la nature qui en découle. */
  partAnnales: number
  nature: NatureEpreuve
}

/**
 * Les dernières épreuves chiffrées, de la plus ancienne à la plus récente.
 *
 * L'accueil disait où l'on en est et ce qu'il faut faire cette semaine, jamais
 * d'où l'on vient. Or c'est la progression qui fait revenir, et la donnée
 * existait déjà — il ne manquait que de la lire.
 *
 * Seules les épreuves complètes comptent : une série de quinze questions n'est
 * pas comparable à un blanc, et les mélanger ferait une courbe qui ne mesure
 * rien.
 */
export function historiqueScores(examId: string, combien = 6): ScoreHistorique[] {
  const lignes = db()
    .prepare(
      // Tri sur la date, pas sur l'identifiant : les deux coïncident tant que
      // les séances sont créées dans l'ordre, mais c'est la chronologie que la
      // courbe prétend montrer, et c'est donc elle qui doit la commander.
      `SELECT id AS sessionId, date(debut, 'localtime') AS jour, score_echelle AS score, type
         FROM exam_session
        WHERE exam_id = ? AND type IN ('blanc','diagnostic') AND fin IS NOT NULL
          AND score_echelle IS NOT NULL
        ORDER BY debut DESC, id DESC LIMIT ?`,
    )
    .all(examId, combien) as Array<Omit<ScoreHistorique, 'bas' | 'haut' | 'n' | 'partAnnales' | 'nature'>>

  // L'intervalle de chaque épreuve, recalculé comme au bilan : un score sans
  // sa marge d'erreur fait lire comme un progrès ce qui n'est que du bruit
  // (214 → 431 sur 42 questions, c'est ±70 points de chaque côté).
  const parSection = db().prepare(
    `SELECT i.section, COUNT(*) AS n, SUM(a.est_correct) AS justes, SUM(a.a_saute) AS blanches
       FROM attempt a JOIN item i ON i.id = a.item_id
      WHERE a.session_id = ?
      GROUP BY i.section`,
  )

  return lignes.reverse().map((l) => {
    if (examId !== 'tagemage') return { ...l, bas: null, haut: null, n: 0, partAnnales: 0, nature: 'generees' as const }
    const part = partAnnales(l.sessionId)
    const sections = parSection.all(l.sessionId) as Array<{ n: number; justes: number; blanches: number }>
    const s = estimerScoreParSousTest(
      sections.map((x) => ({
        nItems: x.n,
        justes: x.justes,
        blanches: x.blanches,
        fausses: x.n - x.justes - x.blanches,
      })),
    )
    return {
      ...l,
      bas: s.bas,
      haut: s.haut,
      n: sections.reduce((a, x) => a + x.n, 0),
      partAnnales: part,
      nature: natureDe(part),
    }
  })
}

/**
 * Le dernier score mesuré sur une épreuve « sur annales » (core/stats/nature.ts).
 *
 * Le dernier score tout court peut venir d'une épreuve surtout composée de
 * questions générées, mieux réussies que les annales : affiché seul, il
 * surestime le niveau. Celui-ci est le repère comparable à l'épreuve réelle.
 */
export function dernierScoreSurAnnales(
  examId = 'tagemage',
): { sessionId: number; score: number; jour: string } | null {
  const lignes = db()
    .prepare(
      `SELECT id AS sessionId, score_echelle AS score, date(debut, 'localtime') AS jour
         FROM exam_session
        WHERE exam_id = ? AND type IN ('blanc','diagnostic') AND fin IS NOT NULL
          AND score_echelle IS NOT NULL
        ORDER BY debut DESC, id DESC`,
    )
    .all(examId) as Array<{ sessionId: number; score: number; jour: string }>
  return lignes.find((l) => natureDe(partAnnales(l.sessionId)) === 'annales') ?? null
}
