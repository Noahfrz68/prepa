import { nombre, type Alea } from '@/core/generation/alea'
import { court, pc, variation } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 1 — le calcul mental.
 *
 * Huit gestes, chacun avec son raccourci : ce n'est pas la table de
 * multiplication qu'on entraîne, c'est le réflexe de passer par 10, par 100 ou
 * par la dizaine. La correction montre ce raccourci appliqué au cas tiré.
 */

const TABLE_COEFS = 'Coefficients multiplicateurs'

type Genre = 'table' | 'x5' | 'x25' | 'x11' | 'produit' | 'division' | 'pourcentage' | 'successives'

/** Les tables et les pourcentages reviennent plus souvent : ce sont les plus utiles. */
const GENRES: Genre[] = [
  'table', 'table', 'x5', 'x25', 'x11', 'produit', 'division', 'division',
  'pourcentage', 'pourcentage', 'successives', 'successives',
]

function question(
  cle: string,
  enonce: string,
  valeur: number,
  solution: string,
  astuce: string,
  reponse = nombre(valeur),
  table?: string,
): Question {
  return {
    jeu: 'calcul',
    cle,
    enonce,
    attendu: { genre: 'nombre', valeur },
    saisie: 'nombre',
    reponse,
    solution,
    astuce,
    table,
  }
}

/** a × b en passant par la dizaine de b : 34 × 23 = 34 × 20 + 34 × 3. */
function parDizaine(a: number, b: number): string {
  const u = b % 10
  const d = b - u
  if (u === 0) return `${a} × ${b} = ${a} × ${d / 10} × 10 = ${nombre(a * b)}.`
  return `${a} × ${b} = ${a} × ${d} + ${a} × ${u} = ${nombre(a * d)} + ${nombre(a * u)} = ${nombre(a * b)}.`
}

