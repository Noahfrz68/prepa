import { nombre, type Alea } from '@/core/generation/alea'
import type { Jeu, Question } from '../types'

/**
 * Jeu 11 — les identités remarquables.
 *
 *   (a + b)² = a² + 2ab + b²   (a − b)² = a² − 2ab + b²   (a + b)(a − b) = a² − b²
 *
 * Deux usages au concours : le calcul mental (99² = (100 − 1)², 53 × 47 =
 * 50² − 3²) et l'algèbre — développer, et surtout reconnaître une forme à
 * factoriser, ce qui résout les équations du second degré sans discriminant.
 */

type Genre =
  | 'carre_somme'
  | 'carre_difference'
  | 'conjugues'
  | 'developper_somme'
  | 'developper_difference'
  | 'developper_conjugues'
  | 'factoriser_somme'
  | 'factoriser_difference'
  | 'factoriser_conjugues'

const GENRES: Genre[] = [
  'carre_somme',
  'carre_difference',
  'conjugues',
  'developper_somme',
  'developper_difference',
  'developper_conjugues',
  'factoriser_somme',
  'factoriser_difference',
  'factoriser_conjugues',
]

const IDENTITES =
  '(a + b)² = a² + 2ab + b² · (a − b)² = a² − 2ab + b² · (a + b)(a − b) = a² − b²'

/* ------------------------------------------------------------- écriture -- */

/** « 3x », « x » */
const terme = (p: number) => (p === 1 ? 'x' : `${p}x`)

/** « (3x)² », mais « x² » : pas de parenthèses autour d'un x seul. */
const carre = (p: number) => (p === 1 ? 'x²' : `(${p}x)²`)

/** « 4x² + 12x − 9 », sans les termes nuls ni les coefficients 1. */
export function polynome(a2: number, a1: number, a0: number): string {
  const morceaux: string[] = []
  const ajouter = (c: number, corps: string) => {
    if (c === 0) return
    const abs = Math.abs(c)
    const texte = corps && abs === 1 ? corps : `${nombre(abs)}${corps}`
    if (morceaux.length === 0) morceaux.push(c < 0 ? `−${texte}` : texte)
    else morceaux.push(`${c < 0 ? '−' : '+'} ${texte}`)
  }
  ajouter(a2, 'x²')
  ajouter(a1, 'x')
  ajouter(a0, '')
  return morceaux.join(' ')
}

/* ------------------------------------------------------------ questions -- */

function choix(
  a: Alea,
  genre: Genre,
  enonce: string,
  juste: string,
  leurres: string[],
  astuce: string,
): Question {
  const autres = a.melanger([...new Set(leurres)].filter((l) => l !== juste)).slice(0, 4)
  const options = a.melanger([juste, ...autres])
  return {
    jeu: 'identites',
    cle: `identite:${genre}`,
    enonce,
    attendu: { genre: 'choix', valeur: options.indexOf(juste) },
    saisie: 'choix',
    choix: options,
    reponse: juste,
    solution: `${enonce.replace(/ = \?$/, '')} = ${juste}`,
    astuce: `${astuce} Rappel : ${IDENTITES}.`,
  }
}

function calcul(genre: Genre, enonce: string, valeur: number, astuce: string): Question {
  return {
    jeu: 'identites',
    cle: `identite:${genre}`,
    enonce: `${enonce} ?`,
    attendu: { genre: 'nombre', valeur },
    saisie: 'nombre',
    reponse: nombre(valeur),
    solution: `${enonce} = ${nombre(valeur)}`,
    astuce,
  }
}

