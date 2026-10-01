import { nombre, type Alea } from '@/core/generation/alea'
import type { Jeu, Question } from '../types'

/**
 * Jeu 8 — le calendrier.
 *
 * « Le 3 février est un mercredi ; quel jour est le 18 avril ? » Le geste :
 * compter les jours mois par mois, garder le reste de la division par 7, et
 * avancer d'autant dans la semaine. Les dates sont celles du vrai calendrier,
 * années bissextiles comprises : la réponse est vérifiable sur n'importe quel
 * agenda.
 */

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
export const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

type Genre = 'dates' | 'dans' | 'il_y_a'
const GENRES: Genre[] = ['dates', 'dates', 'dans', 'il_y_a']

const JOUR_MS = 86_400_000

/** Lundi = 0 … dimanche = 6. */
export const jourSemaine = (t: number) => (new Date(t).getUTCDay() + 6) % 7

const joursDuMois = (annee: number, mois: number) => new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate()

function dateLisible(t: number): string {
  const d = new Date(t)
  const jour = d.getUTCDate() === 1 ? '1er' : String(d.getUTCDate())
  return `${jour} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** « 74 = 7 × 10 + 4 » */
function division(k: number): string {
  return `${nombre(k)} = 7 × ${Math.floor(k / 7)} + ${k % 7}`
}

function question(genre: Genre, enonce: string, reponse: number, solution: string, astuce: string): Question {
  return {
    jeu: 'calendrier',
    cle: `calendrier:${genre}`,
    enonce,
    attendu: { genre: 'choix', valeur: reponse },
    saisie: 'choix',
    choix: JOURS,
    reponse: JOURS[reponse],
    solution,
    astuce,
  }
}

/** Le décompte mois par mois de A à B, dans la même année. */
function decompte(a: number, b: number): string {
  const da = new Date(a)
  const db = new Date(b)
  const annee = da.getUTCFullYear()
  const [ma, mb] = [da.getUTCMonth(), db.getUTCMonth()]
  if (ma === mb) return `${db.getUTCDate()} − ${da.getUTCDate()} = ${(b - a) / JOUR_MS} jours`
  const morceaux: string[] = []
  const finA = joursDuMois(annee, ma) - da.getUTCDate()
  const fevrier = (m: number) => (m === 1 ? ` (${joursDuMois(annee, 1)} jours en ${annee})` : '')
  morceaux.push(`${finA} pour finir ${MOIS[ma]}${fevrier(ma)}`)
  for (let m = ma + 1; m < mb; m++) morceaux.push(`${joursDuMois(annee, m)} en ${MOIS[m]}${fevrier(m)}`)
  morceaux.push(`${db.getUTCDate()} en ${MOIS[mb]}`)
  return `${morceaux.join(' + ')} = ${(b - a) / JOUR_MS} jours`
}

const PRODUIRE: Record<Genre, (a: Alea) => Question> = {
  dates(a) {
    const annee = a.entier(2025, 2030)
    const k = a.entier(15, 150)
    // A puis B = A + k, dans la même année.
    const debut = Date.UTC(annee, 0, 1) + a.entier(0, 364 - k) * JOUR_MS
    const fin = debut + k * JOUR_MS
    const [ja, jb] = [jourSemaine(debut), jourSemaine(fin)]
    return question(
      'dates',
      `Le ${dateLisible(debut)} est un ${JOURS[ja]}. Quel jour est le ${dateLisible(fin)} ?`,
      jb,
      `Le ${dateLisible(fin)} est un ${JOURS[jb]}`,
      `${decompte(debut, fin)}. ${division(k)} : ${JOURS[ja]} + ${k % 7} jour${k % 7 > 1 ? 's' : ''} = ${JOURS[jb]}.`,
    )
  },

  dans(a) {
    const j = a.entier(0, 6)
    const k = a.entier(10, 400)
    const r = (j + k) % 7
    return question(
      'dans',
      `Nous sommes ${JOURS[j]}. Quel jour serons-nous dans ${nombre(k)} jours ?`,
      r,
      `Dans ${nombre(k)} jours : ${JOURS[r]}`,
      `Seul le reste par 7 compte : ${division(k)}. ${JOURS[j]} + ${k % 7} = ${JOURS[r]}.`,
    )
  },

  il_y_a(a) {
    const j = a.entier(0, 6)
    const k = a.entier(10, 400)
    const r = (((j - k) % 7) + 7) % 7
    return question(
      'il_y_a',
      `Nous sommes ${JOURS[j]}. Quel jour était-ce il y a ${nombre(k)} jours ?`,
      r,
      `Il y a ${nombre(k)} jours : ${JOURS[r]}`,
      `Seul le reste par 7 compte : ${division(k)}. En arrière : ${JOURS[j]} − ${k % 7} = ${JOURS[r]}.`,
    )
  },
}

export const calendrier: Jeu = {
  id: 'calendrier',
  nom: 'Calendrier',
  description: 'Quel jour de la semaine, d’une date à l’autre ou dans n jours.',
  seuilLentMs: 15000,
  produire: (a) => PRODUIRE[a.choix(GENRES)](a),
  produireCle(a, cle) {
    const [famille, genre] = cle.split(':')
    return famille === 'calendrier' && GENRES.includes(genre as Genre) ? PRODUIRE[genre as Genre](a) : null
  },
}
