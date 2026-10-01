import { nombre, type Alea } from '@/core/generation/alea'
import type { Jeu, Question } from '../types'

/**
 * Jeu 9 — les triplets de Pythagore.
 *
 * Le concours construit presque toutes ses figures sur un triplet ou un de
 * ses multiples : reconnaître 9-12-15 dans « 3 × (3-4-5) » dispense de la
 * racine carrée. Le fait travaillé est le triplet de base (`pythagore:3-4-5`),
 * quel que soit son multiple et la forme de la question.
 */

const TABLE = 'Triplets de Pythagore'

export const TRIPLETS: Array<[number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 40, 41],
  [20, 21, 29],
]

/** Au-delà, le calcul de tête cesse d'être un réflexe. */
const HYPOTENUSE_MAX = 150

type Genre = 'hypotenuse' | 'cote' | 'rectangle'

const nomTriplet = (t: readonly number[]) => t.join('-')

function multiple(a: Alea, base: [number, number, number]): number {
  const kMax = Math.max(1, Math.min(5, Math.floor(HYPOTENUSE_MAX / base[2])))
  return a.entier(1, kMax)
}

function origine(base: [number, number, number], k: number): string {
  return k === 1 ? `C'est le triplet ${nomTriplet(base)}.` : `${nomTriplet(base.map((x) => x * k))} = ${k} × (${nomTriplet(base)}).`
}

function question(a: Alea, genre: Genre, base: [number, number, number]): Question {
  const k = multiple(a, base)
  const [x, y, h] = base.map((v) => v * k)
  const cle = `pythagore:${nomTriplet(base)}`

  if (genre === 'hypotenuse') {
    const [p, q] = a.chance(0.5) ? [x, y] : [y, x]
    return {
      jeu: 'pythagore',
      cle,
      enonce: `Triangle rectangle de côtés ${p} et ${q} autour de l’angle droit : hypoténuse ?`,
      attendu: { genre: 'nombre', valeur: h },
      saisie: 'nombre',
      reponse: String(h),
      solution: `${Math.min(p, q)}-${Math.max(p, q)}-${h}`,
      astuce: `${origine(base, k)} Vérification : ${p}² + ${q}² = ${nombre(p * p)} + ${nombre(q * q)} = ${nombre(h * h)} = ${h}².`,
      table: TABLE,
    }
  }

  if (genre === 'cote') {
    const [connu, cherche] = a.chance(0.5) ? [x, y] : [y, x]
    return {
      jeu: 'pythagore',
      cle,
      enonce: `Triangle rectangle d’hypoténuse ${h}, un côté de l’angle droit vaut ${connu} : l’autre ?`,
      attendu: { genre: 'nombre', valeur: cherche },
      saisie: 'nombre',
      reponse: String(cherche),
      solution: `${Math.min(connu, cherche)}-${Math.max(connu, cherche)}-${h}`,
      astuce: `${origine(base, k)} Sinon : ${h}² − ${connu}² = ${nombre(h * h)} − ${nombre(connu * connu)} = ${nombre(cherche * cherche)} = ${cherche}².`,
      table: TABLE,
    }
  }

  // « Est-il rectangle ? » : une fois sur deux un vrai triplet, sinon un côté
  // décalé d'une ou deux unités — le piège de l'œil qui croit reconnaître.
  const vrai = a.chance(0.5)
  let c = h
  if (!vrai) {
    do c = h + a.choix([-2, -1, 1, 2])
    while (x * x + y * y === c * c || c <= Math.max(x, y))
  }
  const cotes = `${x}, ${y} et ${c}`
  return {
    jeu: 'pythagore',
    cle,
    enonce: `Un triangle de côtés ${cotes} est-il rectangle ?`,
    attendu: { genre: 'ouinon', valeur: vrai },
    saisie: 'ouinon',
    reponse: vrai ? 'oui' : 'non',
    solution: vrai ? `${x}-${y}-${h} est un triplet` : `${cotes} : pas un triplet`,
    astuce: vrai
      ? `${origine(base, k)} ${x}² + ${y}² = ${nombre(x * x + y * y)} = ${h}².`
      : `Le triplet est ${nomTriplet([x, y, h])}${k > 1 ? `, ${k} × (${nomTriplet(base)})` : ''} : avec ${c} au lieu de ${h}, ` +
        `${x}² + ${y}² = ${nombre(x * x + y * y)} ≠ ${c}² = ${nombre(c * c)}.`,
    table: TABLE,
  }
}

export const pythagore: Jeu = {
  id: 'pythagore',
  nom: 'Triplets de Pythagore',
  description: '3-4-5, 5-12-13, 8-15-17… et leurs multiples : hypoténuse, côté manquant, triangle rectangle ou non.',
  seuilLentMs: 15000,
  defiDepuis: '2026-10-03',
  produire(a) {
    const genre = a.choix<Genre>(['hypotenuse', 'hypotenuse', 'cote', 'cote', 'rectangle'])
    return question(a, genre, a.choix(TRIPLETS))
  },
  produireCle(a, cle) {
    const [famille, nom] = cle.split(':')
    const base = TRIPLETS.find((t) => nomTriplet(t) === nom)
    if (famille !== 'pythagore' || !base) return null
    return question(a, a.choix<Genre>(['hypotenuse', 'cote', 'rectangle']), base)
  },
}
