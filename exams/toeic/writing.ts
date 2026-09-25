/**
 * TOEIC Writing — structure de l'épreuve et grilles de notation.
 *
 * AVERTISSEMENT DE CADRAGE. Le TOEIC Speaking & Writing est un examen distinct
 * du Listening & Reading : autre inscription, autre session. La majorité des
 * écoles françaises n'exigent que le L&R. Ce module est donc désactivable, et
 * arrive en dernier.
 *
 * Vérifie le format et le nombre de tâches sur la documentation ETS en vigueur
 * avant de t'y fier : ETS le fait évoluer plus souvent que le L&R.
 */

export type TypeTacheWriting = 'phrase_image' | 'reponse_courriel' | 'essai_opinion'

export interface TacheWriting {
  type: TypeTacheWriting
  numeros: number[]
  libelle: string
  dureeReponseS: number
  noteMax: number
  /** Nécessite une image, que rien ne permet de produire localement. */
  necessiteImage: boolean
  description: string
}

/**
 * Les huit tâches, groupées par type.
 *
 * Les tâches 1 à 5 demandent une photographie et deux mots imposés. Rien dans
 * ce projet ne produit d'images : elles ne sont proposées que si tu importes
 * toi-même des visuels. Les tâches 6 à 8 sont purement textuelles, portent
 * l'essentiel du score, et fonctionnent immédiatement.
 */
export const TACHES_WRITING: TacheWriting[] = [
  {
    type: 'phrase_image',
    numeros: [1, 2, 3, 4, 5],
    libelle: 'Décrire une image en une phrase',
    dureeReponseS: 8 * 60,
    noteMax: 3,
    necessiteImage: true,
    description:
      'Une photographie et deux mots imposés. La phrase doit être grammaticalement correcte et utiliser les deux mots.',
  },
  {
    type: 'reponse_courriel',
    numeros: [6, 7],
    libelle: 'Répondre à un courriel professionnel',
    dureeReponseS: 10 * 60,
    noteMax: 4,
    necessiteImage: false,
    description:
      'Un courriel et des consignes précises sur ce qu’il faut y traiter. La note porte autant sur la couverture des demandes que sur la langue.',
  },
  {
    type: 'essai_opinion',
    numeros: [8],
    libelle: 'Rédiger un essai d’opinion',
    dureeReponseS: 30 * 60,
    noteMax: 5,
    necessiteImage: false,
    description:
      'Une prise de position à défendre avec des raisons et des exemples. C’est la tâche la plus lourde du barème.',
  },
]

export const TACHES_PAR_TYPE = new Map(TACHES_WRITING.map((t) => [t.type, t]))

export const NOTE_MAX_WRITING = 200
export const MINUTES_WRITING = 60

export interface Critere {
  id: string
  libelle: string
  description: string
  noteMax: number
  /**
   * false quand le critère ne peut pas être évalué honnêtement dans nos
   * conditions. Affiché comme indicatif plutôt que masqué.
   */
  fiable: boolean
}

/**
 * Grilles de notation.
 *
 * Tous les critères du Writing sont évaluables sur un texte : c'est ce qui
 * distingue cette épreuve du Speaking, où prononciation et intonation ne
 * peuvent pas être jugées à partir d'une transcription.
 */
export const GRILLES: Record<TypeTacheWriting, Critere[]> = {
  phrase_image: [
    {
      id: 'grammaire',
      libelle: 'Grammaire',
      description: 'La phrase est-elle correcte ?',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'mots_imposes',
      libelle: 'Mots imposés',
      description: 'Les deux mots sont-ils utilisés, sous une forme acceptable ?',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'pertinence',
      libelle: 'Pertinence',
      description: 'La phrase décrit-elle bien la scène ?',
      noteMax: 1,
      fiable: true,
    },
  ],
  reponse_courriel: [
    {
      id: 'exhaustivite',
      libelle: 'Exhaustivité',
      description: 'Toutes les demandes de la consigne sont-elles traitées ?',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'organisation',
      libelle: 'Organisation',
      description: 'Ouverture, corps, clôture ; enchaînement des idées.',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'langue',
      libelle: 'Grammaire et syntaxe',
      description: 'Temps, accords, variété des structures.',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'registre',
      libelle: 'Registre et vocabulaire',
      description: 'Ton professionnel, formules d’usage, précision lexicale.',
      noteMax: 1,
      fiable: true,
    },
  ],
  essai_opinion: [
    {
      id: 'position',
      libelle: 'Position défendue',
      description: 'L’opinion est-elle claire et tenue d’un bout à l’autre ?',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'arguments',
      libelle: 'Raisons et exemples',
      description: 'Les arguments sont-ils étayés par des exemples concrets ?',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'organisation',
      libelle: 'Organisation',
      description: 'Introduction, développement structuré, conclusion.',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'langue',
      libelle: 'Grammaire et syntaxe',
      description: 'Correction et variété des structures.',
      noteMax: 1,
      fiable: true,
    },
    {
      id: 'vocabulaire',
      libelle: 'Vocabulaire',
      description: 'Précision et étendue, au-delà du lexique de base.',
      noteMax: 1,
      fiable: true,
    },
  ],
}

/** Longueur attendue, en mots. Sert de repère pendant la rédaction. */
export const LONGUEUR_ATTENDUE: Record<TypeTacheWriting, { min: number; cible: number }> = {
  phrase_image: { min: 5, cible: 15 },
  reponse_courriel: { min: 50, cible: 100 },
  essai_opinion: { min: 200, cible: 300 },
}

export function compterMots(texte: string): number {
  return texte.trim().split(/\s+/).filter(Boolean).length
}

export interface NoteCritere {
  id: string
  note: number
  justification: string
}

/** Note globale = somme des critères, ramenée à la note maximale de la tâche. */
export function noteGlobale(type: TypeTacheWriting, notes: NoteCritere[]): number {
  const grille = GRILLES[type]
  const tache = TACHES_PAR_TYPE.get(type)!

  const total = grille.reduce((acc, c) => {
    const n = notes.find((x) => x.id === c.id)
    return acc + Math.max(0, Math.min(c.noteMax, n?.note ?? 0))
  }, 0)

  const max = grille.reduce((acc, c) => acc + c.noteMax, 0)
  return max === 0 ? 0 : Math.round((total / max) * tache.noteMax * 10) / 10
}

/**
 * Estimation du score Writing sur 200.
 *
 * Extrapolation grossière : le barème officiel d'ETS n'est pas publié, et une
 * poignée de tâches ne prédit pas une épreuve entière. À afficher comme une
 * estimation, jamais comme un score.
 */
export const MINIMUM_ESTIMATION_WRITING = 3

export function estimerWriting(
  productions: Array<{ type: TypeTacheWriting; note: number }>,
): { score: number; n: number; fiable: boolean } {
  if (productions.length === 0) return { score: 0, n: 0, fiable: false }

  const ratio =
    productions.reduce((acc, p) => {
      const max = TACHES_PAR_TYPE.get(p.type)!.noteMax
      return acc + (max === 0 ? 0 : p.note / max)
    }, 0) / productions.length

  return {
    score: Math.round(ratio * NOTE_MAX_WRITING),
    n: productions.length,
    fiable: productions.length >= MINIMUM_ESTIMATION_WRITING,
  }
}
