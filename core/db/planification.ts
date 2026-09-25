import { db } from './queries'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { composerEpreuve } from '@/exams/tagemage/epreuve'
import { PARTS } from '@/exams/toeic'
import {
  ETAT_INITIAL,
  competencesDues,
  decouperEnLots,
  joursEntre,
  noteDepuisReussite,
  plafonnerAvantExamen,
  reviser,
  type EtatRevision,
  type TentativeBrute,
} from '@/core/scheduler/sm2'
import {
  ajusterBudget,
  composerSemaine,
  lundiDeLaSemaine,
  type EntreeCompetence,
  type PlanSemaine,
} from '@/core/scheduler/plan'

/**
 * La date du jour, en heure LOCALE. Les horodatages SQLite sont en UTC, et
 * `toISOString()` aussi : une série faite entre minuit et deux heures du matin
 * tombait sur la veille, et celle du dimanche soir sur la semaine suivante.
 * Les requêtes comparent donc `date(…, 'localtime')` à cette date locale.
 */
export const aujourdhuiIso = () => new Date().toLocaleDateString('sv-SE')

/** Libellé lisible d'une section, quel que soit l'examen. */
export function libelleSection(section: string): string {
  const tm = SECTIONS_PAR_ID.get(section as never)?.libelle
  if (tm) return tm

  const part = PARTS.find((p) => p.id === section)
  if (part) return `Part ${part.numero} — ${part.libelle}`

  return section === 'vocabulaire' ? 'Vocabulaire' : section
}

/**
 * Reconstruit intégralement `skill_state` en rejouant l'historique.
 *
 * `attempt` est la seule source de vérité (spécification §5) : plutôt que de
 * maintenir un état incrémental qui pourrait dériver, on le recalcule. Sur un
 * usage mono-utilisateur le coût est négligeable, et le résultat est exempt de
 * dérive par construction.
 *
 * Une révision = les tentatives d'une même sous-compétence dans une même
 * session. Un lot de moins de TENTATIVES_MINIMALES questions est ignoré : trop
 * court pour que son taux de réussite veuille dire quoi que ce soit.
 */
export function reconstruireSkillState(examId = 'tagemage', aujourdhui = aujourdhuiIso()): number {
  const d = db()

  const tentatives = d
    .prepare(
      `SELECT i.skill_id     AS skillId,
              date(s.debut, 'localtime')  AS jour,
              a.est_correct  AS juste,
              a.temps_ms     AS tempsMs
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND a.a_saute = 0 AND i.skill_id IS NOT NULL
        ORDER BY i.skill_id, s.debut, a.id`,
    )
    .all(examId) as Array<{ skillId: string; jour: string; juste: number; tempsMs: number }>

  const dateExamen =
    (
      d.prepare(`SELECT date_examen FROM exam_goal WHERE exam_id = ?`).get(examId) as
        | { date_examen: string | null }
        | undefined
    )?.date_examen ?? null

  // Agrégats cumulés, indépendants du calendrier de révision.
  const cumul = new Map<string, { n: number; justes: number; temps: number[] }>()
  const parSkill = new Map<string, TentativeBrute[]>()

  for (const t of tentatives) {
    const c = cumul.get(t.skillId) ?? { n: 0, justes: 0, temps: [] }
    c.n++
    if (t.juste) c.justes++
    c.temps.push(t.tempsMs)
    cumul.set(t.skillId, c)

    if (!parSkill.has(t.skillId)) parSkill.set(t.skillId, [])
    parSkill.get(t.skillId)!.push({ jour: t.jour, juste: Boolean(t.juste) })
  }

  const etats = new Map<string, EtatRevision>()
  for (const [skillId, liste] of parSkill) {
    let etat = ETAT_INITIAL
    for (const lot of decouperEnLots(liste)) {
      etat = reviser(etat, noteDepuisReussite(lot.justes, lot.n), lot.jour)
    }
    if (etat !== ETAT_INITIAL) etats.set(skillId, etat)
  }

  const ecrire = d.prepare(`
    INSERT INTO skill_state
      (skill_id, maitrise, n_tentatives, n_justes, temps_median_ms, taux_calibration,
       repetitions, facilite, intervalle_jours, derniere_revision, prochaine_revision)
    VALUES
      (@skillId, @maitrise, @n, @justes, @tempsMedian, NULL,
       @repetitions, @facilite, @intervalle, @derniere, @prochaine)
    ON CONFLICT (skill_id) DO UPDATE SET
      maitrise           = excluded.maitrise,
      n_tentatives       = excluded.n_tentatives,
      n_justes           = excluded.n_justes,
      temps_median_ms    = excluded.temps_median_ms,
      repetitions        = excluded.repetitions,
      facilite           = excluded.facilite,
      intervalle_jours   = excluded.intervalle_jours,
      derniere_revision  = excluded.derniere_revision,
      prochaine_revision = excluded.prochaine_revision
  `)

  const tout = d.transaction(() => {
    d.prepare(
      `DELETE FROM skill_state WHERE skill_id IN (SELECT id FROM skill WHERE exam_id = ?)`,
    ).run(examId)

    for (const [skillId, c] of cumul) {
      const etat = etats.get(skillId) ?? ETAT_INITIAL
      const tri = [...c.temps].sort((a, b) => a - b)
      const milieu = Math.floor(tri.length / 2)
      const median =
        tri.length === 0
          ? null
          : tri.length % 2 === 1
            ? tri[milieu]
            : (tri[milieu - 1] + tri[milieu]) / 2

      ecrire.run({
        skillId,
        maitrise: c.n === 0 ? null : c.justes / c.n,
        n: c.n,
        justes: c.justes,
        tempsMedian: median === null ? null : Math.round(median),
        repetitions: etat.repetitions,
        facilite: etat.facilite,
        intervalle: etat.intervalleJours,
        derniere: etat.derniereRevision,
        prochaine: etat.prochaineRevision
          ? plafonnerAvantExamen(etat.prochaineRevision, aujourdhui, dateExamen)
          : null,
      })
    }
  })

  tout()
  return cumul.size
}

