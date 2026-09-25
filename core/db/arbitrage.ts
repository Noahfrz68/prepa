import { db } from './queries'
import { etatPlanification, volumeRealiseMinutes, aujourdhuiIso, type EtatPlanification } from './planification'
import { estimationReading } from './toeic'
import { joursEntre } from '@/core/scheduler/sm2'
import {
  MINUTES_BLANC,
  MINUTES_PAR_SEANCE,
  SKILLS_PAR_SEANCE,
  ajusterBudget,
  lundiDeLaSemaine,
} from '@/core/scheduler/plan'
import {
  arbitrer,
  calculerPente,
  type Allocation,
  type Arbitrage,
  type EntreeExamen,
} from '@/core/scheduler/arbitrage'
import { estimerScoreParSousTest } from '@/core/stats/diagnostic'

const LIBELLES: Record<string, string> = { tagemage: 'TAGE MAGE', toeic_lr: 'TOEIC' }
export const ECHELLE_MAX: Record<string, number> = { tagemage: 600, toeic_lr: 990 }

/** Fenêtre sur laquelle on mesure la pente de progression. */
export const SEMAINES_MESURE_PENTE = 8

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
    .all(examId, combien) as Array<Omit<ScoreHistorique, 'bas' | 'haut' | 'n'>>

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
    if (examId !== 'tagemage') return { ...l, bas: null, haut: null, n: 0 }
    const sections = parSection.all(l.sessionId) as Array<{ n: number; justes: number; blanches: number }>
    const s = estimerScoreParSousTest(
      sections.map((x) => ({
        nItems: x.n,
        justes: x.justes,
        blanches: x.blanches,
        fausses: x.n - x.justes - x.blanches,
      })),
    )
    return { ...l, bas: s.bas, haut: s.haut, n: sections.reduce((a, x) => a + x.n, 0) }
  })
}

/**
 * Pente mesurée sur les épreuves des dernières semaines, rapportée aux heures
 * réellement investies sur la même période.
 */
function penteObservee(examId: string, aujourdhui: string): number | null {
  const d = db()
  const depuis = new Date(
    new Date(`${aujourdhui}T00:00:00Z`).getTime() - SEMAINES_MESURE_PENTE * 7 * 86_400_000,
  )
    .toISOString()
    .slice(0, 10)

  const scores = (
    d
      .prepare(
        `SELECT score_echelle AS score, date(debut, 'localtime') AS jour FROM exam_session
          WHERE exam_id = ? AND type IN ('blanc','diagnostic') AND fin IS NOT NULL
            AND score_echelle IS NOT NULL AND date(debut, 'localtime') >= date(?)
          ORDER BY debut`,
      )
      .all(examId, depuis) as Array<{ score: number; jour: string }>
  ).filter((s) => typeof s.score === 'number')

  if (scores.length < 2) return null

  const ms = (
    d
      .prepare(
        `SELECT COALESCE(SUM(a.temps_ms), 0) AS ms
           FROM attempt a JOIN exam_session s ON s.id = a.session_id
          WHERE s.exam_id = ? AND date(s.debut, 'localtime') >= date(?) AND date(s.debut, 'localtime') <= date(?)`,
      )
      .get(examId, scores[0].jour, scores[scores.length - 1].jour) as { ms: number }
  ).ms

  return calculerPente(scores, ms / 3_600_000)
}

