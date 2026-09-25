/**
 * Arbitrage du budget hebdomadaire entre les deux examens.
 *
 * Déterministe, sans I/O, sans LLM.
 *
 * LE PROBLÈME QUE PERSONNE NE POSE
 * --------------------------------
 * On ne peut pas comparer « points par heure » entre le TAGE MAGE (échelle
 * 600) et le TOEIC (échelle 990) : 10 points ne valent pas la même chose des
 * deux côtés. Ce qui est comparable, c'est la **fraction de l'écart restant
 * refermée par heure investie** — une grandeur sans dimension.
 *
 * C'est elle qui pilote la répartition au prorata, et non des points bruts.
 */

export const PLANCHER_ENTRETIEN_MINUTES = 60
export const PLANCHER_URGENCE = 0.4
export const SEMAINES_URGENCE = 6

/**
 * Pentes de progression par défaut, en points d'échelle gagnés par heure.
 *
 * Ce sont des conventions, pas des mesures : elles ne servent qu'à démarrer,
 * et sont remplacées par la pente réellement observée dès qu'il y a deux
 * épreuves passées. Tant qu'elles servent, l'arbitrage est signalé comme
 * grossier.
 */
export const PENTE_DEFAUT: Record<string, number> = {
  tagemage: 2,
  toeic_lr: 4,
}

export interface EntreeExamen {
  examId: string
  libelle: string
  joursRestants: number | null
  scoreCible: number | null
  scoreEstime: number | null
  /** Pente mesurée sur l'historique, ou null si pas assez d'épreuves. */
  penteObservee: number | null
  /** Rien en banque : impossible de travailler cet examen. */
  banqueVide: boolean
  /**
   * Minutes que cet examen peut réellement absorber cette semaine, compte tenu
   * de ce qu'il y a à travailler en banque. Sans ce plafond, on attribue des
   * heures que le module ne saura pas remplir, et elles sont perdues pour
   * l'autre examen.
   */
  capaciteMinutes?: number
}

export type Contrainte = 'exclu' | 'entretien' | 'urgence' | 'prorata'

export interface Allocation {
  examId: string
  libelle: string
  minutes: number
  part: number
  /** Fraction de l'écart restant refermée par heure. Comparable entre examens. */
  progressionRelative: number
  penteUtilisee: number
  penteMesuree: boolean
  ecartACible: number | null
  contrainte: Contrainte
  raison: string
}

export interface Arbitrage {
  allocations: Allocation[]
  budgetMinutes: number
  notes: string[]
  /** true tant qu'au moins une pente est conventionnelle. */
  estimationGrossiere: boolean
}

/**
 * Fraction de l'écart restant refermée par heure investie.
 *
 * Sans score cible ou sans score estimé, on ne sait pas mesurer l'écart : on
 * renvoie une valeur neutre pour que l'examen participe au prorata sans être
 * ni favorisé ni écarté.
 */
export function progressionRelative(e: EntreeExamen, pente: number): number {
  if (e.scoreCible === null || e.scoreEstime === null) return 1

  const ecart = e.scoreCible - e.scoreEstime
  if (ecart <= 0) return 0 // cible atteinte : la prochaine heure ne referme rien

  return pente / ecart
}

export function ecartACible(e: EntreeExamen): number | null {
  if (e.scoreCible === null || e.scoreEstime === null) return null
  return Math.max(0, e.scoreCible - e.scoreEstime)
}

/** Répartit `total` proportionnellement à `poids`, en minutes entières qui somment juste. */
function repartir(poids: number[], total: number): number[] {
  const somme = poids.reduce((a, b) => a + b, 0)
  if (somme <= 0 || total <= 0) return poids.map(() => 0)

  const brut = poids.map((p) => (p / somme) * total)
  const entiers = brut.map((x) => Math.floor(x))
  let reste = total - entiers.reduce((a, b) => a + b, 0)

  // Le reliquat va aux plus fortes parties fractionnaires, dans l'ordre.
  const ordre = brut
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac)

  for (const { i } of ordre) {
    if (reste <= 0) break
    entiers[i]++
    reste--
  }

  return entiers
}

