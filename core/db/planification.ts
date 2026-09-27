import { db } from './queries'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { PARTS } from '@/exams/toeic'
import {
  ETAT_INITIAL,
  decouperEnLots,
  noteDepuisReussite,
  plafonnerAvantExamen,
  reviser,
  type EtatRevision,
  type TentativeBrute,
} from '@/core/scheduler/sm2'

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
              a.temps_ms     AS tempsMs,
              a.temps_mesure AS tempsMesure
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND a.a_saute = 0 AND i.skill_id IS NOT NULL
        ORDER BY i.skill_id, s.debut, a.id`,
    )
    .all(examId) as Array<{ skillId: string; jour: string; juste: number; tempsMs: number; tempsMesure: number }>

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
    // Un temps déclaré en bloc (épreuve papier) ne dit rien de cette question.
    if (t.tempsMesure === 1) c.temps.push(t.tempsMs)
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
