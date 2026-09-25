/**
 * Statistiques et stratégie de score — calculs purs.
 *
 * Aucune dépendance à la base : tout est testable sans I/O. C'est ici que vit
 * la logique du principe P4 — le LLM interprète, il ne compte pas. Ces
 * fonctions sont la seule source des chiffres affichés à l'utilisateur.
 */

import { BAREME, HASARD, coutDesBlanches, esperancePoints } from '@/core/scoring/tagemage'

/** En dessous de ce nombre de tentatives, une mesure n'est pas fiable (§9.2). */
export const SEUIL_FIABILITE = 30

/** Nombre minimal de tentatives avant d'afficher le taux d'une sous-compétence. */
export const SEUIL_SOUS_COMPETENCE = 5

/**
 * Nombre minimal de tentatives avant de conseiller d'EXPÉDIER un type de
 * question. Conseiller de renoncer à travailler un type est une consigne
 * lourde : sur 6 tentatives, « vocabulaire en contexte » passait pour un puits
 * de temps alors qu'une seule réponse de plus changeait le taux de 16 points.
 * À 20 tentatives, l'écart-type d'un taux de 50 % tombe à 11 points.
 */
export const SEUIL_PUITS = 20

/** Une sous-compétence est un « puits de temps » au-delà de ce ratio au temps médian. */
export const RATIO_PUITS = 1.3

/** …et en dessous de ce taux de réussite. */
export const REUSSITE_PUITS = 0.5

export type Niveau = 1 | 2 | 3 | 4

export const LIBELLE_NIVEAU: Record<Niveau, string> = {
  1: 'Au hasard',
  2: 'Hésitant',
  3: 'Assez sûr',
  4: 'Certain',
}

/**
 * Taux de réussite qu'un niveau de confiance est censé refléter.
 *
 * Ce sont des repères conventionnels, pas des mesures : ils servent uniquement
 * à qualifier un écart en surconfiance ou en sous-confiance. Le niveau 1
 * correspond au pur hasard entre cinq propositions.
 */
export const REUSSITE_ATTENDUE: Record<Niveau, number> = {
  1: 0.2,
  2: 0.45,
  3: 0.7,
  4: 0.92,
}

/* -------------------------------------------------------- calibration -- */

/**
 * Ce qu'il faut faire à un niveau de confiance donné.
 *
 * Le verdict ne porte plus sur « répondre ou non » : sans pénalité, répondre
 * est toujours gagnant, et s'abstenir toujours perdant. Il porte désormais sur
 * le TEMPS. À un niveau où l'on ne fait pas mieux que le hasard, la bonne
 * conduite est de cocher immédiatement et de passer — ces quatre-vingts
 * secondes rapporteraient davantage sur une autre question.
 */
export type Verdict = 'repondre' | 'cocher_et_passer' | 'donnees_insuffisantes'

export interface NiveauCalibration {
  niveau: Niveau
  n: number
  justes: number
  tauxReussite: number
  /** Espérance de points en répondant à ce niveau, sur les données réelles. */
  esperance: number
  verdict: Verdict
  /** false tant que n < SEUIL_FIABILITE : le verdict reste indicatif. */
  fiable: boolean
  ecartAttendu: number
}

export function calibrer(brut: Array<{ niveau: Niveau; n: number; justes: number }>): NiveauCalibration[] {
  const parNiveau = new Map(brut.map((b) => [b.niveau, b]))

  return ([1, 2, 3, 4] as Niveau[]).map((niveau) => {
    const b = parNiveau.get(niveau)
    const n = b?.n ?? 0
    const justes = b?.justes ?? 0
    const taux = n === 0 ? 0 : justes / n

    return {
      niveau,
      n,
      justes,
      tauxReussite: taux,
      esperance: n === 0 ? 0 : esperancePoints(taux),
      // Au niveau du hasard pur, le temps investi ne rapporte rien de plus
      // qu'une croix posée au jugé : ce qu'on récupère, c'est le temps.
      verdict:
        n === 0 ? 'donnees_insuffisantes' : taux > HASARD ? 'repondre' : 'cocher_et_passer',
      fiable: n >= SEUIL_FIABILITE,
      ecartAttendu: n === 0 ? 0 : taux - REUSSITE_ATTENDUE[niveau],
    }
  })
}

export type DiagnosticCalibration =
  | 'surconfiance'
  | 'sousconfiance'
  | 'correcte'
  | 'donnees_insuffisantes'

/** Au-delà de cet écart moyen, la calibration est jugée déséquilibrée. */
export const TOLERANCE_CALIBRATION = 0.1

