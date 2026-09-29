import { ACCENTS, type Accent } from '@/exams/toeic/listening'
import { AUCUN_MOTEUR, type EtatAudio, type MoteurTts } from './script'

/**
 * Moteurs audio, version iPhone : remplace moteurs.ts dans le build
 * `PREPA_CIBLE=iphone` (resolveAlias de next.config.ts), avec les mêmes
 * exports.
 *
 * Piper est un programme du PC : le téléphone ne synthétise rien. Il lira les
 * audios produits sur le PC, apportés par la synchronisation.
 */

export { AUCUN_MOTEUR, hashScript } from './script'
export type { DemandeSynthese, EtatAudio, MoteurTts, ResultatSynthese, Segment } from './script'

export const DOSSIER_AUDIO = ''

const RAISON = 'La synthèse vocale se fait sur le PC (Piper) ; l’iPhone lit les audios synchronisés.'

const SUR_IPHONE: MoteurTts = { ...AUCUN_MOTEUR, indisponible: () => RAISON }

export function moteurActif(): MoteurTts {
  return SUR_IPHONE
}

export function accentsDisponibles(): Accent[] {
  return []
}

export function accentsNonCouverts(): Accent[] {
  return [...ACCENTS]
}

export function locuteursDisponibles(): number {
  return 0
}

export function etatAudio(): EtatAudio {
  return {
    moteurServeur: { id: SUR_IPHONE.id, libelle: SUR_IPHONE.libelle, raisonIndisponibilite: RAISON },
    accentsDisponibles: [],
    accentsNonCouverts: accentsNonCouverts(),
    locuteursParAccent: {},
  }
}
