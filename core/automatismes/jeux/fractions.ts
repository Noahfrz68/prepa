import { court, pc, variation } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 3 — fractions, décimaux, pourcentages, coefficients.
 *
 * Passer de 12,5 % à 1/8 sans poser de division permet de calculer en
 * fractions exactes. Les coefficients et leurs annulations (+25 % se défait
 * par −20 %) sont le cœur de toutes les questions de variations.
 */

const TABLE_FRACTIONS = 'Fractions et pourcentages'
const TABLE_COEFS = 'Coefficients multiplicateurs'

const FRACTIONS: Array<[number, number]> = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 6],
  [5, 6],
  [1, 7],
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [1, 9],
  [1, 12],
  [1, 16],
  [1, 20],
  [1, 25],
  [1, 50],
]

/** Une fraction est « exacte » si son écriture décimale s'arrête. */
const exacte = ([, d]: [number, number]) => [2, 4, 5, 8, 16, 20, 25, 50].includes(d)
const EXACTES = FRACTIONS.filter(exacte)

/** Assez large pour 33,3 et 14,29 ; trop étroit pour 33 ou 14. */
const TOLERANCE_ARRONDI = 0.06

const HAUSSES = [5, 10, 15, 20, 25, 30, 40, 50, 75]

/** Variation qui annule t, en %. +25 → −20 ; −50 → +100. */
const annulation = (t: number) => (100 / (100 + t) - 1) * 100

export const fractions: Jeu = {
  id: 'fractions',
  nom: 'Fractions et pourcentages',
  description: '1/8 = 0,125 = 12,5 %, coefficients, hausses qui s’annulent.',
  seuilLentMs: 5000,
  produire(a): Question {
    const genre = a.entier(0, 9)
    if (genre <= 3) return pourcentDe(a.choix(FRACTIONS))
    if (genre <= 5) return fractionDe(a.choix(EXACTES))
    if (genre <= 6) return decimalDe(a.choix(EXACTES))
    const t = a.choix(HAUSSES) * (a.chance(0.6) ? 1 : -1)
    if (genre <= 8) return coefDe(t)
    // Une baisse de 75 % s'annule par +300 % : juste, mais sans intérêt.
    return annulationDe(t === -75 ? -50 : t)
  },
  produireCle(_a, cle) {
    const [genre, param] = cle.split(':')
    if (genre === 'coef' || genre === 'annulation') {
      const t = Number(param)
      if (!HAUSSES.includes(Math.abs(t)) || (genre === 'annulation' && t === -75)) return null
      return genre === 'coef' ? coefDe(t) : annulationDe(t)
    }
    const f = FRACTIONS.find(([n, d]) => `${n}/${d}` === param)
    if (!f) return null
    if (genre === 'pourcent') return pourcentDe(f)
    if (!exacte(f)) return null
    if (genre === 'fraction') return fractionDe(f)
    if (genre === 'decimal') return decimalDe(f)
    return null
  },
}

function pourcentDe(f: [number, number]): Question {
  const [n, d] = f
  const p = (100 * n) / d
  const egal = exacte(f) ? '=' : '≈'
  const lu = pc(p, exacte(f) ? 2 : 1)
  return {
    jeu: 'fractions',
    cle: `pourcent:${n}/${d}`,
    enonce: `${n}/${d} = ? %`,
    attendu: { genre: 'nombre', valeur: p, tolerance: exacte(f) ? undefined : TOLERANCE_ARRONDI },
    saisie: 'nombre',
    reponse: exacte(f) ? lu : `≈ ${lu}`,
    solution: `${n}/${d} ${egal} ${lu}`,
    astuce:
      n === 1
        ? `1/${d} = 100 % ÷ ${d} ${egal} ${lu}.`
        : `${n}/${d} = ${n} × 1/${d} ${egal} ${n} × ${pc(100 / d)} ${egal} ${lu}.`,
    table: TABLE_FRACTIONS,
  }
}

function fractionDe([n, d]: [number, number]): Question {
  const p = (100 * n) / d
  return {
    jeu: 'fractions',
    cle: `fraction:${n}/${d}`,
    enonce: `${pc(p)} = quelle fraction ?`,
    aide: 'En fraction : a/b',
    attendu: { genre: 'fraction', numerateur: n, denominateur: d },
    saisie: 'texte',
    reponse: `${n}/${d}`,
    solution: `${pc(p)} = ${n}/${d}`,
    astuce:
      n === 1
        ? `100 % ÷ ${pc(p)} = ${d}, donc ${pc(p)} = 1/${d}.`
        : `1/${d} = ${pc(100 / d)}, et ${pc(p)} = ${n} × ${pc(100 / d)} → ${n}/${d}.`,
    table: TABLE_FRACTIONS,
  }
}

function decimalDe([n, d]: [number, number]): Question {
  const v = n / d
  return {
    jeu: 'fractions',
    cle: `decimal:${n}/${d}`,
    enonce: `${n}/${d} en décimal ?`,
    attendu: { genre: 'nombre', valeur: v },
    saisie: 'nombre',
    reponse: court(v, 4),
    solution: `${n}/${d} = ${court(v, 4)}`,
    astuce: `${n}/${d} = ${pc((100 * n) / d)} = ${court(v, 4)} : on décale la virgule de deux rangs.`,
    table: TABLE_FRACTIONS,
  }
}

function coefDe(t: number): Question {
  const c = 1 + t / 100
  return {
    jeu: 'fractions',
    cle: `coef:${t}`,
    enonce: `${t > 0 ? 'Hausse' : 'Baisse'} de ${pc(Math.abs(t))} : coefficient ?`,
    attendu: { genre: 'nombre', valeur: c },
    saisie: 'nombre',
    reponse: `× ${court(c)}`,
    solution: `${variation(t)} → × ${court(c)}`,
    astuce: `Coefficient = 1 ${t > 0 ? '+' : '−'} ${court(Math.abs(t) / 100)} = ${court(c)}. On multiplie, on n'ajoute pas.`,
    table: TABLE_COEFS,
  }
}

function annulationDe(u: number): Question {
  const r = annulation(u)
  const ronde = Math.abs(r - Math.round(r * 100) / 100) < 1e-9
  const egal = ronde ? '=' : '≈'
  const lu = variation(Number(r.toFixed(ronde ? 2 : 1)))
  return {
    jeu: 'fractions',
    cle: `annulation:${u}`,
    enonce: `Après ${variation(u)}, quelle variation ramène au départ ?`,
    aide: 'Avec son signe (+ ou −), en %',
    attendu: { genre: 'nombre', valeur: r, tolerance: ronde ? undefined : TOLERANCE_ARRONDI },
    saisie: 'relatif',
    reponse: ronde ? lu : `≈ ${lu}`,
    solution: `${variation(u)} s'annule par ${lu}`,
    astuce:
      `Défaire une variation, c'est DIVISER par son coefficient : ` +
      `1 ÷ ${court(1 + u / 100)} ${egal} ${court(1 + r / 100, 3)} → ${lu}. ` +
      `Jamais l'opposé : ${variation(u)} ne s'annule pas par ${variation(-u)}.`,
    table: TABLE_COEFS,
  }
}