const PRODUIRE: Record<Genre, (a: Alea) => Question> = {
  carre_somme(a) {
    const [rond, b] = a.chance(0.3) ? [100, a.entier(1, 9)] : [10 * a.entier(2, 9), a.entier(1, 3)]
    const n = rond + b
    return calcul(
      'carre_somme',
      `${n}²`,
      n * n,
      `(${rond} + ${b})² = ${nombre(rond * rond)} + 2 × ${rond} × ${b} + ${b}² = ${nombre(rond * rond)} + ${nombre(2 * rond * b)} + ${b * b} = ${nombre(n * n)}.`,
    )
  },

  carre_difference(a) {
    const [rond, b] = a.chance(0.3) ? [100, a.entier(1, 9)] : [10 * a.entier(3, 10), a.entier(1, 3)]
    const n = rond - b
    return calcul(
      'carre_difference',
      `${n}²`,
      n * n,
      `(${rond} − ${b})² = ${nombre(rond * rond)} − 2 × ${rond} × ${b} + ${b}² = ${nombre(rond * rond)} − ${nombre(2 * rond * b)} + ${b * b} = ${nombre(n * n)}.`,
    )
  },

  conjugues(a) {
    const rond = a.chance(0.25) ? 100 : 10 * a.entier(2, 9)
    const b = a.entier(1, 6)
    const [x, y] = a.chance(0.5) ? [rond + b, rond - b] : [rond - b, rond + b]
    return calcul(
      'conjugues',
      `${x} × ${y}`,
      x * y,
      `Les deux facteurs encadrent ${rond} à ${b} près : (${rond} + ${b})(${rond} − ${b}) = ${rond}² − ${b}² = ${nombre(rond * rond)} − ${b * b} = ${nombre(x * y)}.`,
    )
  },

  developper_somme(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'developper_somme',
      `(${terme(p)} + ${q})² = ?`,
      polynome(p * p, 2 * p * q, q * q),
      [
        polynome(p * p, 0, q * q),
        polynome(p * p, p * q, q * q),
        polynome(p * p, -2 * p * q, q * q),
        polynome(p * p, 2 * p * q, -q * q),
        polynome(p, 2 * p * q, q * q),
        polynome(p * p, 2 * p * q, q),
      ],
      `Le double produit ne s'oublie pas : ${carre(p)} = ${polynome(p * p, 0, 0)}, 2 × ${terme(p)} × ${q} = ${polynome(0, 2 * p * q, 0)}, ${q}² = ${q * q}.`,
    )
  },

  developper_difference(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'developper_difference',
      `(${terme(p)} − ${q})² = ?`,
      polynome(p * p, -2 * p * q, q * q),
      [
        polynome(p * p, 0, -q * q),
        polynome(p * p, 0, q * q),
        polynome(p * p, 2 * p * q, q * q),
        polynome(p * p, -2 * p * q, -q * q),
        polynome(p * p, -p * q, q * q),
      ],
      `Le carré du second terme reste positif : ${carre(p)} = ${polynome(p * p, 0, 0)}, −2 × ${terme(p)} × ${q} = ${polynome(0, -2 * p * q, 0)}, (−${q})² = +${q * q}.`,
    )
  },

  developper_conjugues(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'developper_conjugues',
      `(${terme(p)} + ${q})(${terme(p)} − ${q}) = ?`,
      polynome(p * p, 0, -q * q),
      [
        polynome(p * p, 0, q * q),
        polynome(p * p, -2 * p * q, -q * q),
        polynome(p * p, 2 * p * q, -q * q),
        polynome(p * p, -2 * p * q, q * q),
        polynome(p * p, 0, -2 * q),
      ],
      `Les termes en x s'annulent : ${carre(p)} − ${q}² = ${polynome(p * p, 0, -q * q)}.`,
    )
  },

  factoriser_somme(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'factoriser_somme',
      `${polynome(p * p, 2 * p * q, q * q)} = ?`,
      `(${terme(p)} + ${q})²`,
      [
        `(${terme(p)} − ${q})²`,
        `(${terme(p)} + ${q})(${terme(p)} − ${q})`,
        `(${terme(p)} + ${2 * q})²`,
        `(${terme(2 * p)} + ${q})²`,
        `(${terme(p)} + ${q * q})²`,
      ],
      `${polynome(p * p, 0, 0)} est le carré de ${terme(p)}, ${q * q} celui de ${q}, et ${polynome(0, 2 * p * q, 0)} leur double produit, avec un + : c'est (${terme(p)} + ${q})².`,
    )
  },

  factoriser_difference(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'factoriser_difference',
      `${polynome(p * p, -2 * p * q, q * q)} = ?`,
      `(${terme(p)} − ${q})²`,
      [
        `(${terme(p)} + ${q})²`,
        `(${terme(p)} + ${q})(${terme(p)} − ${q})`,
        `(${terme(p)} − ${2 * q})²`,
        `(${terme(2 * p)} − ${q})²`,
        `(${q} + ${terme(p)})²`,
      ],
      `${polynome(p * p, 0, 0)} et ${q * q} sont les carrés de ${terme(p)} et ${q} ; le double produit ${polynome(0, -2 * p * q, 0)} porte un − : c'est (${terme(p)} − ${q})².`,
    )
  },

  factoriser_conjugues(a) {
    const [p, q] = [a.entier(1, 5), a.entier(1, 9)]
    return choix(
      a,
      'factoriser_conjugues',
      `${polynome(p * p, 0, -q * q)} = ?`,
      `(${terme(p)} + ${q})(${terme(p)} − ${q})`,
      [
        `(${terme(p)} − ${q})²`,
        `(${terme(p)} + ${q})²`,
        `(${q} − ${terme(p)})(${q} + ${terme(p)})`,
        `(${terme(p)} − ${2 * q})(${terme(p)} + ${2 * q})`,
        // Même ordre que la bonne : pour q = 1 les deux s'écrivent pareil et le doublon tombe.
        `(${terme(p)} + ${q * q})(${terme(p)} − ${q * q})`,
      ],
      `Une différence de deux carrés : ${carre(p)} − ${q}² = (${terme(p)} + ${q})(${terme(p)} − ${q}). Il n'y a pas de terme en x : ce n'est pas un carré.`,
    )
  },
}

export const identites: Jeu = {
  id: 'identites',
  nom: 'Identités remarquables',
  description: '99² = (100 − 1)², 53 × 47 = 50² − 3², développer et factoriser.',
  seuilLentMs: 15000,
  defiDepuis: '2026-10-03',
  produire: (a) => PRODUIRE[a.choix(GENRES)](a),
  produireCle(a, cle) {
    const [famille, genre] = cle.split(':')
    return famille === 'identite' && GENRES.includes(genre as Genre) ? PRODUIRE[genre as Genre](a) : null
  },
}
