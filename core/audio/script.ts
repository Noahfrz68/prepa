import type { Accent } from '@/exams/toeic/listening'
import { sha256Hex } from './sha256'

/**
 * Ce que le PC et l'iPhone partagent de l'audio : la forme d'un script et sa
 * clé. La synthèse elle-même (Piper) n'existe que sur le PC (moteurs.ts).
 */

export interface Segment {
  /** Index du locuteur dans l'enregistrement : 0, 1, 2… */
  locuteur: number
  texte: string
}

export interface DemandeSynthese {
  segments: Segment[]
  accent: Accent
}

export interface ResultatSynthese {
  cheminRelatif: string
  moteur: string
  voix: string
  dureeMs: number | null
}

export interface MoteurTts {
  id: 'piper' | 'aucun'
  libelle: string
  /** null si prêt, sinon la raison de l'indisponibilité. */
  indisponible(): string | null
  synthetiser(demande: DemandeSynthese, hash: string): Promise<ResultatSynthese>
}

export interface EtatAudio {
  moteurServeur: { id: string; libelle: string; raisonIndisponibilite: string | null }
  accentsDisponibles: Accent[]
  accentsNonCouverts: Accent[]
  locuteursParAccent: Record<string, number>
}

/**
 * Clé de cache : un script inchangé n'est jamais resynthétisé. C'est aussi le
 * nom du fichier audio — identique sur les deux appareils.
 */
export function hashScript(segments: Segment[], accent: Accent): string {
  const canonique = JSON.stringify({ accent, segments })
  return sha256Hex(canonique).slice(0, 32)
}

export const AUCUN_MOTEUR: MoteurTts = {
  id: 'aucun',
  libelle: 'Aucun moteur de synthèse',
  indisponible: () => 'Aucun moteur de synthèse installé.',
  async synthetiser() {
    throw new Error('Aucun moteur de synthèse installé.')
  },
}
