import { db } from '@/core/db/queries'
import { SECTIONS, SECTIONS_PAR_ID } from '@/exams/tagemage'
import { modeleEnonce } from '@/core/scheduler/tirage'
import { reussiteAFroid, type ReussiteAFroid } from './afroid'
import {
  questionsAExpedier,
  calibrer,
  classerLeviers,
  diagnostiquerCalibration,
  evaluerRegleRemplissage,
  qualifierCompetences,
  type CompetenceQualifiee,
  type Levier,
  type Niveau,
  type NiveauCalibration,
} from './calculs'

/**
 * Toutes les statistiques sont recalculées depuis `attempt`, jamais lues dans
 * une agrégation stockée. `skill_state` reste un cache réservé à la répétition
 * espacée (lot 4).
 *
 * Les tentatives sautées sont exclues de la calibration et des temps : un saut
 * n'exprime aucune confiance, et son temps ne mesure aucune résolution. Elles
 * comptent en revanche dans les taux de réussite, comme partout ailleurs.
 *
 * Même règle pour ce qui n'a pas été mesuré : une confiance que personne n'a
 * déclarée (feuille papier laissée vide, `confiance_declaree = 0`) n'entre pas
 * dans la calibration, et un temps déclaré en bloc puis réparti également
 * (épreuve papier, `temps_mesure = 0`) n'entre dans aucune médiane.
 */

export interface SyntheseStrategie {
  nTentatives: number
  nRepondues: number
  calibration: NiveauCalibration[]
  diagnostic: ReturnType<typeof diagnostiquerCalibration>
  regle: ReturnType<typeof evaluerRegleRemplissage>
  competences: CompetenceQualifiee[]
  puits: CompetenceQualifiee[]
  leviers: Array<
    Levier & {
      libelle: string
      numero: number
      /** Questions à expédier d’un trait, distinct du décompte `blanches`. */
      recommandationBlanches: ReturnType<typeof questionsAExpedier>
    }
  >
  tempsMedianGlobalMs: number | null
  /** Médiane des questions traitées, par sous-test : la référence des puits de temps. */
  tempsMedianParSection: Map<string, number>
}

