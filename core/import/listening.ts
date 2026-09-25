/**
 * Import de contenu Listening.
 *
 * Un bloc = un enregistrement et les questions qui s'y rattachent. En Part 3
 * et 4, une même conversation porte trois questions : c'est le groupe, pas la
 * question, qui est l'unité d'import.
 *
 * Format reconnu :
 *
 *   [ACCENT: UK]
 *   [1] Good morning, I'd like to book a meeting room for Thursday.
 *   [2] Certainly. How many people will be attending?
 *   ---
 *   Q. What does the man want to do?
 *   A) Cancel a booking
 *   B) Reserve a room
 *   Réponse : B
 *
 * Les marqueurs `[1]` et `[2]` désignent les locuteurs : ce sont eux qui
 * déclenchent la synthèse à deux voix des conversations.
 */

import { LETTRES, type Lettre } from './parse'
import { ACCENTS, type Accent } from '@/exams/toeic/listening'

export interface Segment {
  locuteur: number
  texte: string
}

export interface QuestionListening {
  enonce: string
  options: string[]
  bonneReponse: Lettre
  explication?: string
}

export interface GroupeImporte {
  accent: Accent
  segments: Segment[]
  questions: QuestionListening[]
}

export interface ResultatImportListening {
  groupes: GroupeImporte[]
  avertissements: string[]
}

const RE_ACCENT = /^\s*\[\s*ACCENT\s*:\s*(US|UK|AU|CA)\s*\]\s*$/i
const RE_LOCUTEUR = /^\s*\[\s*(\d)\s*\]\s*(.+)$/
const RE_SEPARATEUR = /^\s*-{3,}\s*$/
const RE_QUESTION = /^\s*(?:Q\s*[.:)]|Question\s*\d*\s*[.:)]?)\s*(.+)$/i
const RE_OPTION = /^\s*\(?([A-Da-d])\s*[).\]:-]\s*(.+)$/
const RE_REPONSE = /^\s*(?:bonne\s+)?(?:r[ée]ponse|correction|solution)\s*[:.\-]?\s*\(?([A-Da-d])\)?\s*$/i
const RE_EXPLICATION = /^\s*(?:explication|justification)\s*[:.\-]?\s*(.*)$/i

const apercu = (s: string, n = 60) => (s.length <= n ? s : `${s.slice(0, n)}…`)

function parserQuestions(lignes: string[], index: number): {
  questions: QuestionListening[]
  avertissements: string[]
} {
  const questions: QuestionListening[] = []
  const avertissements: string[] = []

  let courante: { enonce: string; options: (string | undefined)[]; bonne?: Lettre; explication?: string } | null =
    null

  const cloturer = () => {
    if (!courante) return
    const options = courante.options.filter((o): o is string => Boolean(o))

    if (!courante.bonne) {
      avertissements.push(
        `Bloc ${index + 1} : question sans bonne réponse, ignorée — « ${apercu(courante.enonce)} »`,
      )
    } else if (options.length < 2) {
      avertissements.push(
        `Bloc ${index + 1} : moins de deux propositions — « ${apercu(courante.enonce)} »`,
      )
    } else if (LETTRES.indexOf(courante.bonne) >= options.length) {
      avertissements.push(
        `Bloc ${index + 1} : la réponse ${courante.bonne} ne correspond à aucune proposition.`,
      )
    } else {
      questions.push({
        enonce: courante.enonce,
        options,
        bonneReponse: courante.bonne,
        explication: courante.explication?.trim() || undefined,
      })
    }
    courante = null
  }

  for (const ligne of lignes) {
    const mQuestion = ligne.match(RE_QUESTION)
    if (mQuestion) {
      cloturer()
      courante = { enonce: mQuestion[1].trim(), options: [] }
      continue
    }

    if (!courante) continue

    const mReponse = ligne.match(RE_REPONSE)
    if (mReponse) {
      courante.bonne = mReponse[1].toUpperCase() as Lettre
      continue
    }

    const mExplication = ligne.match(RE_EXPLICATION)
    if (mExplication) {
      courante.explication = mExplication[1]
      continue
    }

    const mOption = ligne.match(RE_OPTION)
    if (mOption) {
      const rang = LETTRES.indexOf(mOption[1].toUpperCase() as Lettre)
      if (rang >= 0) courante.options[rang] = mOption[2].trim()
      continue
    }

    // Ligne de continuation de l'énoncé.
    courante.enonce = `${courante.enonce} ${ligne.trim()}`.trim()
  }

  cloturer()
  return { questions, avertissements }
}

export function parserListening(texte: string, accentDefaut: Accent = 'US'): ResultatImportListening {
  const blocs = texte
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean)

  const groupes: GroupeImporte[] = []
  const avertissements: string[] = []

  blocs.forEach((bloc, index) => {
    const lignes = bloc.split('\n')

    let accent: Accent = accentDefaut
    const segments: Segment[] = []
    const lignesQuestions: string[] = []
    let dansQuestions = false

    for (const ligne of lignes) {
      const mAccent = ligne.match(RE_ACCENT)
      if (mAccent) {
        const trouve = mAccent[1].toUpperCase() as Accent
        if (ACCENTS.includes(trouve)) accent = trouve
        continue
      }

      if (RE_SEPARATEUR.test(ligne)) {
        dansQuestions = true
        continue
      }

      if (dansQuestions) {
        if (ligne.trim()) lignesQuestions.push(ligne)
        continue
      }

      const mLocuteur = ligne.match(RE_LOCUTEUR)
      if (mLocuteur) {
        segments.push({ locuteur: Number(mLocuteur[1]) - 1, texte: mLocuteur[2].trim() })
        continue
      }

      // Le séparateur est facultatif : une ligne de question le remplace.
      if (RE_QUESTION.test(ligne)) {
        dansQuestions = true
        lignesQuestions.push(ligne)
        continue
      }

      if (ligne.trim()) segments.push({ locuteur: 0, texte: ligne.trim() })
    }

    if (segments.length === 0) {
      avertissements.push(`Bloc ${index + 1} ignoré : aucun script à synthétiser.`)
      return
    }

    const { questions, avertissements: avQ } = parserQuestions(lignesQuestions, index)
    avertissements.push(...avQ)

    if (questions.length === 0) {
      avertissements.push(
        `Bloc ${index + 1} ignoré : aucune question exploitable — « ${apercu(segments[0].texte)} »`,
      )
      return
    }

    groupes.push({ accent, segments, questions })
  })

  if (blocs.length === 0) avertissements.push('Aucun bloc détecté dans le texte fourni.')

  return { groupes, avertissements }
}
