import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { ACCENTS, type Accent } from '@/exams/toeic/listening'

/**
 * Piper lit le texte sur son entrée standard. `execFile` ne sait pas alimenter
 * stdin : il faut `spawn` et écrire dedans.
 */
function lancerPiper(binaire: string, args: string[], texte: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(binaire, args, { stdio: ['pipe', 'ignore', 'pipe'] })

    let erreur = ''
    p.stderr.on('data', (d) => (erreur += String(d)))
    p.on('error', reject)
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`Piper a échoué (${code}) : ${erreur.slice(-300)}`)),
    )

    p.stdin.write(texte)
    p.stdin.end()
  })
}

/**
 * Chaîne de synthèse vocale, locale et gratuite.
 *
 * MÊME PRINCIPE QUE LA COUCHE IA : dégradable, et honnête sur son état.
 *
 * Trois niveaux, du meilleur au pire :
 *   1. Piper — synthèse locale, hors ligne, produit des fichiers réutilisables,
 *      voix cohérentes d'une session à l'autre. Nécessite un binaire et des
 *      modèles de voix installés.
 *   2. Voix du navigateur (Web Speech API) — aucune installation, mais dépend
 *      des voix présentes sur le système, et ne produit pas de fichier.
 *   3. Rien — et dans ce cas le Listening est **bloqué**, pas dégradé.
 *
 * Ce dernier point est délibéré. Lire un transcript à l'écran au lieu de
 * l'écouter n'entraîne pas la compétence testée : on n'écoute qu'une fois, on
 * ne revient pas en arrière. Proposer la lecture serait proposer un exercice
 * qui ressemble au TOEIC sans en être un.
 */

export const DOSSIER_AUDIO = path.join(process.cwd(), 'data', 'audio')

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

/** Clé de cache : un script inchangé n'est jamais resynthétisé. */
export function hashScript(segments: Segment[], accent: Accent): string {
  const canonique = JSON.stringify({ accent, segments })
  return createHash('sha256').update(canonique).digest('hex').slice(0, 32)
}

/* --------------------------------------------------------------- Piper -- */

/**
 * Modèles de voix, un par accent et par locuteur.
 *
 * Renseignés dans .env.local sous la forme :
 *   PIPER_VOIX_US=C:/piper/voix/en_US-amy-medium.onnx
 *   PIPER_VOIX_US_2=C:/piper/voix/en_US-ryan-medium.onnx
 *
 * Le second locuteur sert aux conversations de Part 3, qui demandent deux voix
 * distinctes dans le même fichier.
 */
function modeleVoix(accent: Accent, locuteur: number): string | undefined {
  const suffixe = locuteur === 0 ? '' : `_${locuteur + 1}`
  return process.env[`PIPER_VOIX_${accent}${suffixe}`]?.trim() || process.env[`PIPER_VOIX_${accent}`]?.trim()
}

function piper(): MoteurTts {
  const binaire = process.env.PIPER_BIN?.trim()

  return {
    id: 'piper',
    libelle: 'Piper (synthèse locale)',
    indisponible() {
      if (!binaire) return 'PIPER_BIN absent de .env.local'
      if (!fs.existsSync(binaire)) return `Binaire introuvable : ${binaire}`

      if (accentsDisponibles().length === 0) {
        return 'Aucun modèle de voix configuré (PIPER_VOIX_US, PIPER_VOIX_UK, …)'
      }
      return null
    },

    async synthetiser(demande, hash) {
      fs.mkdirSync(DOSSIER_AUDIO, { recursive: true })

      const morceaux: string[] = []

      // Une conversation demande deux à trois voix distinctes : on synthétise
      // chaque réplique séparément, puis on les concatène.
      for (const [i, segment] of demande.segments.entries()) {
        const modele = modeleVoix(demande.accent, segment.locuteur)
        if (!modele) throw new Error(`Aucun modèle de voix pour l’accent ${demande.accent}.`)

        const sortie = path.join(DOSSIER_AUDIO, `${hash}-${i}.wav`)
        await lancerPiper(binaire!, ['--model', modele, '--output_file', sortie], segment.texte)
        morceaux.push(sortie)
      }

      const final = path.join(DOSSIER_AUDIO, `${hash}.wav`)
      concatenerWav(morceaux, final, demande.segments.length > 1 ? 400 : 0)
      for (const m of morceaux) fs.rmSync(m, { force: true })

      return {
        cheminRelatif: path.relative(path.join(process.cwd(), 'data'), final).replace(/\\/g, '/'),
        moteur: 'piper',
        voix: modeleVoix(demande.accent, 0) ?? '',
        dureeMs: dureeWav(final),
      }
    },
  }
}

