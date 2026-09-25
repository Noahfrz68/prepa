/**
 * TOEIC Listening & Reading — structure et taxonomie.
 *
 * AVERTISSEMENT STRATÉGIQUE : le TOEIC ne pénalise pas la mauvaise réponse.
 * Il ne faut donc JAMAIS laisser une case vide, et le module ne doit à aucun
 * moment proposer « sauter » comme réponse finale (voir spécification §7).
 *
 * Le contenu de ce module est construit au lot 5 (Reading) puis au lot 8
 * (Listening). La taxonomie est semée dès le lot 1 pour que l'import puisse
 * taguer des items TOEIC sans attendre.
 */

export type SectionToeic = 'listening' | 'reading'

export interface PartSpec {
  id: string
  section: SectionToeic
  numero: number
  libelle: string
  questions: number
}

export const PARTS: PartSpec[] = [
  { id: 'p1', section: 'listening', numero: 1, libelle: 'Photographies', questions: 6 },
  { id: 'p2', section: 'listening', numero: 2, libelle: 'Question / réponse', questions: 25 },
  { id: 'p3', section: 'listening', numero: 3, libelle: 'Conversations', questions: 39 },
  { id: 'p4', section: 'listening', numero: 4, libelle: 'Exposés courts', questions: 30 },
  { id: 'p5', section: 'reading', numero: 5, libelle: 'Phrases à compléter', questions: 30 },
  { id: 'p6', section: 'reading', numero: 6, libelle: 'Textes à compléter', questions: 16 },
  { id: 'p7', section: 'reading', numero: 7, libelle: 'Compréhension écrite', questions: 54 },
]

export const MINUTES_LISTENING = 45
export const MINUTES_READING = 75

/**
 * Budget de référence en Reading. L'erreur classique est de surinvestir la
 * Part 5 et de ne pas finir la Part 7, où les questions valent autant.
 */
export const BUDGET_READING_MINUTES: Record<string, number> = {
  p5: 20,
  p6: 10,
  p7: 45,
}

interface SkillSeed {
  part: string
  libelles: string[]
}

const TAXONOMIE: SkillSeed[] = [
  {
    part: 'p1',
    libelles: [
      'actions vs états',
      'prépositions de lieu',
      'paires phonétiques proches',
      'vocabulaire objets et lieux de travail',
    ],
  },
  {
    part: 'p2',
    libelles: [
      'questions en Wh-',
      'questions fermées',
      'questions indirectes',
      'réponses évasives',
      'propositions et requêtes',
    ],
  },
  {
    part: 'p3',
    libelles: [
      'intention du locuteur',
      'détail explicite',
      'inférence',
      'question sur support visuel',
      'anticipation par lecture préalable',
    ],
  },
  {
    part: 'p4',
    libelles: [
      'idée principale',
      'détail explicite',
      'inférence',
      'contexte et lieu',
    ],
  },
  {
    part: 'p5',
    libelles: [
      'temps et aspects verbaux',
      'voix passive',
      'gérondif vs infinitif',
      'prépositions',
      'conjonctions et connecteurs',
      'pronoms relatifs',
      'comparatifs et superlatifs',
      'accord sujet-verbe',
      'dérivation lexicale',
      'collocations',
    ],
  },
  {
    part: 'p6',
    libelles: [
      'cohérence textuelle',
      'insertion de phrase',
      'connecteurs de discours',
      'concordance des temps',
    ],
  },
  {
    part: 'p7',
    libelles: [
      'idée principale',
      'détail explicite',
      'inférence',
      'vocabulaire en contexte',
      'intention et registre',
      'référence croisée entre documents',
      'questions NOT / EXCEPT',
    ],
  },
]

const DOMAINES_VOCABULAIRE = [
  'ressources humaines',
  'contrats',
  'logistique',
  'finance',
  'réunions',
  'voyages',
  'marketing',
  'immobilier',
  'service client',
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

export function skillsToeic(): SkillRow[] {
  const rows: SkillRow[] = []

  for (const groupe of TAXONOMIE) {
    const part = PARTS.find((p) => p.id === groupe.part)!
    groupe.libelles.forEach((libelle, i) => {
      rows.push({
        id: `tc.${groupe.part}.${slug(libelle)}`,
        exam_id: 'toeic_lr',
        section: groupe.part,
        libelle,
        poids_examen: part.questions,
        ordre: i,
      })
    })
  }

  // Vocabulaire : transversal aux parts, alimenté par les erreurs (lot 5).
  DOMAINES_VOCABULAIRE.forEach((domaine, i) => {
    rows.push({
      id: `tc.vocabulaire.${slug(domaine)}`,
      exam_id: 'toeic_lr',
      section: 'vocabulaire',
      libelle: `vocabulaire — ${domaine}`,
      poids_examen: 1,
      ordre: i,
    })
  })

  return rows
}
