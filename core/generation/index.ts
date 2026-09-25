import { aleaDepuis } from './alea'
import { FAMILLES_CALCUL } from './calcul'
import { FAMILLES_CONDITIONS } from './conditions'
import { FAMILLES_EXPRESSION } from './expression'
import { FAMILLES_LOGIQUE } from './logique'
import { FAMILLES_RAISONNEMENT } from './raisonnement'
import { anomalies, signature } from './verifier'
import type { Famille, QuestionGeneree } from './types'
import type { SectionTageMage } from '@/exams/tagemage'

export type SectionGenerable =
  | 'calcul'
  | 'logique'
  | 'conditions_minimales'
  | 'expression'
  | 'raisonnement'

export const SECTIONS_GENERABLES: SectionGenerable[] = [
  'calcul',
  'logique',
  'conditions_minimales',
  'expression',
  'raisonnement',
]

const FAMILLES: Record<SectionGenerable, Famille[]> = {
  calcul: FAMILLES_CALCUL,
  logique: FAMILLES_LOGIQUE,
  conditions_minimales: FAMILLES_CONDITIONS,
  expression: FAMILLES_EXPRESSION,
  raisonnement: FAMILLES_RAISONNEMENT,
}

export interface RapportGeneration {
  section: SectionGenerable
  questions: QuestionGeneree[]
  /** Tirages écartés parce qu'ils redonnaient une question déjà produite. */
  doublons: number
  /** Tirages écartés par les contrôles de forme, avec le motif. */
  rejets: Array<{ famille: string; motifs: string[] }>
  /** Répartition par famille, pour vérifier qu'aucune ne domine. */
  parFamille: Record<string, number>
}

/**
 * Fabrique un lot de questions pour un sous-test.
 *
 * Les familles sont parcourues en rotation plutôt que tirées au hasard : sur
 * deux cents questions, un tirage uniforme laisserait quand même des écarts de
 * moitié entre familles, et l'entraînement porterait sur ce déséquilibre.
 *
 * Un tirage peut échouer — leurres qui se confondent, paramètres qui ne
 * donnent pas de série lisible. On le rejoue avec d'autres paramètres au lieu
 * de rendre une question bancale.
 */
export function genererLot(
  section: SectionGenerable,
  combien: number,
  graine = Date.now(),
  dejaVues: Iterable<string> = [],
): RapportGeneration {
  const familles = FAMILLES[section]
  const a = aleaDepuis(graine)

  const questions: QuestionGeneree[] = []
  const rejets: RapportGeneration['rejets'] = []
  const parFamille: Record<string, number> = Object.fromEntries(familles.map((f) => [f.nom, 0]))
  const signatures = new Set<string>(dejaVues)
  let doublons = 0

  // Plafond d'essais : sans lui, une famille à court de combinaisons ferait
  // tourner la boucle indéfiniment au lieu de rendre ce qu'elle a pu produire.
  const maxEssais = combien * 40

  for (let essai = 0; questions.length < combien && essai < maxEssais; essai++) {
    const famille = familles[essai % familles.length]

    let q: QuestionGeneree
    try {
      q = famille.produire(a)
    } catch {
      continue
    }

    const maux = anomalies(q)
    if (maux.length > 0) {
      rejets.push({ famille: famille.nom, motifs: maux })
      continue
    }

    const sig = signature(q)
    if (signatures.has(sig)) {
      doublons++
      continue
    }

    signatures.add(sig)
    questions.push(q)
    parFamille[famille.nom]++
  }

  return { section, questions, doublons, rejets, parFamille }
}

export type { QuestionGeneree }
export function estGenerable(section: SectionTageMage): section is SectionGenerable {
  return (SECTIONS_GENERABLES as string[]).includes(section)
}
