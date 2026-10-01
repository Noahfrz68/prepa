import { lettre, nombre, type Alea } from '@/core/generation/alea'
import type { Jeu, Question } from '../types'

/**
 * Jeu 7 — les suites, de nombres et de lettres.
 *
 * La méthode est toujours la même : écrire les écarts entre termes, puis les
 * écarts des écarts, et reconnaître la famille. Le jeu entraîne ce geste sur
 * les familles qui reviennent à l'épreuve ; la correction le refait sur la
 * suite tirée.
 */

type Genre =
  | 'arithmetique'
  | 'geometrique'
  | 'ecart_croissant'
  | 'alternee'
  | 'fibonacci'
  | 'puissances'
  | 'entrelacees'
  | 'lettres_saut'
  | 'lettres_croissant'
  | 'lettres_rebours'
  | 'lettres_alternee'

const NUMERIQUES: Genre[] = [
  'arithmetique',
  'geometrique',
  'ecart_croissant',
  'alternee',
  'fibonacci',
  'puissances',
  'entrelacees',
]
const ALPHABETIQUES: Genre[] = ['lettres_saut', 'lettres_croissant', 'lettres_rebours', 'lettres_alternee']
const GENRES = [...NUMERIQUES, ...ALPHABETIQUES]

const TABLE_LETTRES = 'Repères d’alphabet'

/** « +3, +3, −2 » */
const ecarts = (t: number[]) =>
  t
    .slice(1)
    .map((x, i) => x - t[i])
    .map((d) => (d >= 0 ? `+${nombre(d)}` : `−${nombre(-d)}`))
    .join(', ')

function numerique(genre: Genre, termes: number[], suivant: number, astuce: string): Question {
  return {
    jeu: 'suites',
    cle: `suite:${genre}`,
    enonce: `${termes.map((t) => nombre(t)).join(' ; ')} ; ?`,
    attendu: { genre: 'nombre', valeur: suivant },
    saisie: 'nombre',
    reponse: nombre(suivant),
    solution: `… ${nombre(termes.at(-1)!)} ; ${nombre(suivant)}`,
    astuce,
  }
}

function alphabetique(genre: Genre, rangs: number[], suivant: number, astuce: string): Question {
  const l = lettre(suivant)
  return {
    jeu: 'suites',
    cle: `suite:${genre}`,
    enonce: `${rangs.map(lettre).join(' ; ')} ; ?`,
    attendu: { genre: 'lettre', valeur: l },
    saisie: 'texte',
    reponse: l,
    solution: `… ${lettre(rangs.at(-1)!)} ; ${l}`,
    astuce: `En rangs : ${rangs.join(', ')}. ${astuce} → ${suivant} = ${l}.`,
    table: TABLE_LETTRES,
  }
}