/* ---------------------------------------------------- lecture du plan -- */

export interface EtatPlanification {
  semaineDu: string
  budget: ReturnType<typeof ajusterBudget>
  heuresDeclarees: number | null
  plan: PlanSemaine
  dues: EntreeCompetence[]
  /** Révisions déjà programmées, à une date future. */
  aVenir: Array<EntreeCompetence & { prochaineRevision: string; dansJours: number }>
  faibles: EntreeCompetence[]
  joursRestants: number | null
  dateExamen: string | null
  realiseSemaineMinutes: number | null
  competencesSuivies: number
  totalCompetencesAvecItems: number
}

/** Plafond de durée par question : au-delà, la session est restée ouverte sans travail. */
export const MINUTES_MAX_PAR_QUESTION = 4

/**
 * Minutes réellement travaillées sur une semaine, mesurées depuis les séances.
 * Jamais déclaratif : c'est ce qui permet de recalibrer le budget honnêtement.
 *
 * On mesurait la somme des `temps_ms`, c'est-à-dire le seul temps passé à
 * choisir une réponse : ni la déclaration de confiance, ni la lecture d'un
 * texte support, ni le passage d'une question à l'autre. Une série de
 * vingt-cinq minutes comptait pour une dizaine. On prend désormais la durée
 * de la séance, de son ouverture à sa dernière réponse, plafonnée à
 * MINUTES_MAX_PAR_QUESTION par question pour qu'un onglet oublié ouvert ne
 * compte pas comme du travail — et jamais moins que le temps de réponse. Le
 * temps de lecture des corrections, mesuré après la clôture, s'y ajoute.
 */
export function volumeRealiseMinutes(semaineDu: string, examId = 'tagemage'): number {
  const r = db()
    .prepare(
      `SELECT COALESCE(SUM(minutes), 0) AS minutes FROM (
         SELECT MAX(
                  SUM(a.temps_ms) / 60000.0,
                  MIN(
                    (julianday(COALESCE(s.fin, MAX(a.created_at))) - julianday(s.debut)) * 1440,
                    COUNT(a.id) * ?
                  )
                ) + s.correction_ms / 60000.0 AS minutes
           FROM exam_session s
           JOIN attempt a ON a.session_id = s.id
          WHERE s.exam_id = ?
            AND date(s.debut, 'localtime') >= date(?)
            AND date(s.debut, 'localtime') <  date(?, '+7 days')
          GROUP BY s.id
       )`,
    )
    .get(MINUTES_MAX_PAR_QUESTION, examId, semaineDu, semaineDu) as { minutes: number }

  return Math.round(r.minutes)
}

