/**
 * Composition du plan hebdomadaire — mono-examen.
 *
 * Déterministe, sans I/O, sans LLM. L'arbitrage entre les deux examens arrive
 * au lot 7 : ici on répartit un budget déjà attribué à un seul examen.
 *
 * Principe directeur : le plan sert le score, pas la complétude. On ne cherche
 * pas à couvrir toute la taxonomie, on place d'abord ce qui est périssable
 * (les révisions dues) puis ce qui rapporte (les faiblesses).
 */

import { SECONDES_PAR_QUESTION } from '@/exams/tagemage'

export const MINUTES_PAR_SEANCE = 30
export const SEANCE_MINIMALE = 10
export const SKILLS_PAR_SEANCE = 3

/** Cadence réelle de l'examen, utilisée pour convertir minutes ↔ questions. */
export const QUESTIONS_PAR_MINUTE = 60 / SECONDES_PAR_QUESTION

/** Durées des épreuves, en minutes. */
export const MINUTES_BLANC = 120
export const MINUTES_DIAGNOSTIC = 53

/** À moins de 6 semaines de l'examen, on passe un blanc toutes les deux semaines. */
export const SEMAINES_AVANT_EXAMEN_INTENSIF = 6
export const SEMAINES_ENTRE_BLANCS = 2

/** Écart entre volume prévu et volume réalisé au-delà duquel le plan est recalibré. */
export const ECART_TOLERE = 0.3

export type TypeSeance = 'revision' | 'renforcement' | 'blanc' | 'diagnostic'

export interface EntreeCompetence {
  skillId: string
  libelle: string
  section: string
  sectionLibelle: string
  n: number
  tauxReussite: number
  joursDeRetard: number | null
  jamaisVue: boolean
}

export interface Seance {
  type: TypeSeance
  section: string | null
  libelle: string
  /** Libellés lisibles, pour l'affichage. */
  skills: string[]
  /** Identifiants, pour cibler réellement le drill. */
  skillIds: string[]
  minutes: number
  questions: number
  raison: string
}

export interface PlanSemaine {
  seances: Seance[]
  minutesPlanifiees: number
  budgetMinutes: number
  notes: string[]
}

export interface ParametresPlan {
  budgetMinutes: number
  dues: EntreeCompetence[]
  faibles: EntreeCompetence[]
  joursRestants: number | null
  semainesDepuisDernierBlanc: number | null
  banqueSuffisantePourBlanc: boolean
  aDejaPasseUneEpreuve: boolean
  /**
   * L'examen dispose-t-il d'un module d'épreuve ? Faux pour le TOEIC tant que
   * le Listening n'est pas construit : proposer une épreuve qu'on ne peut pas
   * passer enverrait l'utilisateur vers l'épreuve de l'autre examen.
   */
  epreuvesDisponibles: boolean
}

const questionsPour = (minutes: number) => Math.max(1, Math.round(minutes * QUESTIONS_PAR_MINUTE))

/**
 * Regroupe des compétences en séances d'un seul sous-test.
 *
 * Une séance ne mélange pas les sous-tests : changer de registre toutes les
 * cinq questions n'entraîne pas au format de l'épreuve, où l'on reste vingt
 * minutes dans le même.
 */
function grouperEnSeances(
  entrees: EntreeCompetence[],
  type: TypeSeance,
  minutesDisponibles: number,
  raison: (e: EntreeCompetence[]) => string,
): Seance[] {
  const parSection = new Map<string, EntreeCompetence[]>()
  for (const e of entrees) {
    if (!parSection.has(e.section)) parSection.set(e.section, [])
    parSection.get(e.section)!.push(e)
  }

  const seances: Seance[] = []
  let restant = minutesDisponibles

  for (const [section, liste] of parSection) {
    for (let i = 0; i < liste.length; i += SKILLS_PAR_SEANCE) {
      if (restant < SEANCE_MINIMALE) return seances

      const lot = liste.slice(i, i + SKILLS_PAR_SEANCE)
      const minutes = Math.min(MINUTES_PAR_SEANCE, restant)
      restant -= minutes

      seances.push({
        type,
        section,
        libelle: lot[0].sectionLibelle,
        skills: lot.map((e) => e.libelle),
        skillIds: lot.map((e) => e.skillId),
        minutes,
        questions: questionsPour(minutes),
        raison: raison(lot),
      })
    }
  }

  return seances
}