/**
 * Minutes nécessaires pour refermer l'écart au rythme retenu.
 *
 * Sans cette borne, un examen presque bouclé rafle tout le budget : refermer
 * les 10 derniers points donne une fraction d'écart par heure énorme, alors
 * que cinq heures suffisent. On ne donne à un examen que ce qu'il lui reste à
 * faire.
 */
function besoinMinutes(m: { e: EntreeExamen; pente: number }): number {
  const capacite = m.e.capaciteMinutes ?? Number.POSITIVE_INFINITY

  const ecart = ecartACible(m.e)
  if (ecart === null) return capacite
  if (ecart === 0 || m.pente <= 0) return 0

  // On ne donne ni plus que ce qu'il reste à faire, ni plus que ce que la
  // banque permet de travailler.
  return Math.min(capacite, Math.ceil((ecart / m.pente) * 60))
}

/**
 * Répartition au prorata des poids, plafonnée par le besoin de chacun.
 *
 * Remplissage par paliers : ce qu'un examen ne peut pas absorber est
 * redistribué aux autres. Si tout le monde est plafonné, le reliquat est
 * partagé également — c'est de la consolidation au-delà des cibles, pas du
 * gaspillage, et la note le dit.
 */
function repartirSousPlafond(poids: number[], plafonds: number[], total: number): number[] {
  const attribue = poids.map(() => 0)
  let restant = total

  for (let passe = 0; passe < poids.length + 1 && restant > 0; passe++) {
    const ouverts = poids
      .map((p, i) => ({ i, p }))
      .filter(({ i, p }) => p > 0 && attribue[i] < plafonds[i])

    if (ouverts.length === 0) break

    const parts = repartir(
      ouverts.map((o) => o.p),
      restant,
    )

    let consomme = 0
    for (const [k, o] of ouverts.entries()) {
      const place = Math.min(parts[k], plafonds[o.i] - attribue[o.i])
      attribue[o.i] += place
      consomme += place
    }

    if (consomme === 0) break
    restant -= consomme
  }

  // Personne ne peut plus rien absorber : le surplus va en consolidation.
  if (restant > 0) {
    const egal = repartir(poids.map(() => 1), restant)
    for (const [i, part] of egal.entries()) attribue[i] += part
  }

  return attribue
}

