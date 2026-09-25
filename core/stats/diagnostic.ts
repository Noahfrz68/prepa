/**
 * Estimation de score, écart à la cible et courbe de fatigue — calculs purs.
 *
 * Tout ce qui est ici est de l'arithmétique sur des tentatives observées.
 * Aucune prédiction : voir `ecartACible`, qui inverse délibérément la question
 * « où serai-je dans trois mois ? » en « que me manque-t-il, concrètement ? ».
 */

import { BAREME, ECHELLE_MAX, NB_QUESTIONS, bruteToScaled } from '@/core/scoring/tagemage'

/* ------------------------------------------------- intervalle de Wilson -- */

/** 1,96 ≈ niveau de confiance à 95 %. */
export const Z_95 = 1.96

/**
 * Intervalle de Wilson sur une proportion.
 *
 * Préféré à l'intervalle normal parce qu'il reste correct sur de petits
 * échantillons et aux proportions extrêmes — exactement le régime d'un
 * diagnostic de 40 questions.
 */
export function intervalleWilson(succes: number, n: number, z = Z_95): { bas: number; haut: number } {
  if (n === 0) return { bas: 0, haut: 1 }

  const p = succes / n
  const z2 = z * z
  const denominateur = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const demiLargeur = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)

  return {
    bas: Math.max(0, (centre - demiLargeur) / denominateur),
    haut: Math.min(1, (centre + demiLargeur) / denominateur),
  }
}

/* ------------------------------------------------------ estimation de score -- */

export interface EchantillonEpreuve {
  nItems: number
  justes: number
  fausses: number
  blanches: number
}

export interface ScoreEstime {
  score: number
  bas: number
  haut: number
  tauxReponse: number
  tauxReussiteRepondues: number
  nRepondues: number
  /** false quand l'échantillon est trop mince pour que l'intervalle veuille dire quelque chose. */
  fiable: boolean
}

/** En dessous, l'intervalle est si large qu'annoncer un score serait trompeur. */
export const MINIMUM_ESTIMATION = 30

/**
 * Points bruts moyens par question, pour un taux de réponse et un taux de
 * réussite donnés. C'est la seule formule de conversion : le reste en découle.
 */
export function pointsParQuestion(tauxReponse: number, p: number): number {
  return tauxReponse * (p * BAREME.juste + (1 - p) * BAREME.faux)
}

/**
 * Extrapole un score sur 600 à partir d'un échantillon, avec son intervalle.
 *
 * Le taux de réponse est traité comme un choix stratégique stable, et seule la
 * réussite sur les questions répondues porte l'incertitude.
 */
export function estimerScore(e: EchantillonEpreuve): ScoreEstime {
  const nRepondues = e.justes + e.fausses
  const tauxReponse = e.nItems === 0 ? 0 : nRepondues / e.nItems
  const p = nRepondues === 0 ? 0 : e.justes / nRepondues
  const { bas, haut } = intervalleWilson(e.justes, nRepondues)

  const versEchelle = (proba: number) =>
    bruteToScaled(NB_QUESTIONS * pointsParQuestion(tauxReponse, proba))

  return {
    score: versEchelle(p),
    bas: versEchelle(bas),
    haut: versEchelle(haut),
    tauxReponse,
    tauxReussiteRepondues: p,
    nRepondues,
    fiable: e.nItems >= MINIMUM_ESTIMATION,
  }
}

/**
 * Extrapole un score sur 600 sous-test par sous-test.
 *
 * `estimerScore` traite l'épreuve comme un seul sac de questions : un
 * sous-test qui en compte davantage pèse davantage. Or à l'épreuve réelle les
 * six sous-tests valent exactement autant (15 questions chacun). Un diagnostic
 * du 21 septembre servait 10 questions de compréhension contre 7 ailleurs :
 * sa réussite en compréhension comptait pour 22 % du score au lieu de 17 %.
 *
 * On estime donc chaque sous-test séparément et on fait la moyenne. Les
 * sous-tests vides (épreuve interrompue, banque incomplète) sont écartés et
 * les autres repondérés : l'estimation porte alors sur ce qui a été mesuré.
 *
 * L'intervalle combine les variances des sous-tests (échantillonnage
 * stratifié), puis passe par Wilson sur l'effectif équivalent — ce qui garde
 * son bon comportement sur les petits échantillons.
 */
