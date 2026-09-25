import { db, etatSectionsTageMage, mesuresParSkill, profil } from './queries'
import {
  reconstruireSkillState,
  aujourdhuiIso,
  libelleSection,
  volumeRealiseMinutes,
} from './planification'
import { LECONS, PARCOURS } from '@/exams/tagemage/lecons'
import { SECTIONS } from '@/exams/tagemage'
import {
  composerSemaine,
  lundiDeLaSemaine,
  type BesoinSection,
  type LeconAPlanifier,
  type SemaineComposee,
  type Tache,
} from '@/core/scheduler/semaine'

/**
 * Le plan de la semaine : composé une fois le lundi, puis figé.
 *
 * Un plan recomposé à chaque affichage ne permet ni de cocher ce qui est fait,
 * ni de savoir si l'on est en retard : il se réécrit pour coller à ce qu'on
 * vient de faire, et donne toujours raison. On l'écrit donc en base au premier
 * accès de la semaine, et on ne le touche plus — sauf demande explicite.
 */

export interface TacheEnregistree extends Tache {
  id: number
  /** Coché à la main. Reste possible pour ce qui échappe à la mesure (un cours lu sur papier). */
  faitLe: string | null
  /**
   * Ce que la base montre de fait cette semaine, sans rien demander :
   * séries closes dans le sous-test, leçons marquées étudiées, épreuves
   * terminées. `sur` est la quantité prévue.
   */
  mesure: { faits: number; sur: number }
  /** Fait : mesuré comme tel, ou coché à la main. */
  fait: boolean
  /**
   * Réussite du sous-test au moment où l'on regarde le plan. La raison d'une
   * tâche est écrite le lundi et ne bouge plus ; sans ce chiffre à côté, le
   * plan affichait « 33 % » pour une logique remontée depuis à 76 %.
   */
  tauxActuel: number | null
}

export interface PlanHebdomadaire {
  semaineDu: string
  budgetMinutes: number
  minutesPlanifiees: number
  /** Minutes des tâches faites, au prorata de ce qui est mesuré. */
  minutesFaites: number
  /**
   * Temps réellement passé cette semaine : durée des séances et des épreuves
   * (plafonnée par question) et temps chronométré sur les leçons.
   */
  minutesMesurees: number
  taches: TacheEnregistree[]
  notes: string[]
  /** Vrai si le plan vient d'être composé à cet appel. */
  nouveau: boolean
}

/* ------------------------------------------------- étude des leçons -- */

export interface EtatLecon {
  etudieeLe: string | null
  revueLe: string | null
  minutes: number
}

export function etudeDesLecons(): Map<string, EtatLecon> {
  const lignes = db()
    .prepare(`SELECT skill_id, etudiee_le, revue_le, minutes FROM lecon_etude`)
    .all() as Array<{ skill_id: string; etudiee_le: string | null; revue_le: string | null; minutes: number }>

  return new Map(
    lignes.map((l) => [
      l.skill_id,
      { etudieeLe: l.etudiee_le, revueLe: l.revue_le, minutes: l.minutes },
    ]),
  )
}

/**
 * Enregistre une session d'étude sur une leçon.
 *
 * Les minutes s'accumulent : relire ajoute au compteur. `etudiee_le` ne se
 * fixe qu'à la première fois — c'est elle qui fait sortir la leçon de la file
 * « jamais vue », et la réécrire ferait croire à une découverte permanente.
 */
export function marquerLeconEtudiee(skillId: string, minutes = 0): void {
  const d = db()
  // Le journal daté permet de savoir ce qui a été étudié CETTE semaine
  // (migration 017) ; `lecon_etude` ne garde que le cumul.
  d.prepare(`INSERT INTO lecon_session (skill_id, minutes) VALUES (?, ?)`).run(
    skillId,
    Math.max(0, minutes),
  )
  d
    .prepare(
      `INSERT INTO lecon_etude (skill_id, etudiee_le, revue_le, minutes)
       VALUES (?, datetime('now'), datetime('now'), ?)
       ON CONFLICT (skill_id) DO UPDATE SET
         etudiee_le = COALESCE(lecon_etude.etudiee_le, datetime('now')),
         revue_le   = datetime('now'),
         minutes    = lecon_etude.minutes + excluded.minutes,
         maj_le     = datetime('now')`,
    )
    .run(skillId, Math.max(0, Math.round(minutes)))
}

