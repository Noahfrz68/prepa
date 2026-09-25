/**
 * TAGE MAGE — structure de l'épreuve et taxonomie des sous-compétences.
 *
 * 6 sous-tests, 15 questions chacun, 20 minutes par sous-test.
 * Barème +4 / 0 / 0, sans pénalité : voir core/scoring/tagemage.ts.
 */

export type SectionTageMage =
  | 'comprehension'
  | 'calcul'
  | 'raisonnement'
  | 'conditions_minimales'
  | 'expression'
  | 'logique'

export interface SectionSpec {
  id: SectionTageMage
  numero: number
  libelle: string
  bloc: string
  questions: number
  minutes: number
  typeItem: 'qcm' | 'conditions_minimales'
}

export const SECTIONS: SectionSpec[] = [
  {
    id: 'comprehension',
    numero: 1,
    libelle: 'Compréhension de textes',
    bloc: 'Aptitudes verbales',
    questions: 15,
    minutes: 20,
    typeItem: 'qcm',
  },
  {
    id: 'calcul',
    numero: 2,
    libelle: 'Calcul',
    bloc: 'Résolution de problèmes',
    questions: 15,
    minutes: 20,
    typeItem: 'qcm',
  },
  {
    id: 'raisonnement',
    numero: 3,
    libelle: 'Raisonnement & argumentation',
    bloc: 'Raisonnement',
    questions: 15,
    minutes: 20,
    typeItem: 'qcm',
  },
  {
    id: 'conditions_minimales',
    numero: 4,
    libelle: 'Conditions minimales',
    bloc: 'Résolution de problèmes',
    questions: 15,
    minutes: 20,
    typeItem: 'conditions_minimales',
  },
  {
    id: 'expression',
    numero: 5,
    libelle: 'Expression',
    bloc: 'Aptitudes verbales',
    questions: 15,
    minutes: 20,
    typeItem: 'qcm',
  },
  {
    id: 'logique',
    numero: 6,
    libelle: 'Logique',
    bloc: 'Raisonnement',
    questions: 15,
    minutes: 20,
    typeItem: 'qcm',
  },
]

export const SECTIONS_PAR_ID = new Map(SECTIONS.map((s) => [s.id, s]))

/** Secondes par question, dérivé de la structure officielle : 20 min / 15 questions. */
export const SECONDES_PAR_QUESTION = Math.round((20 * 60) / 15) // 80

/**
 * Conditions minimales : les cinq propositions sont invariables.
 * Elles ne sont donc jamais stockées dans `item.options`.
 */
export const OPTIONS_CONDITIONS_MINIMALES = [
  "L'information (1) permet à elle seule de répondre, mais (2) ne le permet pas seule.",
  "L'information (2) permet à elle seule de répondre, mais (1) ne le permet pas seule.",
  'Les deux informations ensemble sont nécessaires et suffisantes ; aucune ne suffit seule.',
  'Chaque information permet à elle seule de répondre.',
  'Les deux informations ensemble ne suffisent pas à répondre.',
]

/** Rappel affiché en permanence sur le sous-test 4 : c'est le piège n°1. */
export const RAPPEL_CONDITIONS_MINIMALES =
  'Il faut déterminer si on PEUT répondre, pas calculer la réponse.'

interface SkillSeed {
  section: SectionTageMage
  libelles: string[]
}

const TAXONOMIE: SkillSeed[] = [
  {
    section: 'comprehension',
    libelles: [
      'idée principale',
      'inférence',
      'vocabulaire en contexte',
      'structure argumentative',
      'détail explicite',
      "ton et intention de l'auteur",
    ],
  },
  {
    section: 'calcul',
    libelles: [
      'pourcentages et variations',
      'proportionnalité et ratios',
      'équations du 1er degré',
      'équations du 2nd degré',
      'systèmes',
      'arithmétique et divisibilité',
      'géométrie plane',
      'aires et volumes',
      'moyennes et médianes',
      'probabilités',
      'dénombrement',
      'vitesses, débits et mélanges',
      'suites et progressions',
    ],
  },
  {
    section: 'raisonnement',
    libelles: [
      'prémisse et conclusion',
      'renforcer un argument',
      'affaiblir un argument',
      'hypothèse implicite',
      'identifier un sophisme',
      'résoudre un paradoxe',
      'raisonnement par analogie',
    ],
  },
  {
    section: 'conditions_minimales',
    libelles: [
      'maîtrise du format A-E',
      'suffisance vs résolution',
      'pièges de signe et cas particuliers',
      'CM — pourcentages et variations',
      'CM — proportionnalité et ratios',
      'CM — équations et systèmes',
      'CM — arithmétique et divisibilité',
      'CM — géométrie',
      'CM — statistiques et probabilités',
    ],
  },
  {
    section: 'expression',
    libelles: [
      'synonymes et antonymes',
      'grammaire et conjugaison',
      'orthographe',
      'reformulation',
      'cohérence et registre',
      'correction syntaxique',
      'connecteurs logiques',
    ],
  },
  {
    section: 'logique',
    // Seize archétypes, pas six familles. « Intrus » recouvrait des nombres et
    // des figures, qui ne se travaillent pas du tout de la même façon : une
    // mesure qui les confond ne peut rien dire d'utile au plan de révision.
    libelles: [
      'suites numériques',
      'suites de lettres',
      'croix de nombres',
      'croix de lettres',
      'cases barrées',
      'opérations codées',
      'matrices de figures',
      'suites de figures',
      'rotations et symétries',
      'intrus numérique',
      'intrus alphabétique',
      'intrus figuré',
      'analogies de lettres',
      'analogies de figures',
      'dominos',
      'cartes',
    ],
  },
]

export interface SkillRow {
  id: string
  exam_id: string
  section: string
  libelle: string
  poids_examen: number
  ordre: number
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function skillsTageMage(): SkillRow[] {
  const rows: SkillRow[] = []
  for (const groupe of TAXONOMIE) {
    groupe.libelles.forEach((libelle, i) => {
      rows.push({
        id: `tm.${groupe.section}.${slug(libelle)}`,
        exam_id: 'tagemage',
        section: groupe.section,
        libelle,
        // Les 6 sous-tests pèsent identiquement dans le score final.
        poids_examen: 1,
        ordre: i,
      })
    })
  }
  return rows
}

/**
 * L'arbre de décision des conditions minimales : trois questions fermées au
 * lieu de cinq propositions à comparer.
 *
 *   (1) seule suffit ? (2) seule suffit ?
 *     oui / oui → D · oui / non → A · non / oui → B
 *     non / non → ensemble ? oui → C · non → E
 *
 * Répondre dans cet ordre est la procédure de la leçon « Le format A–E » : on
 * ne se demande « ensemble ? » qu'une fois établi qu'aucune ne suffit seule.
 */
export function lettreConditionsMinimales(
  unSeule: boolean,
  deuxSeule: boolean,
  ensemble: boolean | null,
): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  if (unSeule && deuxSeule) return 'D'
  if (unSeule) return 'A'
  if (deuxSeule) return 'B'
  if (ensemble === null) return null
  return ensemble ? 'C' : 'E'
}