export function estimerScoreParSousTest(sousTests: EchantillonEpreuve[]): ScoreEstime {
  const mesures = sousTests.filter((s) => s.nItems > 0)
  const total = mesures.reduce(
    (acc, s) => ({
      nItems: acc.nItems + s.nItems,
      justes: acc.justes + s.justes,
      fausses: acc.fausses + s.fausses,
      blanches: acc.blanches + s.blanches,
    }),
    { nItems: 0, justes: 0, fausses: 0, blanches: 0 },
  )
  if (mesures.length === 0) return estimerScore(total)

  const w = 1 / mesures.length
  const taux = mesures.reduce((acc, s) => acc + w * (s.justes / s.nItems), 0)
  const variance = mesures.reduce((acc, s) => {
    const p = s.justes / s.nItems
    return acc + (w * w * p * (1 - p)) / s.nItems
  }, 0)

  // Effectif pour lequel une proportion simple aurait la même variance.
  const nEquivalent = variance > 0 ? (taux * (1 - taux)) / variance : total.nItems
  const { bas, haut } = intervalleWilson(taux * nEquivalent, nEquivalent)

  const versEchelle = (proba: number) => bruteToScaled(NB_QUESTIONS * proba * BAREME.juste)
  const nRepondues = total.justes + total.fausses

  return {
    score: versEchelle(taux),
    bas: versEchelle(bas),
    haut: versEchelle(haut),
    tauxReponse: nRepondues / total.nItems,
    tauxReussiteRepondues: nRepondues === 0 ? 0 : total.justes / nRepondues,
    nRepondues,
    fiable: total.nItems >= MINIMUM_ESTIMATION,
  }
}

/* ------------------------------------------------------- écart à la cible -- */

export interface EcartCible {
  cible: number
  actuel: number
  pointsEchelleManquants: number
  pointsBrutsManquants: number
  /** En convertissant des mauvaises réponses en bonnes : +4 points bruts chacune. */
  bonnesReponsesSupplementaires: number
  parSousTest: number
  atteint: boolean
}

/**
 * Décompose l'écart à la cible en nombre de bonnes réponses à gagner.
 *
 * C'est volontairement une arithmétique, pas une projection dans le temps.
 * Estimer « où tu seras à la date de l'examen » demande une pente de
 * progression mesurée sur plusieurs semaines, que le planificateur (lot 7)
 * fournira. Inventer cette pente ici produirait un chiffre faux mais crédible.
 */
export function ecartACible(scoreActuel: number, cible: number, nSousTests = 6): EcartCible {
  const pointsEchelleManquants = Math.max(0, cible - scoreActuel)
  const pointsBrutsManquants = (pointsEchelleManquants / ECHELLE_MAX) * (NB_QUESTIONS * BAREME.juste)

  // Transformer une mauvaise réponse en bonne rapporte 4 points bruts — et non
  // 5 comme du temps de la pénalité, où l'on récupérait aussi le point perdu.
  // Il faut donc davantage de bonnes réponses qu'avant pour le même gain.
  const gainParConversion = BAREME.juste - BAREME.faux
  const bonnes = Math.ceil(pointsBrutsManquants / gainParConversion)

  return {
    cible,
    actuel: scoreActuel,
    pointsEchelleManquants: Math.round(pointsEchelleManquants),
    pointsBrutsManquants: Math.round(pointsBrutsManquants),
    bonnesReponsesSupplementaires: bonnes,
    parSousTest: Math.ceil(bonnes / nSousTests),
    atteint: pointsEchelleManquants === 0,
  }
}

/* ---------------------------------------------------------- fatigue -- */

export interface PointFatigue {
  position: number
  section: string
  libelle: string
  n: number
  justes: number
  tauxReussite: number
  tempsMoyenMs: number
  nonTraitees: number
  /**
   * Réussite habituelle dans ce sous-test, mesurée HORS de cette épreuve.
   * Null quand l'historique est trop mince pour servir de référence.
   */
  tauxHabituel?: number | null
}

export type VerdictFatigue = 'degradation' | 'stable' | 'progression' | 'donnees_insuffisantes'

/** Écart de réussite entre première et seconde moitié au-delà duquel on conclut. */
export const TOLERANCE_FATIGUE = 0.08

/** Il faut au moins ce nombre de sous-tests mesurés pour parler de deux moitiés. */
export const MINIMUM_SOUS_TESTS_FATIGUE = 4

export interface AnalyseFatigue {
  /** Les sous-tests mesurés seulement, dans l'ordre de passage. */
  points: PointFatigue[]
  premiereMoitie: number
  secondeMoitie: number
  ecart: number
  verdict: VerdictFatigue
  nonTraiteesSecondeMoitie: number
  /**
   * Vrai quand chaque sous-test est comparé à sa propre réussite habituelle.
   * Faux : comparaison brute, où la difficulté propre des sous-tests se mêle
   * à la fatigue.
   */
  relatif: boolean
}