export function oublierLecon(skillId: string): void {
  const d = db()
  d.transaction(() => {
    d.prepare(`DELETE FROM lecon_etude WHERE skill_id = ?`).run(skillId)
    d.prepare(`DELETE FROM lecon_session WHERE skill_id = ?`).run(skillId)
  })()
}

/** Une série ne compte comme faite qu'à partir de ce nombre de réponses. */
export const SERIE_MINIMALE = 10

/**
 * Ce qui a été fait pendant une semaine, lu dans la base.
 *
 * Le plan comptait comme fait ce qu'on avait coché, alors que tout ce qu'il
 * prescrit laisse une trace : une série close, une leçon marquée étudiée, une
 * épreuve terminée. On lit ces traces ; la case reste pour ce qui n'en laisse
 * pas.
 */
function traceesDeLaSemaine(semaineDu: string) {
  const d = db()
  const dansLaSemaine = (col: string) =>
    `date(${col}, 'localtime') >= date(?) AND date(${col}, 'localtime') < date(?, '+7 days')`

  const series = new Map(
    (
      d
        .prepare(
          `SELECT json_extract(s.sections, '$[0]') AS section, COUNT(*) AS n
             FROM exam_session s
            WHERE s.exam_id = 'tagemage' AND s.type = 'drill' AND s.fin IS NOT NULL
              AND ${dansLaSemaine('s.fin')}
              AND (SELECT COUNT(*) FROM attempt a WHERE a.session_id = s.id) >= ?
            GROUP BY section`,
        )
        .all(semaineDu, semaineDu, SERIE_MINIMALE) as Array<{ section: string; n: number }>
    ).map((r) => [r.section, r.n]),
  )

  const epreuves = new Map(
    (
      d
        .prepare(
          `SELECT type, COUNT(*) AS n FROM exam_session
            WHERE exam_id = 'tagemage' AND type IN ('diagnostic', 'blanc') AND fin IS NOT NULL
              AND ${dansLaSemaine('fin')}
            GROUP BY type`,
        )
        .all(semaineDu, semaineDu) as Array<{ type: string; n: number }>
    ).map((r) => [r.type, r.n]),
  )

  const lecons = d
    .prepare(
      `SELECT skill_id, SUM(minutes) AS minutes FROM lecon_session
        WHERE ${dansLaSemaine('le')} GROUP BY skill_id`,
    )
    .all(semaineDu, semaineDu) as Array<{ skill_id: string; minutes: number }>

  return {
    series,
    epreuves,
    leconsEtudiees: new Set(lecons.map((l) => l.skill_id)),
    minutesLecons: lecons.reduce((a, l) => a + l.minutes, 0),
  }
}

/* ------------------------------------------------ composition du plan -- */