export function syntheseStrategie(examId = 'tagemage'): SyntheseStrategie {
  const d = db()

  /* ---------------------------------------------------- calibration -- */

  const brutCalibration = d
    .prepare(
      `SELECT a.confiance AS niveau, COUNT(*) AS n, SUM(a.est_correct) AS justes
         FROM attempt a
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND a.a_saute = 0 AND a.confiance_declaree = 1
        GROUP BY a.confiance`,
    )
    .all(examId) as Array<{ niveau: Niveau; n: number; justes: number }>

  const calibration = calibrer(brutCalibration)
  const diagnostic = diagnostiquerCalibration(calibration)

  /* ------------------------------------------- règle du remplissage -- */

  const compteurs = d
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN a.a_saute = 0 THEN 1 ELSE 0 END) AS repondues,
              SUM(CASE WHEN a.a_saute = 1 OR a.reponse_donnee IS NULL THEN 1 ELSE 0 END) AS blanches
         FROM attempt a
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ?`,
    )
    .get(examId) as { total: number; repondues: number | null; blanches: number | null }

  const nRepondues = compteurs.repondues ?? 0
  const regle = evaluerRegleRemplissage(compteurs.blanches ?? 0, compteurs.total ?? 0)

  /* -------------------------------------------------- temps médians -- */

  const tempsMedianGlobalMs = medianeSql(
    `SELECT a.temps_ms AS v
       FROM attempt a
       JOIN exam_session s ON s.id = a.session_id
      WHERE s.exam_id = ? AND a.a_saute = 0 AND a.temps_mesure = 1`,
    [examId],
  )

  /* ---------------------------------------------- sous-compétences -- */

  // Le taux compte les sauts (bonnes réponses / questions servies, la même
  // définition que le hub et le plan) ; le temps médian, lui, ne porte que sur
  // les questions traitées — le temps d'un saut ne dit rien de la difficulté.
  const lignesCompetences = d
    .prepare(
      `WITH base AS (
         SELECT i.skill_id, a.temps_ms, a.est_correct, a.a_saute,
                -- Le temps n'a de sens que pour une question traitée ET chronométrée.
                (a.a_saute = 1 OR a.temps_mesure = 0) AS sans_temps,
                ROW_NUMBER() OVER (PARTITION BY i.skill_id, (a.a_saute = 1 OR a.temps_mesure = 0) ORDER BY a.temps_ms) AS rang,
                COUNT(*)     OVER (PARTITION BY i.skill_id, (a.a_saute = 1 OR a.temps_mesure = 0))                     AS nr
           FROM attempt a
           JOIN item i         ON i.id = a.item_id
           JOIN exam_session s ON s.id = a.session_id
          WHERE s.exam_id = ? AND i.skill_id IS NOT NULL
       )
       SELECT b.skill_id                                            AS skillId,
              k.libelle                                             AS libelle,
              k.section                                             AS section,
              COUNT(*)                                              AS n,
              SUM(b.est_correct)                                    AS justes,
              AVG(CASE WHEN b.sans_temps = 0 AND b.rang IN ((b.nr + 1) / 2, (b.nr + 2) / 2)
                       THEN b.temps_ms END)                         AS tempsMedianMs
         FROM base b
         JOIN skill k ON k.id = b.skill_id
        GROUP BY b.skill_id, k.libelle, k.section`,
    )
    .all(examId) as Array<{
    skillId: string
    libelle: string
    section: string
    n: number
    justes: number
    tempsMedianMs: number
  }>

  // Médiane des questions traitées, sous-test par sous-test : c'est la
  // référence de lenteur d'une sous-compétence.
  const tempsMedianParSection = new Map(
    (
      d
        .prepare(
          `WITH base AS (
             SELECT i.section, a.temps_ms,
                    ROW_NUMBER() OVER (PARTITION BY i.section ORDER BY a.temps_ms) AS rang,
                    COUNT(*)     OVER (PARTITION BY i.section)                     AS n
               FROM attempt a
               JOIN item i         ON i.id = a.item_id
               JOIN exam_session s ON s.id = a.session_id
              WHERE s.exam_id = ? AND a.a_saute = 0 AND a.temps_mesure = 1
           )
           SELECT section, AVG(temps_ms) AS mediane
             FROM base
            WHERE rang IN ((n + 1) / 2, (n + 2) / 2)
            GROUP BY section`,
        )
        .all(examId) as Array<{ section: string; mediane: number }>
    ).map((r) => [r.section, r.mediane]),
  )

  const competences = qualifierCompetences(
    lignesCompetences.map((l) => ({ ...l, tempsMedianMs: l.tempsMedianMs ?? 0 })),
    tempsMedianParSection,
  ).sort((a, b) => a.tauxReussite - b.tauxReussite)

  /* ---------------------------------------------------- par section -- */

  const lignesSections = d
    .prepare(
      `SELECT i.section                                                        AS section,
              COUNT(*)                                                         AS n,
              SUM(a.est_correct)                                               AS justes,
              SUM(CASE WHEN a.a_saute = 0 AND a.est_correct = 0 THEN 1 ELSE 0 END) AS fausses,
              SUM(a.a_saute)                                                   AS blanches,
              SUM(a.points_gagnes)                                             AS points,
              SUM(CASE WHEN a.temps_mesure = 1 THEN a.temps_ms ELSE 0 END)     AS tempsMs
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ?
        GROUP BY i.section`,
    )
    .all(examId) as Array<{
    section: string
    n: number
    justes: number
    fausses: number
    blanches: number
    points: number
    tempsMs: number
  }>

  const repartition = d
    .prepare(
      `SELECT i.section AS section, a.confiance AS niveau, COUNT(*) AS n
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND a.a_saute = 0 AND a.confiance_declaree = 1
        GROUP BY i.section, a.confiance`,
    )
    .all(examId) as Array<{ section: string; niveau: Niveau; n: number }>

  const leviers = classerLeviers(lignesSections).map((l) => {
    const spec = SECTIONS_PAR_ID.get(l.section as never)
    return {
      ...l,
      libelle: spec?.libelle ?? l.section,
      numero: spec?.numero ?? 0,
      recommandationBlanches: questionsAExpedier(
        repartition.filter((r) => r.section === l.section),
        calibration,
      ),
    }
  })

  return {
    nTentatives: compteurs.total ?? 0,
    nRepondues,
    calibration,
    diagnostic,
    regle,
    competences,
    puits: competences.filter((c) => c.estPuits),
    leviers,
    tempsMedianGlobalMs,
    tempsMedianParSection,
  }
}

/** Médiane calculée en SQL : évite de rapatrier toutes les tentatives. */
function medianeSql(sourceSql: string, params: unknown[]): number | null {
  const r = db()
    .prepare(
      `WITH v AS (${sourceSql}),
            r AS (SELECT v.v,
                         ROW_NUMBER() OVER (ORDER BY v.v) AS rang,
                         COUNT(*)     OVER ()             AS n
                    FROM v)
       SELECT AVG(r.v) AS mediane
         FROM r
        WHERE r.rang IN ((r.n + 1) / 2, (r.n + 2) / 2)`,
    )
    .get(...(params as [])) as { mediane: number | null } | undefined

  return r?.mediane ?? null
}

/** Sections jamais travaillées : utile pour distinguer « faible » de « inconnu ». */
export function sectionsSansDonnees(leviers: Array<{ section: string }>): string[] {
  const vues = new Set(leviers.map((l) => l.section))
  return SECTIONS.filter((s) => !vues.has(s.id)).map((s) => s.libelle)
}

/** Sous-tests où le début de l'énoncé ou le texte support est un vrai scénario. */
const SCENARIO_PAR_ENONCE = new Set(['calcul', 'raisonnement', 'conditions_minimales'])

/** Réussite à froid et avec l'habitude, par sous-test (core/stats/afroid.ts). */
export function reussiteAFroidParSection(examId = 'tagemage'): ReussiteAFroid[] {
  const lignes = db()
    .prepare(
      `SELECT i.section, i.skill_id AS skillId, i.enonce, i.contexte_texte AS texte, a.est_correct AS juste
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ?
        ORDER BY a.id`,
    )
    .all(examId) as Array<{ section: string; skillId: string | null; enonce: string; texte: string | null; juste: number }>

  return reussiteAFroid(
    lignes.map((l) => ({
      section: l.section,
      scenario:
        l.section === 'comprehension'
          ? l.texte
          : SCENARIO_PAR_ENONCE.has(l.section)
            ? `${l.skillId ?? ''}|${modeleEnonce(l.enonce)}`
            : null,
      juste: l.juste === 1,
    })),
  )
}