/**
 * Justifie une séance de révision. Trois situations à ne pas confondre :
 * jamais travaillée, travaillée mais pas encore assez pour être planifiée, et
 * réellement en retard sur son échéance.
 */
export function raisonRevision(lot: EntreeCompetence[]): string {
  if (lot.some((e) => e.jamaisVue)) return 'Jamais travaillée'

  if (lot.every((e) => e.joursDeRetard === null)) {
    return 'Pas encore assez de tentatives pour être placée au calendrier'
  }

  const retard = Math.max(...lot.map((e) => e.joursDeRetard ?? 0))
  if (retard <= 0) return 'À réviser aujourd’hui'
  return `En retard de ${retard} jour${retard > 1 ? 's' : ''}`
}

export function composerSemaine(p: ParametresPlan): PlanSemaine {
  const seances: Seance[] = []
  const notes: string[] = []
  let restant = p.budgetMinutes

  /* ------------------------------------------------------- épreuves -- */

  const semainesRestantes = p.joursRestants === null ? null : p.joursRestants / 7

  if (p.epreuvesDisponibles && !p.aDejaPasseUneEpreuve) {
    const minutes = Math.min(MINUTES_DIAGNOSTIC, restant)
    if (minutes >= SEANCE_MINIMALE) {
      seances.push({
        type: 'diagnostic',
        section: null,
        libelle: 'Diagnostic',
        skills: [],
        skillIds: [],
        minutes,
        questions: 40,
        raison: 'Aucune épreuve passée : rien à mesurer tant que celle-ci n’est pas faite.',
      })
      restant -= minutes
    }
  } else if (
    p.epreuvesDisponibles &&
    p.banqueSuffisantePourBlanc &&
    semainesRestantes !== null &&
    semainesRestantes <= SEMAINES_AVANT_EXAMEN_INTENSIF &&
    (p.semainesDepuisDernierBlanc === null || p.semainesDepuisDernierBlanc >= SEMAINES_ENTRE_BLANCS)
  ) {
    const minutes = Math.min(MINUTES_BLANC, restant)
    if (minutes >= SEANCE_MINIMALE) {
      seances.push({
        type: 'blanc',
        section: null,
        libelle: 'Blanc complet',
        skills: [],
        skillIds: [],
        minutes,
        questions: 90,
        raison: `Examen dans ${Math.round(semainesRestantes)} semaine${semainesRestantes >= 2 ? 's' : ''} : c’est l’endurance qu’il faut entraîner maintenant, pas les notions.`,
      })
      restant -= minutes
    }
  }

  if (p.epreuvesDisponibles && !p.banqueSuffisantePourBlanc && p.aDejaPasseUneEpreuve) {
    notes.push(
      'La banque ne contient pas de quoi composer un blanc complet : importe des questions pour pouvoir en passer un.',
    )
  }

  /* ------------------------------------------- révisions dues, d'abord -- */

  const seancesRevision = grouperEnSeances(p.dues, 'revision', restant, raisonRevision)
  seances.push(...seancesRevision)
  restant -= seancesRevision.reduce((acc, s) => acc + s.minutes, 0)

  /* ------------------------------------- renforcement des faiblesses -- */

  // On écarte ce qui est déjà couvert par une séance de révision.
  const dejaPlacees = new Set(p.dues.map((e) => e.skillId))
  const faibles = p.faibles.filter((e) => !dejaPlacees.has(e.skillId))

  const seancesRenfort = grouperEnSeances(
    faibles,
    'renforcement',
    restant,
    (lot) => `${Math.round(Math.min(...lot.map((e) => e.tauxReussite)) * 100)} % de réussite`,
  )
  seances.push(...seancesRenfort)
  restant -= seancesRenfort.reduce((acc, s) => acc + s.minutes, 0)

  /* ------------------------------------------------------------ notes -- */

  const minutesPlanifiees = seances.reduce((acc, s) => acc + s.minutes, 0)

  if (seances.length === 0) {
    notes.push(
      p.budgetMinutes < SEANCE_MINIMALE
        ? 'Budget hebdomadaire trop court pour composer une séance.'
        : 'Rien à programmer : aucune compétence due, aucune faiblesse mesurée. Lance une série pour alimenter le plan.',
    )
  } else if (restant >= MINUTES_PAR_SEANCE) {
    notes.push(
      `${Math.round(restant)} minutes non attribuées : tout ce qui est mesuré est déjà couvert. Élargis la banque plutôt que de repasser les mêmes questions.`,
    )
  }

  if (p.joursRestants !== null && p.joursRestants <= 21) {
    notes.push(
      `Examen dans ${p.joursRestants} jours : à ce stade, les points viennent de la stratégie et du rythme, pas de notions nouvelles.`,
    )
  }

  return { seances, minutesPlanifiees, budgetMinutes: p.budgetMinutes, notes }
}