function parametres(semaineDu: string) {
  const d = db()
  reconstruireSkillState('tagemage')

  const etude = etudeDesLecons()
  const mesures = mesuresParSkill('tagemage')

  // Le rang dans le parcours conseillé : c'est lui qui ordonne les leçons
  // jamais vues, plutôt que l'ordre de l'épreuve.
  const rang = new Map<string, number>()
  PARCOURS.forEach((etape, i) =>
    etape.skillIds.forEach((s, j) => rang.set(s, i * 100 + j)),
  )

  const lecons: LeconAPlanifier[] = LECONS.map((l) => {
    const m = mesures.get(l.skillId)
    return {
      skillId: l.skillId,
      section: l.section,
      titre: l.titre,
      jamaisEtudiee: !etude.get(l.skillId)?.etudieeLe,
      taux: m && m.n >= 5 ? m.justes / m.n : null,
      rangParcours: rang.get(l.skillId) ?? 999,
    }
  })

  const parSection = d
    .prepare(
      `SELECT i.section,
              COUNT(DISTINCT i.id) AS questions,
              -- Sauts compris et toutes réponses comptées, comme partout.
              (SELECT AVG(r.est_correct)
                 FROM attempt r JOIN item j ON j.id = r.item_id
                WHERE j.exam_id = 'tagemage' AND j.section = i.section) AS taux
         FROM item i
         LEFT JOIN attempt a ON a.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND i.statut = 'valide'
        GROUP BY i.section`,
    )
    .all() as Array<{ section: string; questions: number; taux: number | null }>

  const dus = d
    .prepare(
      `SELECT k.id, k.section FROM skill_state s
         JOIN skill k ON k.id = s.skill_id
        WHERE k.exam_id = 'tagemage'
          AND s.prochaine_revision IS NOT NULL AND s.prochaine_revision <= ?`,
    )
    .all(aujourdhuiIso()) as Array<{ id: string; section: string }>

  const etat = new Map(parSection.map((s) => [s.section, s]))
  const sections: BesoinSection[] = SECTIONS.map((s) => ({
    section: s.id,
    libelle: s.libelle,
    taux: etat.get(s.id)?.taux ?? null,
    skillIdsDus: dus.filter((x) => x.section === s.id).map((x) => x.id),
    questionsEnBanque: etat.get(s.id)?.questions ?? 0,
  }))

  const objectif = d
    .prepare(`SELECT date_examen FROM exam_goal WHERE exam_id = 'tagemage'`)
    .get() as { date_examen: string | null } | undefined

  const joursRestants = objectif?.date_examen
    ? Math.round(
        (new Date(`${objectif.date_examen}T00:00:00`).getTime() -
          new Date(new Date().toDateString()).getTime()) /
          86_400_000,
      )
    : null

  const epreuves = d
    .prepare(
      `SELECT COUNT(*) AS n, MAX(debut) AS derniere
         FROM exam_session
        WHERE exam_id = 'tagemage' AND type IN ('blanc', 'diagnostic') AND fin IS NOT NULL`,
    )
    .get() as { n: number; derniere: string | null }

  const dernierBlanc = d
    .prepare(
      `SELECT MAX(debut) AS d FROM exam_session
        WHERE exam_id = 'tagemage' AND type = 'blanc' AND fin IS NOT NULL`,
    )
    .get() as { d: string | null }

  // SQLite écrit « AAAA-MM-JJ HH:MM:SS » en UTC, sans le dire : lu tel quel,
  // `new Date` y voit une heure locale et décale de deux heures.
  const semainesDepuisDernierBlanc = dernierBlanc.d
    ? (Date.now() - new Date(`${dernierBlanc.d.replace(' ', 'T')}Z`).getTime()) / (7 * 86_400_000)
    : null

  const totalBanque = parSection.reduce((a, s) => a + s.questions, 0)

  return {
    semaineDu,
    budgetMinutes: Math.round((profil().heuresDispoSemaine ?? 0) * 60),
    joursRestants,
    lecons,
    sections,
    semainesDepuisDernierBlanc,
    aDejaPasseUneEpreuve: epreuves.n > 0,
    // Un blanc demande 90 questions réparties sur les six sous-tests.
    banqueSuffisantePourBlanc: totalBanque >= 90 && sections.every((s) => s.questionsEnBanque >= 15),
  }
}