function banqueVide(examId: string): boolean {
  const n = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM item WHERE exam_id = ? AND statut = 'valide'`)
      .get(examId) as { n: number }
  ).n
  return n === 0
}

/**
 * Minutes que l'examen peut réellement absorber cette semaine.
 *
 * Estimée depuis le contenu disponible : les sous-compétences ayant des
 * questions en banque, regroupées en séances d'un seul sous-test. Sans ce
 * plafond, l'arbitrage attribue des heures que le module ne saura pas remplir
 * — observé en conditions réelles : le TOEIC recevait 2 h 30 et n'en
 * planifiait que 30 min, les deux heures restantes étant perdues pour le
 * TAGE MAGE alors que son examen était dans cinq semaines.
 */
export function capaciteMinutes(examId: string): number {
  const parSection = db()
    .prepare(
      `SELECT k.section AS section, COUNT(DISTINCT k.id) AS n
         FROM skill k
         JOIN item i ON i.skill_id = k.id AND i.statut = 'valide'
        WHERE k.exam_id = ?
        GROUP BY k.section`,
    )
    .all(examId) as Array<{ section: string; n: number }>

  const seances = parSection.reduce((acc, s) => acc + Math.ceil(s.n / SKILLS_PAR_SEANCE), 0)
  const epreuve = examId === 'tagemage' ? MINUTES_BLANC : 0

  // Les questions non taguées restent travaillables en entraînement libre :
  // on ne descend donc pas en dessous d'une séance dès qu'il y a des items.
  const minimal = banqueVide(examId) ? 0 : MINUTES_PAR_SEANCE

  return Math.max(minimal, seances * MINUTES_PAR_SEANCE + epreuve)
}

export function entreeExamen(examId: string, aujourdhui: string): EntreeExamen {
  const objectif = db()
    .prepare(`SELECT date_examen, score_cible FROM exam_goal WHERE exam_id = ?`)
    .get(examId) as { date_examen: string | null; score_cible: number | null } | undefined

  const dateExamen = objectif?.date_examen ?? null

  return {
    examId,
    libelle: LIBELLES[examId] ?? examId,
    joursRestants: dateExamen ? joursEntre(aujourdhui, dateExamen) : null,
    scoreCible: objectif?.score_cible ?? null,
    scoreEstime: scoreEstime(examId),
    penteObservee: penteObservee(examId, aujourdhui),
    banqueVide: banqueVide(examId),
    capaciteMinutes: capaciteMinutes(examId),
  }
}

export interface PlanHebdomadaire {
  semaineDu: string
  heuresDeclarees: number | null
  budget: ReturnType<typeof ajusterBudget>
  arbitrage: Arbitrage
  /** Plan détaillé par examen, dans l'ordre des allocations. */
  plans: Array<{ allocation: Allocation; etat: EtatPlanification | null }>
  realiseSemaineMinutes: number
}

/**
 * Plan hebdomadaire complet : un seul budget, arbitré entre les deux examens,
 * puis décliné en séances dans chacun.
 *
 * Le budget global est d'abord recalibré sur le volume réellement effectué la
 * semaine passée (lot 4), puis réparti (lot 7). L'ordre compte : on arbitre un
 * budget réaliste, pas un budget déclaré.
 */
export function planHebdomadaire(aujourdhui = aujourdhuiIso()): PlanHebdomadaire {
  const d = db()

  const actifs = (
    d.prepare(`SELECT exam_id FROM exam_goal WHERE actif = 1 ORDER BY exam_id = 'tagemage' DESC`).all() as Array<{
      exam_id: string
    }>
  ).map((r) => r.exam_id)

  const profil = d.prepare(`SELECT heures_dispo_semaine FROM user_profile WHERE id = 1`).get() as
    | { heures_dispo_semaine: number | null }
    | undefined

  const heuresDeclarees = profil?.heures_dispo_semaine ?? null
  const semaineDu = lundiDeLaSemaine(aujourdhui)
  const semainePrecedente = lundiDeLaSemaine(
    new Date(new Date(`${semaineDu}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10),
  )

  const aDesDonneesPrecedentes =
    (
      d
        .prepare(`SELECT COUNT(*) AS n FROM exam_session WHERE date(debut, 'localtime') < date(?)`)
        .get(semaineDu) as { n: number }
    ).n > 0

  const realisePrecedent = actifs.reduce(
    (acc, e) => acc + volumeRealiseMinutes(semainePrecedente, e),
    0,
  )

  const budget = ajusterBudget(
    (heuresDeclarees ?? 5) * 60,
    aDesDonneesPrecedentes ? realisePrecedent : null,
  )

  const entrees = actifs.map((e) => entreeExamen(e, aujourdhui))
  const arbitrage = arbitrer(entrees, budget.budgetMinutes)

  const plans = arbitrage.allocations.map((allocation) => ({
    allocation,
    etat:
      allocation.minutes > 0
        ? etatPlanification(allocation.examId, {
            aujourdhui,
            budgetImposeMinutes: allocation.minutes,
          })
        : null,
  }))

  return {
    semaineDu,
    heuresDeclarees,
    budget,
    arbitrage,
    plans,
    realiseSemaineMinutes: actifs.reduce((acc, e) => acc + volumeRealiseMinutes(semaineDu, e), 0),
  }
}
