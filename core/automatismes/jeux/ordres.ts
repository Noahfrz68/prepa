import { nombre, type Alea } from '@/core/generation/alea'
import { court } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 6 — les ordres de grandeur.
 *
 * Au TAGE MAGE, les cinq réponses proposées sont souvent assez éloignées pour
 * qu'un arrondi suffise : poser 498 × 21 est du temps perdu quand 500 × 20
 * désigne déjà la bonne. On montre un calcul et cinq valeurs ; il faut prendre
 * la plus proche, sans calculer exactement.
 */

type Genre = 'produit' | 'quotient' | 'pourcentage' | 'racine'
const GENRES: Genre[] = ['produit', 'quotient', 'pourcentage', 'racine']

/** Écarts des leurres à la bonne valeur : jamais moins de 40 %, pour qu'un arrondi tranche. */
const FACTEURS = [10, 0.1, 2, 0.5, 1.5, 1 / 1.5, 3, 1 / 3]

/** Deux chiffres significatifs : 10 458 → 10 000 ; 44,72 → 45. */
function arrondi(v: number): number {
  const p = 10 ** (Math.floor(Math.log10(v)) - 1)
  return Math.round(v / p) * p
}

/** Un nombre rond — 2 à 9 fois une puissance de dix — légèrement décalé. */
function presque(a: Alea, puissance: number): { exact: number; rond: number } {
  const rond = a.entier(2, 9) * 10 ** puissance
  const ecart = Math.max(1, Math.round(rond * 0.03))
  let exact = rond
  while (exact === rond) exact = rond + a.entier(-ecart, ecart)
  return { exact, rond }
}

/**
 * `estime` est le résultat du calcul arrondi que montre l'astuce : c'est lui
 * qui désigne la bonne proposition, pour que la correction tombe dessus. Il
 * reste à quelques pour cent de la valeur exacte, quand les leurres en sont
 * à 40 % au moins.
 */
function question(a: Alea, genre: Genre, enonce: string, exact: number, estime: number, astuce: string): Question {
  const juste = arrondi(estime)
  const leurres = a
    .melanger(FACTEURS)
    .map((f) => arrondi(juste * f))
    .filter((x, i, t) => x !== juste && t.indexOf(x) === i)
    .slice(0, 4)
  const valeurs = [juste, ...leurres].sort((x, y) => x - y)
  const choix = valeurs.map((v) => court(v, 2))
  return {
    jeu: 'ordres',
    cle: `ordre:${genre}`,
    enonce: `${enonce} ≈ ?`,
    aide: 'La plus proche, sans poser le calcul',
    attendu: { genre: 'choix', valeur: valeurs.indexOf(juste) },
    saisie: 'choix',
    choix,
    reponse: court(juste, 2),
    solution: `${enonce} ≈ ${court(juste, 2)}`,
    astuce: `${astuce} Valeur exacte : ${court(exact, 2)}.`,
  }
}

const PRODUIRE: Record<Genre, (a: Alea) => Question> = {
  produit(a) {
    const x = presque(a, a.entier(1, 2))
    const y = presque(a, 1)
    return question(
      a,
      'produit',
      `${nombre(x.exact)} × ${nombre(y.exact)}`,
      x.exact * y.exact,
      x.rond * y.rond,
      `On arrondit chaque facteur : ${nombre(x.rond)} × ${nombre(y.rond)} = ${nombre(x.rond * y.rond)}.`,
    )
  },

  quotient(a) {
    const d = presque(a, 1)
    const q = a.entier(2, 9) * 10 ** a.entier(1, 2)
    const n = d.rond * q + a.entier(-d.rond, d.rond)
    return question(
      a,
      'quotient',
      `${nombre(n)} ÷ ${nombre(d.exact)}`,
      n / d.exact,
      q,
      `On arrondit le diviseur, puis le dividende à un multiple : ${nombre(d.rond * q)} ÷ ${nombre(d.rond)} = ${nombre(q)}.`,
    )
  },

  pourcentage(a) {
    const p = a.choix([10, 20, 25, 30, 40, 50, 75])
    const pExact = p + a.choix([-0.4, -0.3, -0.2, 0.2, 0.3, 0.4])
    const n = presque(a, a.entier(2, 3))
    return question(
      a,
      'pourcentage',
      `${court(pExact, 1)} % de ${nombre(n.exact)}`,
      (pExact * n.exact) / 100,
      (p * n.rond) / 100,
      `${court(pExact, 1)} % ≈ ${p} %, et ${nombre(n.exact)} ≈ ${nombre(n.rond)} : ${p} % de ${nombre(n.rond)} = ${nombre((p * n.rond) / 100)}.`,
    )
  },

  racine(a) {
    const k = a.entier(12, 90)
    let n = k * k
    while (n === k * k) n = k * k + a.entier(-k, k)
    return question(
      a,
      'racine',
      `√${nombre(n)}`,
      Math.sqrt(n),
      k,
      `${k}² = ${nombre(k * k)}, tout près de ${nombre(n)} : la racine vaut à peu près ${k}.`,
    )
  },
}

export const ordres: Jeu = {
  id: 'ordres',
  nom: 'Ordres de grandeur',
  description: 'Choisir la bonne valeur sans poser le calcul : produits, quotients, pourcentages, racines.',
  seuilLentMs: 15000,
  produire: (a) => PRODUIRE[a.choix(GENRES)](a),
  produireCle(a, cle) {
    const [famille, genre] = cle.split(':')
    return famille === 'ordre' && GENRES.includes(genre as Genre) ? PRODUIRE[genre as Genre](a) : null
  },
}