function ecrire(plan: SemaineComposee): void {
  const d = db()

  const tout = d.transaction(() => {
    d.prepare(
      `INSERT INTO study_plan (semaine_du, volume_prevu_min, budget_minutes, notes)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (semaine_du) DO UPDATE SET
         volume_prevu_min = excluded.volume_prevu_min,
         budget_minutes   = excluded.budget_minutes,
         notes            = excluded.notes`,
    ).run(plan.semaineDu, plan.minutesPlanifiees, plan.budgetMinutes, JSON.stringify(plan.notes))

    d.prepare(`DELETE FROM plan_tache WHERE semaine_du = ?`).run(plan.semaineDu)

    const inserer = d.prepare(
      `INSERT INTO plan_tache
         (semaine_du, ordre, type, section, skill_ids, libelle, minutes, quantite, raison)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    plan.taches.forEach((t, i) =>
      inserer.run(
        plan.semaineDu,
        i,
        t.type,
        t.section,
        JSON.stringify(t.skillIds),
        t.libelle,
        t.minutes,
        t.quantite,
        t.raison,
      ),
    )
  })

  tout()
}

function lire(semaineDu: string): PlanHebdomadaire | null {
  const d = db()

  const entete = d
    .prepare(
      `SELECT volume_prevu_min, budget_minutes, notes FROM study_plan WHERE semaine_du = ?`,
    )
    .get(semaineDu) as
    | { volume_prevu_min: number; budget_minutes: number | null; notes: string | null }
    | undefined

  if (!entete) return null

  const lignes = d
    .prepare(
      `SELECT id, type, section, skill_ids, libelle, minutes, quantite, raison, fait_le
         FROM plan_tache WHERE semaine_du = ? ORDER BY ordre`,
    )
    .all(semaineDu) as Array<Record<string, unknown>>

  const tauxParSection = new Map(etatSectionsTageMage().map((s) => [s.id as string, s.tauxReussite]))
  const traces = traceesDeLaSemaine(semaineDu)

  const taches: TacheEnregistree[] = lignes.map((l) => {
    const type = l.type as Tache['type']
    const section = (l.section as string) ?? null
    const skillIds = l.skill_ids ? (JSON.parse(l.skill_ids as string) as string[]) : []
    const quantite = l.quantite as number
    const faitLe = (l.fait_le as string) ?? null

    const faits =
      type === 'cours'
        ? skillIds.filter((s) => traces.leconsEtudiees.has(s)).length
        : type === 'entrainement'
          ? (traces.series.get(section ?? '') ?? 0)
          : (traces.epreuves.get(type) ?? 0)

    return {
      id: l.id as number,
      type,
      section,
      libelle: l.libelle as string,
      skillIds,
      minutes: l.minutes as number,
      quantite,
      raison: (l.raison as string) ?? '',
      faitLe,
      mesure: { faits, sur: quantite },
      fait: faitLe !== null || faits >= quantite,
      tauxActuel: section ? (tauxParSection.get(section) ?? null) : null,
    }
  })

  return {
    semaineDu,
    budgetMinutes: entete.budget_minutes ?? 0,
    minutesPlanifiees: entete.volume_prevu_min,
    // Une tâche cochée compte entière ; sinon, au prorata de ce qui est mesuré
    // (une série sur deux faite = la moitié de ses minutes).
    minutesFaites: Math.round(
      taches.reduce(
        (a, t) =>
          a + (t.faitLe ? t.minutes : t.minutes * Math.min(1, t.mesure.faits / Math.max(1, t.mesure.sur))),
        0,
      ),
    ),
    minutesMesurees: volumeRealiseMinutes(semaineDu) + Math.round(traces.minutesLecons),
    taches,
    notes: entete.notes ? (JSON.parse(entete.notes) as string[]) : [],
    nouveau: false,
  }
}

/**
 * Le plan de la semaine en cours : lu s'il existe, composé et figé sinon.
 *
 * `refaire` le recompose depuis zéro — c'est le bouton pour une semaine qui a
 * changé d'allure. Il efface l'avancement coché, et c'est voulu : un plan refait
 * n'est pas le même plan.
 */
export function planDeLaSemaine(refaire = false, aujourdhui = aujourdhuiIso()): PlanHebdomadaire {
  const semaineDu = lundiDeLaSemaine(aujourdhui)

  if (!refaire) {
    const existant = lire(semaineDu)
    if (existant) return existant
  }

  ecrire(composerSemaine(parametres(semaineDu)))
  return { ...(lire(semaineDu) as PlanHebdomadaire), nouveau: true }
}

export function marquerTache(id: number, fait: boolean): void {
  db()
    .prepare(`UPDATE plan_tache SET fait_le = ${fait ? "datetime('now')" : 'NULL'} WHERE id = ?`)
    .run(id)
}

/**
 * Les semaines passées, pour voir si le rythme tient. Même lecture que la
 * semaine en cours — mesurée, pas cochée — sans quoi l'historique et le plan
 * compteraient le « fait » de deux façons.
 */
export function historiqueSemaines(limite = 8): Array<{
  semaineDu: string
  minutesPlanifiees: number
  minutesFaites: number
  minutesMesurees: number
  taches: number
  tachesFaites: number
}> {
  const semaines = db()
    .prepare(`SELECT semaine_du AS s FROM study_plan ORDER BY semaine_du DESC LIMIT ?`)
    .all(limite) as Array<{ s: string }>

  return semaines.flatMap(({ s }) => {
    const p = lire(s)
    if (!p) return []
    return [
      {
        semaineDu: s,
        minutesPlanifiees: p.minutesPlanifiees,
        minutesFaites: p.minutesFaites,
        minutesMesurees: p.minutesMesurees,
        taches: p.taches.length,
        tachesFaites: p.taches.filter((t) => t.fait).length,
      },
    ]
  })
}

export { libelleSection }