/* --------------------------------------------------------------- aucun -- */

export const AUCUN_MOTEUR: MoteurTts = {
  id: 'aucun',
  libelle: 'Aucun moteur de synthèse',
  indisponible: () => 'Aucun moteur de synthèse installé.',
  async synthetiser() {
    throw new Error('Aucun moteur de synthèse installé.')
  },
}

export function moteurActif(): MoteurTts {
  const p = piper()
  return p.indisponible() === null ? p : AUCUN_MOTEUR
}

/**
 * Accents pour lesquels une voix est réellement configurée.
 *
 * IMPORTANT : le catalogue Piper ne contient que de l'anglais américain et
 * britannique. Il n'existe ni voix australienne ni voix canadienne. Le TOEIC
 * en utilise quatre : ce module n'en couvre donc que deux, et le dit plutôt
 * que de faire passer une voix britannique pour de l'australien — un
 * utilisateur qui se découvrirait « faible en australien » serait en réalité
 * faible sur une voix britannique.
 */
export function accentsDisponibles(): Accent[] {
  return ACCENTS.filter((a) => Boolean(modeleVoix(a, 0)))
}

/** Accents que le TOEIC utilise mais qu'aucune voix locale ne peut produire. */
export function accentsNonCouverts(): Accent[] {
  return ACCENTS.filter((a) => !modeleVoix(a, 0))
}

/** Nombre de voix distinctes disponibles pour un accent, pour les dialogues. */
export function locuteursDisponibles(accent: Accent): number {
  let n = 0
  while (process.env[`PIPER_VOIX_${accent}${n === 0 ? '' : `_${n + 1}`}`]?.trim()) n++
  return n
}

export interface EtatAudio {
  moteurServeur: { id: string; libelle: string; raisonIndisponibilite: string | null }
  accentsDisponibles: Accent[]
  accentsNonCouverts: Accent[]
  locuteursParAccent: Record<string, number>
}

export function etatAudio(): EtatAudio {
  const m = piper()
  const dispo = accentsDisponibles()

  return {
    moteurServeur: { id: m.id, libelle: m.libelle, raisonIndisponibilite: m.indisponible() },
    accentsDisponibles: dispo,
    accentsNonCouverts: accentsNonCouverts(),
    locuteursParAccent: Object.fromEntries(dispo.map((a) => [a, locuteursDisponibles(a)])),
  }
}

/* ------------------------------------------------------ utilitaires WAV -- */

/**
 * Concatène des WAV PCM en insérant un silence entre les répliques.
 *
 * Piper produit du PCM 16 bits mono : la concaténation se réduit à recoller
 * les blocs de données sous un en-tête recalculé. Pas de dépendance externe.
 */
function concatenerWav(fichiers: string[], sortie: string, silenceMs: number): void {
  if (fichiers.length === 0) throw new Error('Rien à concaténer.')

  const premiers = fs.readFileSync(fichiers[0])
  const enTete = Buffer.from(premiers.subarray(0, 44))
  const tauxOctets = enTete.readUInt32LE(28)

  const silence = Buffer.alloc(Math.round((silenceMs / 1000) * tauxOctets))

  const corps: Buffer[] = []
  for (const [i, f] of fichiers.entries()) {
    if (i > 0 && silence.length > 0) corps.push(silence)
    corps.push(fs.readFileSync(f).subarray(44))
  }

  const donnees = Buffer.concat(corps)
  enTete.writeUInt32LE(36 + donnees.length, 4)
  enTete.writeUInt32LE(donnees.length, 40)

  fs.writeFileSync(sortie, Buffer.concat([enTete, donnees]))
}

function dureeWav(fichier: string): number | null {
  try {
    const b = fs.readFileSync(fichier)
    const tauxOctets = b.readUInt32LE(28)
    const taille = b.readUInt32LE(40)
    return tauxOctets > 0 ? Math.round((taille / tauxOctets) * 1000) : null
  } catch {
    return null
  }
}