function ecartPondere(niveaux: NiveauCalibration[]): { ecart: number; n: number } {
  const n = niveaux.reduce((acc, c) => acc + c.n, 0)
  if (n === 0) return { ecart: 0, n: 0 }
  return { ecart: niveaux.reduce((acc, c) => acc + c.ecartAttendu * c.n, 0) / n, n }
}

/**
 * Diagnostic de calibration.
 *
 * Volontairement PAS une moyenne sur les quatre niveaux : le coût est
 * asymétrique. Se tromper en étant certain fait PERDRE DU TEMPS sur des
 * questions qu’il fallait expédier, et le temps est la seule ressource rare. Une moyenne globale laisse
 * un bas de gamme bien calibré masquer un haut de gamme catastrophique — cas
 * observé en conditions réelles, couvert par un test de non-régression.
 *
 * On regarde donc séparément le haut (niveaux 3-4) et le bas (niveaux 1-2),
 * et le haut prime.
 */
export function diagnostiquerCalibration(niveaux: NiveauCalibration[]): {
  diagnostic: DiagnosticCalibration
  ecartMoyen: number
  ecartHaut: number
  ecartBas: number
  n: number
} {
  const avecDonnees = niveaux.filter((c) => c.n > 0)
  const global = ecartPondere(avecDonnees)
  const haut = ecartPondere(avecDonnees.filter((c) => c.niveau >= 3))
  const bas = ecartPondere(avecDonnees.filter((c) => c.niveau <= 2))

  const base = {
    ecartMoyen: global.ecart,
    ecartHaut: haut.ecart,
    ecartBas: bas.ecart,
    n: global.n,
  }

  const hautExploitable = haut.n >= SEUIL_FIABILITE
  const basExploitable = bas.n >= SEUIL_FIABILITE

  if (!hautExploitable && !basExploitable) {
    return { ...base, diagnostic: 'donnees_insuffisantes' }
  }

  if (hautExploitable && haut.ecart < -TOLERANCE_CALIBRATION) {
    return { ...base, diagnostic: 'surconfiance' }
  }

  if (basExploitable && bas.ecart > TOLERANCE_CALIBRATION) {
    return { ...base, diagnostic: 'sousconfiance' }
  }

  return { ...base, diagnostic: 'correcte' }
}

/* --------------------------------------------- règle du remplissage -- */

export interface RegleRemplissage {
  /** Questions laissées vides — sauts délibérés et questions non atteintes. */
  blanches: number
  total: number
  tauxBlanches: number
  /** Points bruts jetés : 0,8 en moyenne par case vide. */
  coutEstime: number
}

/**
 * Mesure la seule règle qui subsiste : ne jamais rendre une case vide.
 *
 * L'ancienne règle — « rien éliminé, on saute » — était fondée sur la
 * pénalité. Elle est morte avec elle, et son contraire l'a remplacée : une
 * mauvaise réponse et un blanc valent 0 tous les deux, mais la mauvaise
 * réponse avait une chance sur cinq d'être bonne. Chaque case vide est donc
 * une espérance qu'on jette, et c'est ce gaspillage-là qu'on chiffre.
 */
export function evaluerRegleRemplissage(blanches: number, total: number): RegleRemplissage {
  return {
    blanches,
    total,
    tauxBlanches: total === 0 ? 0 : blanches / total,
    coutEstime: coutDesBlanches(blanches),
  }
}

/* ------------------------------------------------------------ médiane -- */

export function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null
  const tri = [...valeurs].sort((a, b) => a - b)
  const milieu = Math.floor(tri.length / 2)
  return tri.length % 2 === 1 ? tri[milieu] : (tri[milieu - 1] + tri[milieu]) / 2
}

/* ---------------------------------------------------- puits de temps -- */

export interface LigneCompetence {
  skillId: string
  libelle: string
  section: string
  n: number
  justes: number
  tempsMedianMs: number
}

export interface CompetenceQualifiee extends LigneCompetence {
  tauxReussite: number
  ratioTemps: number
  estPuits: boolean
}

/**
 * Un puits de temps est une sous-compétence à la fois lente et peu réussie.
 * Ce ne sont pas des compétences à travailler : ce sont des questions à expédier —
 * on coche et on passe, puisque s’attarder n’y rapporte rien.
 *
 * « Lente » se juge par rapport au SOUS-TEST, pas à l'ensemble des questions :
 * une question de logique ou de compréhension est longue par nature, et la
 * comparer à la médiane globale (tirée vers le bas par l'expression et les
 * conditions minimales) la désignait comme puits pour la seule raison qu'elle
 * appartient à son sous-test. On passe donc une médiane par sous-test ; un
 * nombre seul reste accepté comme référence commune.
 */