const PRODUIRE: Record<Genre, (a: Alea) => Question> = {
  table(a) {
    let x: number, y: number
    do {
      x = a.entier(6, 19)
      y = a.entier(6, 19)
    } while (x < 10 && y < 10 && a.chance(0.6))
    const [p, g] = x <= y ? [x, y] : [y, x]
    return question(
      `table:${p}×${g}`,
      `${x} × ${y} ?`,
      x * y,
      `${x} × ${y} = ${x * y}`,
      g >= 10 ? parDizaine(p, g) : `Table de ${g} : ${p} × ${g} = ${p * g}. À savoir sans compter.`,
    )
  },

  x5(a) {
    let n: number
    do n = a.entier(12, 398)
    while (n % 10 === 0)
    return question(
      'x5',
      `${n} × 5 ?`,
      n * 5,
      `${n} × 5 = ${nombre(n * 5)}`,
      `× 5 = × 10 ÷ 2 : ${nombre(n * 10)} ÷ 2 = ${nombre(n * 5)}.`,
    )
  },

  x25(a) {
    const n = a.chance(0.7) ? 4 * a.entier(2, 30) : a.entier(5, 99)
    return question(
      'x25',
      `${n} × 25 ?`,
      n * 25,
      `${n} × 25 = ${nombre(n * 25)}`,
      `× 25 = × 100 ÷ 4 : ${nombre(n * 100)} ÷ 4 = ${nombre(n * 25)}.`,
    )
  },

  x11(a) {
    const n = a.entier(12, 99)
    const d = Math.floor(n / 10)
    const u = n % 10
    const s = d + u
    const astuce =
      s < 10
        ? `× 11 : on écarte les chiffres et on glisse leur somme au milieu → ${d} | ${d} + ${u} | ${u} = ${n * 11}.`
        : `× 11 : on écarte les chiffres et on glisse leur somme au milieu → ${d} | ${s} | ${u} ; ` +
          `la somme dépasse 9, on retient 1 sur les centaines → ${n * 11}.`
    return question('x11', `${n} × 11 ?`, n * 11, `${n} × 11 = ${n * 11}`, astuce)
  },

  produit(a) {
    const x = a.entier(12, 49)
    let y: number
    do y = a.entier(12, 29)
    while (y % 10 === 0)
    return question('produit', `${x} × ${y} ?`, x * y, `${x} × ${y} = ${nombre(x * y)}`, parDizaine(x, y))
  },

  division(a) {
    const d = a.entier(3, 19)
    const q = a.entier(7, 60)
    const n = d * q
    const u = q % 10
    const astuce =
      q >= 10 && u !== 0
        ? `On découpe ${nombre(n)} en multiples de ${d} : ${nombre(d * (q - u))} + ${d * u} = ${d} × ${q - u} + ${d} × ${u}, donc ${q}.`
        : `${d} × ${q} = ${nombre(n)}.`
    return question(`division:${d}`, `${nombre(n)} ÷ ${d} ?`, q, `${nombre(n)} ÷ ${d} = ${q}`, astuce)
  },

  pourcentage(a) {
    const p = a.choix([5, 10, 15, 20, 25, 30, 40, 50, 75, 12.5])
    let n: number
    do n = a.chance(0.5) ? 20 * a.entier(2, 40) : 8 * a.entier(5, 60)
    while (!Number.isInteger((p * n) / 100))
    const r = (p * n) / 100
    const dixieme = n / 10
    const gestes: Record<number, string> = {
      5: `5 % = la moitié de 10 % : ${court(dixieme)} ÷ 2 = ${nombre(r)}.`,
      10: `10 % = ÷ 10 : ${nombre(n)} ÷ 10 = ${nombre(r)}.`,
      15: `15 % = 10 % + 5 % : ${court(dixieme)} + ${court(dixieme / 2)} = ${nombre(r)}.`,
      20: `20 % = 10 % × 2 : ${court(dixieme)} × 2 = ${nombre(r)}.`,
      25: `25 % = un quart : ${nombre(n)} ÷ 4 = ${nombre(r)}.`,
      30: `30 % = 10 % × 3 : ${court(dixieme)} × 3 = ${nombre(r)}.`,
      40: `40 % = 10 % × 4 : ${court(dixieme)} × 4 = ${nombre(r)}.`,
      50: `50 % = la moitié : ${nombre(n)} ÷ 2 = ${nombre(r)}.`,
      75: `75 % = trois quarts : ${nombre(n)} ÷ 4 × 3 = ${nombre(n / 4)} × 3 = ${nombre(r)}.`,
      12.5: `12,5 % = un huitième : ${nombre(n)} ÷ 8 = ${nombre(r)}.`,
    }
    return question(
      `pourcentage:${p}`,
      `${pc(p)} de ${nombre(n)} ?`,
      r,
      `${pc(p)} de ${nombre(n)} = ${nombre(r)}`,
      gestes[p],
      nombre(r),
      'Fractions et pourcentages',
    )
  },

  successives(a) {
    const t1 = a.choix([10, 20, 25, 50]) * (a.chance(0.5) ? 1 : -1)
    const t2 = a.choix([10, 20, 25, 50]) * (a.chance(0.5) ? 1 : -1)
    const total = ((100 + t1) * (100 + t2)) / 100 - 100
    const coef = (t: number) => court(1 + t / 100)
    const lu = variation(total)
    return {
      ...question(
        `successives:${t1}/${t2}`,
        `${variation(t1)} puis ${variation(t2)} : variation totale ?`,
        total,
        `${variation(t1)} puis ${variation(t2)} = ${lu}`,
        `Les pourcentages ne s'additionnent pas, les coefficients se multiplient : ` +
          `× ${coef(t1)} × ${coef(t2)} = × ${court(1 + total / 100, 4)} → ${lu}.`,
        lu,
        TABLE_COEFS,
      ),
      aide: 'Avec son signe (+ ou −), en %',
      saisie: 'relatif',
    }
  },
}

export const calcul: Jeu = {
  id: 'calcul',
  nom: 'Calcul mental',
  description: 'Tables, × 5, × 11, × 25, divisions, pourcentages, hausses successives.',
  seuilLentMs: 5000,
  produire: (a) => PRODUIRE[a.choix(GENRES)](a),
}