/* --------------------------------------------- recalibrage du budget -- */

export type VerdictBudget = 'tenu' | 'reduit' | 'augmente' | 'premiere_semaine'

export interface AjustementBudget {
  budgetMinutes: number
  verdict: VerdictBudget
  message: string
}

/**
 * Recalibre le budget sur le volume réellement effectué.
 *
 * Un plan non tenu est un plan mal calibré, pas un manque de discipline : on
 * réduit au lieu d'accumuler du retard. Symétriquement, si le volume réel
 * dépasse durablement le budget, on le relève.
 */
export function ajusterBudget(
  budgetDeclareMinutes: number,
  realiseMinutes: number | null,
): AjustementBudget {
  if (realiseMinutes === null) {
    return {
      budgetMinutes: budgetDeclareMinutes,
      verdict: 'premiere_semaine',
      message: 'Première semaine : le plan s’appuie sur ton volume déclaré, faute de mesure.',
    }
  }

  const ecart = (realiseMinutes - budgetDeclareMinutes) / Math.max(1, budgetDeclareMinutes)

  if (ecart < -ECART_TOLERE) {
    const ajuste = Math.max(SEANCE_MINIMALE, Math.round(realiseMinutes * 1.1))
    return {
      budgetMinutes: ajuste,
      verdict: 'reduit',
      message: `Tu as fait ${Math.round(realiseMinutes)} min sur ${Math.round(budgetDeclareMinutes)} prévues. Le plan passe à ${ajuste} min : un plan non tenu est un plan mal calibré, pas un manque de discipline.`,
    }
  }

  if (ecart > ECART_TOLERE) {
    const ajuste = Math.round(realiseMinutes)
    return {
      budgetMinutes: ajuste,
      verdict: 'augmente',
      message: `Tu as fait ${Math.round(realiseMinutes)} min sur ${Math.round(budgetDeclareMinutes)} prévues. Le plan monte à ${ajuste} min.`,
    }
  }

  return {
    budgetMinutes: budgetDeclareMinutes,
    verdict: 'tenu',
    message: `Volume tenu : ${Math.round(realiseMinutes)} min sur ${Math.round(budgetDeclareMinutes)} prévues.`,
  }
}

/** Lundi de la semaine contenant `iso`, en ISO. */
export function lundiDeLaSemaine(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const jour = (d.getUTCDay() + 6) % 7 // lundi = 0
  d.setUTCDate(d.getUTCDate() - jour)
  return d.toISOString().slice(0, 10)
}