/**
 * Compare la performance sur la première et la seconde moitié de l'épreuve,
 * dans l'ordre chronologique de passage.
 *
 * Une dégradation en fin d'épreuve n'est pas un problème de connaissances :
 * c'est un problème d'endurance, et le remède n'est pas de réviser.
 *
 * Comparer des taux bruts mêlait deux choses : l'expression et la logique,
 * placées en fin d'épreuve, sont pour beaucoup plus difficiles que le calcul
 * — une « chute » en seconde moitié pouvait n'être que le reflet de l'ordre
 * officiel. Quand chaque sous-test a une réussite habituelle mesurée ailleurs,
 * on compare donc les ÉCARTS à cette référence : une seconde moitié en
 * dessous de ses propres habitudes, là, c'est de la fatigue.
 *
 * Les sous-tests sans question (banque incomplète, épreuve écourtée) sont
 * écartés : un « 0 % » sur rien ne dit rien.
 */
export function analyserFatigue(tous: PointFatigue[]): AnalyseFatigue {
  const points = tous.filter((p) => p.n > 0)
  const relatif = points.length > 0 && points.every((p) => p.tauxHabituel != null)

  const vide = {
    points,
    premiereMoitie: 0,
    secondeMoitie: 0,
    ecart: 0,
    verdict: 'donnees_insuffisantes' as VerdictFatigue,
    nonTraiteesSecondeMoitie: 0,
    relatif,
  }

  if (points.length < MINIMUM_SOUS_TESTS_FATIGUE) return vide

  const milieu = Math.floor(points.length / 2)
  const debut = points.slice(0, milieu)
  const fin = points.slice(milieu)

  // Réussite de la moitié, ou écart moyen à la réussite habituelle —
  // pondéré par le nombre de questions dans les deux cas.
  const mesure = (groupe: PointFatigue[]) => {
    const n = groupe.reduce((acc, p) => acc + p.n, 0)
    const somme = groupe.reduce(
      (acc, p) => acc + (relatif ? p.justes - p.n * (p.tauxHabituel ?? 0) : p.justes),
      0,
    )
    return somme / n
  }

  const premiere = mesure(debut)
  const seconde = mesure(fin)
  const ecart = seconde - premiere

  return {
    points,
    relatif,
    premiereMoitie: premiere,
    secondeMoitie: seconde,
    ecart,
    verdict:
      ecart < -TOLERANCE_FATIGUE
        ? 'degradation'
        : ecart > TOLERANCE_FATIGUE
          ? 'progression'
          : 'stable',
    nonTraiteesSecondeMoitie: fin.reduce((acc, p) => acc + p.nonTraitees, 0),
  }
}

/* ----------------------------------------------------------- leviers -- */

export interface LevierDiagnostic {
  section: string
  libelle: string
  pointsRecuperables: number
  tauxReussite: number
  n: number
  raison: string
}

/**
 * Trois leviers, classés par points récupérables sur l'épreuve complète.
 *
 * « Récupérable » = ce que rapporterait le passage de cette section à 80 % de
 * réussite, hypothèse affichée à l'utilisateur et non un pronostic personnel.
 */
export const CIBLE_REUSSITE_LEVIER = 0.8

export function troisLeviers(
  sections: Array<{ section: string; libelle: string; n: number; justes: number; nonTraitees: number }>,
  questionsParSousTest = 15,
): LevierDiagnostic[] {
  return sections
    .filter((s) => s.n > 0)
    .map((s) => {
      const taux = s.justes / s.n
      const marge = Math.max(0, CIBLE_REUSSITE_LEVIER - taux)
      // Chaque question passée de fausse (ou vide) à juste vaut 4 points bruts.
      const pointsRecuperables = Math.round(
        marge * questionsParSousTest * (BAREME.juste - BAREME.faux),
      )

      return {
        section: s.section,
        libelle: s.libelle,
        pointsRecuperables,
        tauxReussite: taux,
        n: s.n,
        // Le taux d'abord, toujours : la mention des questions non traitées
        // le complète au lieu de le remplacer.
        raison:
          `${Math.round(taux * 100)} % de réussite` +
          (s.nonTraitees > 0
            ? ` · ${s.nonTraitees} question${s.nonTraitees > 1 ? 's' : ''} non traitée${s.nonTraitees > 1 ? 's' : ''} faute de temps`
            : ''),
      }
    })
    // Un levier qui ne rapporte rien n'en est pas un : un sous-test déjà à
    // 80 % ou plus n'a rien à gagner sous cette hypothèse.
    .filter((l) => l.pointsRecuperables > 0)
    .sort((a, b) => b.pointsRecuperables - a.pointsRecuperables)
    .slice(0, 3)
}