export function arbitrer(examens: EntreeExamen[], budgetMinutes: number): Arbitrage {
  const notes: string[] = []

  const utilisables = examens.filter((e) => !e.banqueVide)
  for (const e of examens) {
    if (e.banqueVide) {
      notes.push(`${e.libelle} : aucune question en banque, l’examen est écarté du plan.`)
    }
  }

  const exclus: Allocation[] = examens
    .filter((e) => e.banqueVide)
    .map((e) => ({
      examId: e.examId,
      libelle: e.libelle,
      minutes: 0,
      part: 0,
      progressionRelative: 0,
      penteUtilisee: 0,
      penteMesuree: false,
      ecartACible: ecartACible(e),
      contrainte: 'exclu' as const,
      raison: 'Aucune question en banque',
    }))

  if (utilisables.length === 0 || budgetMinutes <= 0) {
    return { allocations: exclus, budgetMinutes, notes, estimationGrossiere: false }
  }

  const mesures = utilisables.map((e) => {
    const penteMesuree = e.penteObservee !== null && e.penteObservee > 0
    const pente = penteMesuree ? e.penteObservee! : (PENTE_DEFAUT[e.examId] ?? 2)
    return { e, pente, penteMesuree, progression: progressionRelative(e, pente) }
  })

  const estimationGrossiere = mesures.some((m) => !m.penteMesuree)

  /* --------------------------------------------- un seul examen utilisable -- */

  if (utilisables.length === 1) {
    const m = mesures[0]
    return {
      allocations: [
        {
          examId: m.e.examId,
          libelle: m.e.libelle,
          minutes: budgetMinutes,
          part: 1,
          progressionRelative: m.progression,
          penteUtilisee: m.pente,
          penteMesuree: m.penteMesuree,
          ecartACible: ecartACible(m.e),
          contrainte: 'prorata',
          raison: 'Seul examen travaillable cette semaine',
        },
        ...exclus,
      ],
      budgetMinutes,
      notes,
      estimationGrossiere,
    }
  }

  /* ------------------------------------------------------------ planchers -- */

  const planchers = new Map<string, number>()
  const contraintes = new Map<string, Contrainte>()
  const raisons = new Map<string, string>()

  // Plancher d'entretien : aucun examen actif ne descend sous 1 h par semaine.
  // L'anglais se dégrade vite à l'arrêt, et reprendre coûte plus cher que
  // maintenir.
  for (const m of mesures) {
    // Le plancher lui-même est borné par la capacité : réserver une heure à un
    // examen dont la banque n'en remplit que trente minutes gaspille la
    // différence, qui manquerait à l'autre.
    const capacite = m.e.capaciteMinutes ?? Number.POSITIVE_INFINITY
    const plancher = Math.min(PLANCHER_ENTRETIEN_MINUTES, capacite)

    planchers.set(m.e.examId, plancher)
    contraintes.set(m.e.examId, 'entretien')
    raisons.set(
      m.e.examId,
      plancher < PLANCHER_ENTRETIEN_MINUTES
        ? `Plancher d’entretien ramené à ${plancher} min : c’est tout ce que la banque permet`
        : 'Plancher d’entretien : une heure minimum pour ne pas régresser',
    )
  }

  // Plancher d'urgence : l'examen le plus proche reçoit au moins 40 % du
  // volume dès qu'il est à moins de six semaines, quelle que soit la
  // rentabilité marginale. Une échéance ne se négocie pas.
  const proches = mesures
    .filter((m) => m.e.joursRestants !== null && m.e.joursRestants <= SEMAINES_URGENCE * 7)
    .sort((a, b) => (a.e.joursRestants ?? 0) - (b.e.joursRestants ?? 0))

  if (proches.length > 0) {
    const urgent = proches[0]
    const semaines = Math.max(0, Math.round((urgent.e.joursRestants ?? 0) / 7))
    const capaciteUrgent = urgent.e.capaciteMinutes ?? Number.POSITIVE_INFINITY
    planchers.set(
      urgent.e.examId,
      Math.min(
        capaciteUrgent,
        Math.max(planchers.get(urgent.e.examId)!, Math.round(budgetMinutes * PLANCHER_URGENCE)),
      ),
    )
    contraintes.set(urgent.e.examId, 'urgence')
    raisons.set(
      urgent.e.examId,
      `Examen dans ${semaines} semaine${semaines >= 2 ? 's' : ''} : plancher d’urgence à ${Math.round(PLANCHER_URGENCE * 100)} % du volume`,
    )
  }

  const totalPlanchers = [...planchers.values()].reduce((a, b) => a + b, 0)

  // Budget trop court pour honorer les planchers : on répartit au prorata des
  // planchers eux-mêmes, plutôt que de servir l'un et affamer l'autre.
  if (totalPlanchers >= budgetMinutes) {
    const parts = repartir(
      mesures.map((m) => planchers.get(m.e.examId)!),
      budgetMinutes,
    )
    notes.push(
      `Budget hebdomadaire de ${budgetMinutes} min insuffisant pour tenir les deux planchers (${totalPlanchers} min) : la répartition est proportionnelle, et aucun des deux examens n’est correctement entretenu.`,
    )

    return {
      allocations: [
        ...mesures.map((m, i) => ({
          examId: m.e.examId,
          libelle: m.e.libelle,
          minutes: parts[i],
          part: budgetMinutes === 0 ? 0 : parts[i] / budgetMinutes,
          progressionRelative: m.progression,
          penteUtilisee: m.pente,
          penteMesuree: m.penteMesuree,
          ecartACible: ecartACible(m.e),
          contrainte: contraintes.get(m.e.examId)!,
          raison: raisons.get(m.e.examId)!,
        })),
        ...exclus,
      ],
      budgetMinutes,
      notes,
      estimationGrossiere,
    }
  }

  /* ------------------------------------------------- reste au prorata -- */

  const reste = budgetMinutes - totalPlanchers
  const poids = mesures.map((m) => m.progression)
  const sommePoids = poids.reduce((a, b) => a + b, 0)

  // Toutes les progressions sont nulles (cibles atteintes, ou pas de cible
  // renseignée) : on partage le reste également plutôt que de l'attribuer
  // arbitrairement.
  const partsReste =
    sommePoids > 0
      ? repartirSousPlafond(
          poids,
          // Marge restante, pas capacité totale : le plancher en a déjà
          // consommé une partie.
          mesures.map((m) => Math.max(0, besoinMinutes(m) - planchers.get(m.e.examId)!)),
          reste,
        )
      : repartir(mesures.map(() => 1), reste)

  if (sommePoids === 0 && reste > 0) {
    notes.push(
      'Aucun écart à une cible n’est mesurable : le reste du budget est partagé également. Renseigne tes scores cibles pour que l’arbitrage devienne informé.',
    )
  }

  const besoinTotal = mesures.reduce((acc, m) => acc + besoinMinutes(m), 0)
  if (Number.isFinite(besoinTotal) && besoinTotal + totalPlanchers < budgetMinutes) {
    notes.push(
      'Ton volume hebdomadaire dépasse ce qu’il faut pour atteindre tes deux cibles, ou ce que tes banques peuvent absorber cette semaine. Le surplus est réparti en consolidation — élargis la banque plutôt que de repasser les mêmes questions.',
    )
  }

  for (const m of mesures) {
    const capacite = m.e.capaciteMinutes
    if (capacite !== undefined && Number.isFinite(capacite) && capacite < PLANCHER_ENTRETIEN_MINUTES) {
      notes.push(
        `${m.e.libelle} : la banque ne permet de composer que ${capacite} min de travail. Importe des questions pour que sa part serve à quelque chose.`,
      )
    }
  }

  const allocations: Allocation[] = mesures.map((m, i) => {
    const minutes = planchers.get(m.e.examId)! + partsReste[i]
    const contrainte = contraintes.get(m.e.examId)!

    return {
      examId: m.e.examId,
      libelle: m.e.libelle,
      minutes,
      part: minutes / budgetMinutes,
      progressionRelative: m.progression,
      penteUtilisee: m.pente,
      penteMesuree: m.penteMesuree,
      ecartACible: ecartACible(m.e),
      contrainte: partsReste[i] > 0 && contrainte === 'entretien' ? 'prorata' : contrainte,
      raison:
        partsReste[i] > 0 && contrainte === 'entretien'
          ? m.progression > 0
            ? `Prorata du rendement : ${(m.progression * 100).toFixed(1)} % de l’écart refermé par heure`
            : m.e.scoreCible === null
              ? 'Aucun score cible renseigné : part égale'
              : 'Cible déjà atteinte : part d’entretien'
          : raisons.get(m.e.examId)!,
    }
  })

  if (estimationGrossiere) {
    notes.push(
      'Le rendement est estimé à partir d’une pente conventionnelle, pas mesurée : il faut deux épreuves passées pour que l’arbitrage s’appuie sur ta progression réelle.',
    )
  }

  return { allocations: [...allocations, ...exclus], budgetMinutes, notes, estimationGrossiere }
}

/**
 * Pente observée : points d'échelle gagnés par heure réellement investie.
 *
 * Demande au moins deux scores et un volume non dérisoire — sinon on ne mesure
 * que du bruit, et une pente inventée serait pire que pas de pente.
 */
export const HEURES_MINIMALES_PENTE = 2

export function calculerPente(
  scores: Array<{ score: number; jour: string }>,
  heuresInvesties: number,
): number | null {
  if (scores.length < 2 || heuresInvesties < HEURES_MINIMALES_PENTE) return null

  const tries = [...scores].sort((a, b) => a.jour.localeCompare(b.jour))
  const gain = tries[tries.length - 1].score - tries[0].score

  if (gain <= 0) return null // régression ou stagnation : on ne projette pas
  return gain / heuresInvesties
}
