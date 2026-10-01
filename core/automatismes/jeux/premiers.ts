import { nombre, type Alea } from '@/core/generation/alea'
import { estPremier, sommeChiffres } from '@/core/generation/logique/outils'
import { exposant } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 4 — nombres premiers et divisibilité.
 *
 * Reconnaître un premier jusqu'à 100, tester une divisibilité sans poser la
 * division, décomposer : c'est ce qui rend rapides l'arithmétique, les
 * fractions à simplifier et les intrus numériques. Les composés tirés sont
 * surtout les pièges — impairs, sans 5 final, qui « ont l'air » premiers.
 */

const TABLE = 'Divisibilité, de tête'

/** Impairs de 11 à 99 qui ne finissent pas par 5 : les seuls qui demandent réflexion. */
const CANDIDATS = Array.from({ length: 89 }, (_, i) => i + 11).filter((n) => n % 2 === 1 && n % 5 !== 0)
const PREMIERS = CANDIDATS.filter(estPremier)
const PIEGES = CANDIDATS.filter((n) => !estPremier(n))

function plusPetitDiviseur(n: number): number {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d
  return n
}

function premier(a: Alea): Question {
  const n = a.chance(0.5) ? a.choix(PREMIERS) : a.choix(PIEGES)
  const oui = estPremier(n)
  const p = plusPetitDiviseur(n)
  const limite = Math.floor(Math.sqrt(n))
  const testes = [2, 3, 5, 7].filter((d) => d <= limite)
  const astuce = oui
    ? `On ne teste que les premiers jusqu'à √${n} ≈ ${limite} : ${testes.join(', ')}. Aucun ne divise ${n}, il est premier.`
    : p === 3
      ? `Somme des chiffres = ${sommeChiffres(n)}, multiple de 3 : ${n} = 3 × ${n / 3}.`
      : `${n} = ${p} × ${n / p}. Le piège classique : impair, ne finit pas par 5, pas multiple de 3.`
  return {
    jeu: 'premiers',
    cle: `premier:${n}`,
    enonce: `${n} est-il premier ?`,
    attendu: { genre: 'ouinon', valeur: oui },
    saisie: 'ouinon',
    reponse: oui ? 'oui' : 'non',
    solution: oui ? `${n} est premier` : `${n} = ${p} × ${n / p}`,
    astuce,
    table: TABLE,
  }
}

/** Le critère du diviseur, appliqué au nombre tiré. */
function critere(n: number, d: number): string {
  const s = String(n)
  const oui = n % d === 0
  const verdict = oui ? `→ divisible par ${d}.` : `→ pas divisible par ${d}.`
  switch (d) {
    case 2:
      return `Dernier chiffre ${s.at(-1)}, ${oui ? 'pair' : 'impair'} ${verdict}`
    case 5:
      return `Divisible par 5 ssi le nombre finit par 0 ou 5 : il finit par ${s.at(-1)} ${verdict}`
    case 25:
      return `Divisible par 25 ssi il finit par 00, 25, 50 ou 75 : il finit par ${s.slice(-2)} ${verdict}`
    case 3:
    case 9:
      return `Somme des chiffres : ${[...s].join(' + ')} = ${sommeChiffres(n)}, ${oui ? '' : 'pas '}multiple de ${d} ${verdict}`
    case 4:
      return `Les deux derniers chiffres : ${Number(s.slice(-2))}, ${oui ? '' : 'pas '}multiple de 4 ${verdict}`
    case 8:
      return `Les trois derniers chiffres : ${Number(s.slice(-3))}, ${oui ? '' : 'pas '}multiple de 8 ${verdict}`
    case 6: {
      const pair = n % 2 === 0
      const trois = sommeChiffres(n) % 3 === 0
      return (
        `Divisible par 6 = pair ET divisible par 3. ${pair ? 'Pair' : 'Impair'} ; somme des chiffres ${sommeChiffres(n)}, ` +
        `${trois ? '' : 'pas '}multiple de 3 ${verdict}`
      )
    }
    case 11: {
      const termes = [...s].map(Number)
      const alternee = termes.reduce((acc, c, i) => (i % 2 === 0 ? acc + c : acc - c), 0)
      const ecrit = termes.map((c, i) => (i === 0 ? `${c}` : i % 2 === 0 ? `+ ${c}` : `− ${c}`)).join(' ')
      return `Somme alternée : ${ecrit} = ${alternee}, ${oui ? '' : 'pas '}multiple de 11 ${verdict}`
    }
  }
  return verdict
}

function divisibilite(a: Alea): Question {
  const d = a.choix([2, 3, 3, 4, 4, 5, 6, 6, 8, 8, 9, 9, 11, 11, 25])
  const oui = a.chance(0.5)
  let n: number
  do {
    n = d * a.entier(Math.ceil(100 / d), Math.floor(9999 / d))
    if (!oui) n += a.entier(1, d - 1)
  } while (n > 9999)
  return {
    jeu: 'premiers',
    cle: `divisible:${d}`,
    enonce: `${nombre(n)} est-il divisible par ${d} ?`,
    attendu: { genre: 'ouinon', valeur: oui },
    saisie: 'ouinon',
    reponse: oui ? 'oui' : 'non',
    solution: oui ? `${nombre(n)} = ${d} × ${nombre(n / d)}` : `${nombre(n)} n'est pas divisible par ${d}`,
    astuce: critere(n, d),
    table: TABLE,
  }
}

/** « 2³ × 3² × 5 » */
export function ecrireFacteurs(n: number): string {
  const morceaux: string[] = []
  let reste = n
  for (let p = 2; reste > 1; p++) {
    let e = 0
    while (reste % p === 0) {
      reste /= p
      e++
    }
    if (e > 0) morceaux.push(e === 1 ? String(p) : `${p}${exposant(e)}`)
  }
  return morceaux.join(' × ')
}

function decomposition(a: Alea): Question {
  let n: number
  let facteurs: number[]
  do {
    facteurs = Array.from({ length: a.entier(3, 6) }, () => a.choix([2, 2, 2, 3, 3, 5, 7, 11, 13]))
    n = facteurs.reduce((p, f) => p * f, 1)
  } while (n < 60 || n > 1000)
  facteurs.sort((x, y) => x - y)
  let reste = n
  const etapes = facteurs.map((f) => {
    reste /= f
    return `÷ ${f} = ${nombre(reste)}`
  })
  const ecrit = ecrireFacteurs(n)
  return {
    jeu: 'premiers',
    cle: 'decomposition',
    enonce: `Décomposer ${nombre(n)} en facteurs premiers`,
    aide: 'Par exemple 2^3 × 7, ou 2 2 2 7',
    attendu: { genre: 'facteurs', valeur: n },
    saisie: 'texte',
    reponse: ecrit,
    solution: `${nombre(n)} = ${ecrit}`,
    astuce: `On divise par le plus petit premier tant qu'on peut, puis le suivant : ${nombre(n)} ${etapes.join(', ')}.`,
    table: TABLE,
    // Plusieurs divisions à enchaîner : le seuil des questions longues.
    lentMs: 15000,
  }
}

export const premiers: Jeu = {
  id: 'premiers',
  nom: 'Premiers et divisibilité',
  description: 'Premiers jusqu’à 100, critères de divisibilité, décompositions.',
  seuilLentMs: 5000,
  produire(a) {
    const genre = a.entier(0, 9)
    if (genre <= 3) return premier(a)
    if (genre <= 7) return divisibilite(a)
    return decomposition(a)
  },
}