export function qualifierCompetences(
  lignes: LigneCompetence[],
  reference: number | null | Map<string, number>,
): CompetenceQualifiee[] {
  return lignes.map((l) => {
    const taux = l.n === 0 ? 0 : l.justes / l.n
    const mediane = reference instanceof Map ? (reference.get(l.section) ?? null) : reference
    const ratio = mediane && mediane > 0 ? l.tempsMedianMs / mediane : 1

    return {
      ...l,
      tauxReussite: taux,
      ratioTemps: ratio,
      estPuits: l.n >= SEUIL_PUITS && taux < REUSSITE_PUITS && ratio > RATIO_PUITS,
    }
  })
}

/* ------------------------------------------------------------ leviers -- */

export interface LigneSection {
  section: string
  n: number
  justes: number
  fausses: number
  blanches: number
  points: number
  tempsMs: number
}

export interface Levier extends LigneSection {
  tauxReussite: number
  /**
   * Points perdus sur un sous-test de 15 questions, au rythme observé :
   * (1 − points / points possibles) × 60.
   */
  pointsPerdus: number
  partDesPertes: number
}

/** Un sous-test réel compte 15 questions, soit 60 points bruts possibles. */
export const QUESTIONS_PAR_SOUS_TEST = 15

/**
 * Classe les sous-tests par points laissés sur la table, ramenés à un
 * sous-test de 15 questions.
 *
 * Le total brut (n × 4 − points) classait d'abord ce qu'on avait le plus
 * pratiqué : le calcul, avec 378 questions à 79 %, perdait « 316 points »
 * et passait devant l'expression, 81 questions à 47 %. Ramené à 15
 * questions, c'est l'inverse, et c'est ce qui compte le jour de l'épreuve,
 * où chaque sous-test pèse exactement autant.
 *
 * C'est une mesure, pas une prédiction. Le rendement marginal réel — combien
 * rapporterait la prochaine heure — demande l'historique de progression du
 * planificateur (lot 7) et n'est volontairement pas estimé ici.
 */
export function classerLeviers(lignes: LigneSection[]): Levier[] {
  const max = QUESTIONS_PAR_SOUS_TEST * BAREME.juste
  const enrichies = lignes.map((l) => ({
    ...l,
    tauxReussite: l.n === 0 ? 0 : l.justes / l.n,
    pointsPerdus:
      l.n === 0 ? 0 : Math.round(Math.max(0, max * (1 - l.points / (l.n * BAREME.juste))) * 10) / 10,
    partDesPertes: 0,
  }))

  const total = enrichies.reduce((acc, l) => acc + l.pointsPerdus, 0)
  for (const l of enrichies) l.partDesPertes = total === 0 ? 0 : l.pointsPerdus / total

  return enrichies.sort((a, b) => b.pointsPerdus - a.pointsPerdus)
}

/* ------------------------------------------- blanches recommandées -- */

/**
 * Combien de questions expédier par sous-test, sur quinze.
 *
 * Remplace l'ancien « combien en laisser blanches », qui n'a plus de sens :
 * une case vide ne protège plus de rien, elle jette 0,8 point d'espérance.
 * La question devient donc une question de temps — sur combien de questions
 * faut-il renoncer à chercher, cocher au jugé, et récupérer les secondes ?
 *
 * On ne calcule pas un idéal : on lit la part des tentatives déjà faites à un
 * niveau de confiance où le taux observé ne dépasse pas le hasard.
 */
export function questionsAExpedier(
  repartition: Array<{ niveau: Niveau; n: number }>,
  calibration: NiveauCalibration[],
  questionsParSousTest = 15,
): { expediees: number; n: number; fiable: boolean } {
  const steriles = new Set(
    calibration.filter((c) => c.n > 0 && c.verdict === 'cocher_et_passer').map((c) => c.niveau),
  )

  const n = repartition.reduce((acc, r) => acc + r.n, 0)
  if (n === 0) return { expediees: 0, n: 0, fiable: false }

  const nSteriles = repartition.filter((r) => steriles.has(r.niveau)).reduce((acc, r) => acc + r.n, 0)

  return {
    expediees: Math.round((nSteriles / n) * questionsParSousTest),
    n,
    fiable: n >= SEUIL_FIABILITE,
  }
}