export interface OptionsPlanification {
  aujourdhui?: string
  /**
   * Budget imposé par l'arbitrage entre les deux examens (lot 7). Quand il est
   * fourni, il remplace le recalibrage mono-examen : la répartition a déjà eu
   * lieu un niveau au-dessus.
   */
  budgetImposeMinutes?: number
}

export function etatPlanification(
  examId = 'tagemage',
  options: OptionsPlanification = {},
): EtatPlanification {
  const aujourdhui = options.aujourdhui ?? aujourdhuiIso()
  const d = db()
  reconstruireSkillState(examId, aujourdhui)

  const objectif = d
    .prepare(`SELECT date_examen FROM exam_goal WHERE exam_id = ?`)
    .get(examId) as { date_examen: string | null } | undefined

  const profil = d
    .prepare(`SELECT heures_dispo_semaine FROM user_profile WHERE id = 1`)
    .get() as { heures_dispo_semaine: number | null } | undefined

  const dateExamen = objectif?.date_examen ?? null
  const joursRestants = dateExamen ? joursEntre(aujourdhui, dateExamen) : null

  // Seules les compétences disposant d'items en banque sont planifiables.
  const lignes = d
    .prepare(
      `SELECT k.id                       AS skillId,
              k.libelle                  AS libelle,
              k.section                  AS section,
              COALESCE(st.n_tentatives, 0) AS n,
              st.maitrise                AS maitrise,
              st.prochaine_revision      AS prochaineRevision
         FROM skill k
         JOIN item i ON i.skill_id = k.id AND i.statut = 'valide'
         LEFT JOIN skill_state st ON st.skill_id = k.id
        WHERE k.exam_id = ?
        GROUP BY k.id
        ORDER BY k.section, k.ordre`,
    )
    .all(examId) as Array<{
    skillId: string
    libelle: string
    section: string
    n: number
    maitrise: number | null
    prochaineRevision: string | null
  }>

  const entree = (l: (typeof lignes)[number]): EntreeCompetence => ({
    skillId: l.skillId,
    libelle: l.libelle,
    section: l.section,
    sectionLibelle: libelleSection(l.section),
    n: l.n,
    tauxReussite: l.maitrise ?? 0,
    joursDeRetard: null,
    jamaisVue: l.n === 0,
  })

  const parId = new Map(lignes.map((l) => [l.skillId, l]))

  const dues = competencesDues(
    lignes.map((l) => ({ skillId: l.skillId, prochaineRevision: l.prochaineRevision })),
    aujourdhui,
  ).map((c) => {
    const l = parId.get(c.skillId)!
    return {
      ...entree(l),
      joursDeRetard: Number.isFinite(c.joursDeRetard) ? c.joursDeRetard : null,
    }
  })

  const idsDus = new Set(dues.map((c) => c.skillId))
  const aVenir = lignes
    .filter((l) => l.prochaineRevision !== null && !idsDus.has(l.skillId))
    .map((l) => ({
      ...entree(l),
      prochaineRevision: l.prochaineRevision!,
      dansJours: joursEntre(aujourdhui, l.prochaineRevision!),
    }))
    .sort((a, b) => a.dansJours - b.dansJours)

  const faibles = lignes
    .filter((l) => l.n > 0 && (l.maitrise ?? 1) < 0.75)
    .sort((a, b) => (a.maitrise ?? 0) - (b.maitrise ?? 0))
    .map(entree)

  const semaineDu = lundiDeLaSemaine(aujourdhui)
  const semainePrecedente = lundiDeLaSemaine(
    new Date(new Date(`${semaineDu}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10),
  )

  const heuresDeclarees = profil?.heures_dispo_semaine ?? null
  const realisePrecedent = volumeRealiseMinutes(semainePrecedente, examId)
  const aDesDonneesPrecedentes =
    (d
      .prepare(
        `SELECT COUNT(*) AS n FROM exam_session
          WHERE exam_id = ? AND date(debut, 'localtime') < date(?)`,
      )
      .get(examId, semaineDu) as { n: number }).n > 0

  const budget =
    options.budgetImposeMinutes !== undefined
      ? {
          budgetMinutes: options.budgetImposeMinutes,
          verdict: 'tenu' as const,
          message: `Part attribuée par l’arbitrage entre les deux examens : ${options.budgetImposeMinutes} min.`,
        }
      : ajusterBudget(
          (heuresDeclarees ?? 5) * 60,
          aDesDonneesPrecedentes ? realisePrecedent : null,
        )

  const derniereEpreuve = d
    .prepare(
      `SELECT type, date(debut, 'localtime') AS jour FROM exam_session
        WHERE exam_id = ? AND type IN ('blanc','diagnostic') AND fin IS NOT NULL
        ORDER BY id DESC LIMIT 1`,
    )
    .get(examId) as { type: string; jour: string } | undefined

  const dernierBlanc = d
    .prepare(
      `SELECT date(debut, 'localtime') AS jour FROM exam_session
        WHERE exam_id = ? AND type = 'blanc' AND fin IS NOT NULL
        ORDER BY id DESC LIMIT 1`,
    )
    .get(examId) as { jour: string } | undefined

  // Un blanc complet suppose assez d'items dans chacun des six sous-tests.
  // Le blanc complet n'existe qu'au TAGE MAGE : le TOEIC attend sa chaîne
  // audio (lot 8), donc aucune épreuve complète n'est proposable pour lui.
  const modele = examId === 'tagemage' ? composerEpreuve('blanc') : []
  const disponibles = new Map(
    (
      d
        .prepare(
          `SELECT section, COUNT(*) AS n FROM item
            WHERE exam_id = ? AND statut = 'valide' GROUP BY section`,
        )
        .all(examId) as Array<{ section: string; n: number }>
    ).map((r) => [r.section, r.n]),
  )
  const banqueSuffisantePourBlanc =
    modele.length > 0 && modele.every((e) => (disponibles.get(e.section) ?? 0) >= e.questions)

  const plan = composerSemaine({
    budgetMinutes: budget.budgetMinutes,
    dues,
    faibles,
    joursRestants,
    semainesDepuisDernierBlanc: dernierBlanc
      ? Math.floor(joursEntre(dernierBlanc.jour, aujourdhui) / 7)
      : null,
    banqueSuffisantePourBlanc,
    aDejaPasseUneEpreuve: Boolean(derniereEpreuve),
    epreuvesDisponibles: examId === 'tagemage',
  })

  return {
    semaineDu,
    budget,
    heuresDeclarees,
    plan,
    dues,
    aVenir,
    faibles,
    joursRestants,
    dateExamen,
    realiseSemaineMinutes: volumeRealiseMinutes(semaineDu, examId),
    competencesSuivies: lignes.filter((l) => l.n > 0).length,
    totalCompetencesAvecItems: lignes.length,
  }
}

/** Persiste le plan de la semaine, pour pouvoir comparer prévu et réalisé. */
export function enregistrerPlan(etat: EtatPlanification, examId = 'tagemage'): void {
  db()
    .prepare(
      `INSERT INTO study_plan (semaine_du, allocation, objectifs, volume_prevu_min, volume_realise, ajustements_texte)
       VALUES (@semaine, @allocation, @objectifs, @prevu, @realise, @texte)
       ON CONFLICT (semaine_du) DO UPDATE SET
         allocation        = excluded.allocation,
         objectifs         = excluded.objectifs,
         volume_prevu_min  = excluded.volume_prevu_min,
         volume_realise    = excluded.volume_realise,
         ajustements_texte = excluded.ajustements_texte`,
    )
    .run({
      semaine: etat.semaineDu,
      allocation: JSON.stringify({ [examId]: etat.plan.minutesPlanifiees }),
      objectifs: JSON.stringify(etat.plan.seances),
      prevu: etat.plan.minutesPlanifiees,
      realise: JSON.stringify({ [examId]: etat.realiseSemaineMinutes }),
      texte: etat.budget.message,
    })
}