const PRODUIRE: Record<Genre, (a: Alea) => Question> = {
  arithmetique(a) {
    const r = a.entier(3, 19)
    const u0 = a.entier(3, 40)
    const termes = Array.from({ length: 5 }, (_, i) => u0 + i * r)
    const s = termes[4] + r
    return numerique('arithmetique', termes, s, `Écarts : ${ecarts(termes)} — constants. ${nombre(termes[4])} + ${r} = ${nombre(s)}.`)
  },

  geometrique(a) {
    const q = a.choix([2, 3])
    const termes = [a.entier(2, 6)]
    for (let i = 1; i < 5; i++) termes.push(termes[i - 1] * q)
    const s = termes[4] * q
    return numerique(
      'geometrique',
      termes,
      s,
      `Écarts : ${ecarts(termes)} — ils grossissent, mais chaque terme est ${q === 2 ? 'le double' : 'le triple'} du précédent. ${nombre(termes[4])} × ${q} = ${nombre(s)}.`,
    )
  },

  ecart_croissant(a) {
    const d0 = a.entier(2, 6)
    const pas = a.entier(1, 4)
    const termes = [a.entier(1, 20)]
    for (let i = 1; i < 5; i++) termes.push(termes[i - 1] + d0 + (i - 1) * pas)
    const dernier = d0 + 4 * pas
    const s = termes[4] + dernier
    return numerique(
      'ecart_croissant',
      termes,
      s,
      `Écarts : ${ecarts(termes)} — ils augmentent de ${pas} à chaque fois. Écart suivant : ${dernier}, donc ${nombre(termes[4])} + ${dernier} = ${nombre(s)}.`,
    )
  },

  alternee(a) {
    const r = a.entier(2, 9)
    const termes = [a.entier(2, 9)]
    for (let i = 1; i < 5; i++) termes.push(i % 2 === 1 ? termes[i - 1] + r : termes[i - 1] * 2)
    // Après 5 termes (+r, ×2, +r, ×2), le suivant est un « +r ».
    const s = termes[4] + r
    return numerique(
      'alternee',
      termes,
      s,
      `Deux opérations en alternance : +${r}, puis × 2. La dernière était × 2, donc +${r} : ${nombre(termes[4])} + ${r} = ${nombre(s)}.`,
    )
  },

  fibonacci(a) {
    const termes = [a.entier(1, 9), a.entier(2, 12)]
    for (let i = 2; i < 5; i++) termes.push(termes[i - 1] + termes[i - 2])
    const s = termes[3] + termes[4]
    return numerique(
      'fibonacci',
      termes,
      s,
      `Chaque terme est la somme des deux précédents (${nombre(termes[0])} + ${nombre(termes[1])} = ${nombre(termes[2])}…) : ${nombre(termes[3])} + ${nombre(termes[4])} = ${nombre(s)}.`,
    )
  },

  puissances(a) {
    const cubes = a.chance(0.35)
    const b = cubes ? a.entier(1, 5) : a.entier(2, 12)
    const e = cubes ? 3 : 2
    const termes = Array.from({ length: 5 }, (_, i) => (b + i) ** e)
    const s = (b + 5) ** e
    return numerique(
      'puissances',
      termes,
      s,
      cubes
        ? `Ce sont des cubes : ${b}³, ${b + 1}³… Le suivant est ${b + 5}³ = ${nombre(s)}.`
        : `Écarts : ${ecarts(termes)} — ils augmentent de 2 : ce sont des carrés, ${b}², ${b + 1}²… Le suivant est ${b + 5}² = ${nombre(s)}.`,
    )
  },

  entrelacees(a) {
    const [x0, y0] = [a.entier(1, 20), a.entier(30, 60)]
    const [rx, ry] = [a.entier(2, 9), -a.entier(2, 6)]
    const termes = [x0, y0, x0 + rx, y0 + ry, x0 + 2 * rx]
    const s = y0 + 2 * ry
    return numerique(
      'entrelacees',
      termes,
      s,
      `Deux suites entrelacées, un terme sur deux : ${nombre(x0)}, ${nombre(x0 + rx)}, ${nombre(x0 + 2 * rx)} (+${rx}) et ${nombre(y0)}, ${nombre(y0 + ry)} (−${-ry}). Le suivant est dans la seconde : ${nombre(y0 + ry)} − ${-ry} = ${nombre(s)}.`,
    )
  },

  lettres_saut(a) {
    const p = a.entier(2, 5)
    const debut = a.entier(1, 26 - 5 * p)
    const rangs = Array.from({ length: 5 }, (_, i) => debut + i * p)
    return alphabetique('lettres_saut', rangs, debut + 5 * p, `On avance de ${p} à chaque fois`)
  },

  lettres_croissant(a) {
    const debut = a.entier(1, 10)
    const rangs = [debut]
    for (let i = 1; i < 5; i++) rangs.push(rangs[i - 1] + i)
    return alphabetique('lettres_croissant', rangs, rangs[4] + 5, 'Les sauts valent 1, 2, 3, 4 : le suivant vaut 5')
  },

  lettres_rebours(a) {
    const p = a.entier(1, 4)
    const debut = a.entier(6 * p + 1, 26)
    const rangs = Array.from({ length: 5 }, (_, i) => debut - i * p)
    return alphabetique('lettres_rebours', rangs, debut - 5 * p, `On recule de ${p} à chaque fois`)
  },

  lettres_alternee(a) {
    const x = a.entier(1, 3)
    let y = a.entier(2, 4)
    while (y === x) y = a.entier(2, 4)
    const debut = a.entier(1, 26 - (3 * x + 3 * y))
    const rangs = [debut]
    for (let i = 1; i < 5; i++) rangs.push(rangs[i - 1] + (i % 2 === 1 ? x : y))
    // Sauts +x, +y, +x, +y : le suivant est un +x.
    return alphabetique(
      'lettres_alternee',
      rangs,
      rangs[4] + x,
      `Deux sauts en alternance, +${x} puis +${y} ; le dernier était +${y}, donc +${x}`,
    )
  },
}

export const suites: Jeu = {
  id: 'suites',
  nom: 'Suites logiques',
  description: 'Le terme suivant : écarts constants ou croissants, alternances, Fibonacci, carrés, lettres.',
  seuilLentMs: 15000,
  // Les suites numériques sont plus variées : elles reviennent un peu plus souvent.
  produire: (a) => PRODUIRE[a.chance(0.65) ? a.choix(NUMERIQUES) : a.choix(ALPHABETIQUES)](a),
  produireCle(a, cle) {
    const [famille, genre] = cle.split(':')
    return famille === 'suite' && GENRES.includes(genre as Genre) ? PRODUIRE[genre as Genre](a) : null
  },
}
