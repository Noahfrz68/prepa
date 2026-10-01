import { nombre } from '@/core/generation/alea'
import { exposant } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 2 — carrés (1 à 30), cubes (1 à 12), puissances de 2 (jusqu'à 2¹²).
 *
 * Dans les deux sens : savoir que 17² = 289 ne suffit pas, il faut aussi
 * reconnaître 289 dans une suite ou sous une racine. Les deux sens sont deux
 * faits distincts (`carre:17`, `racine:17`), répétés séparément.
 */

const TABLE = 'Carrés, cubes et racines'

/**
 * Le geste pour retrouver n² sans poser : n² = (n − r)(n + r) + r², avec r la
 * distance à la dizaine la plus proche. 17² = 20 × 14 + 3² = 280 + 9.
 */
function astuceCarre(n: number): string {
  if (n <= 10) return `Table de multiplication : ${n} × ${n} = ${n * n}.`
  if (n % 10 === 5) {
    const d = (n - 5) / 10
    return `Finit par 5 : ${d} × ${d + 1} = ${d * (d + 1)}, suivi de 25 → ${nombre(n * n)}.`
  }
  if (n % 10 === 0) return `${n / 10}² = ${(n / 10) ** 2}, suivi de deux zéros → ${nombre(n * n)}.`
  const haut = Math.ceil(n / 10) * 10
  const bas = Math.floor(n / 10) * 10
  const r = haut - n <= n - bas ? haut - n : n - bas
  const rond = haut - n <= n - bas ? haut : bas
  const autre = 2 * n - rond
  return `(n − r)(n + r) + r² : ${rond} × ${autre} + ${r}² = ${nombre(rond * autre)} + ${r * r} = ${nombre(n * n)}.`
}

/**
 * Retrouver n depuis n² : la dizaine se lit entre deux carrés ronds, le
 * dernier chiffre laisse deux candidats, et le carré de « …5 » tranche.
 * 361 : entre 10² et 20², finit par 1 → 11 ou 19 ; 15² = 225 < 361 → 19.
 */
function astuceRacine(n: number): string {
  const c = n * n
  const d = Math.floor(n / 10)
  const candidats = [1, 2, 3, 4, 6, 7, 8, 9].filter((u) => (u * u) % 10 === c % 10).map((u) => 10 * d + u)
  const milieu = 10 * d + 5
  return (
    `Entre ${nombre((10 * d) ** 2)} et ${nombre((10 * d + 10) ** 2)} : la racine est entre ${10 * d} et ${10 * d + 10}. ` +
    `${nombre(c)} finit par ${c % 10} → ${candidats.join(' ou ')}. ` +
    `${milieu}² = ${nombre(milieu * milieu)} ${c < milieu * milieu ? '>' : '<'} ${nombre(c)} → ${n}.`
  )
}

type Genre = 'carre' | 'racine' | 'cube' | 'racine3' | 'deux' | 'log2'

/** Bornes de n pour chaque genre. */
const BORNES: Record<Genre, [number, number]> = {
  carre: [1, 30],
  racine: [1, 30],
  cube: [1, 12],
  racine3: [1, 12],
  deux: [1, 12],
  log2: [1, 12],
}

export const puissances: Jeu = {
  id: 'puissances',
  nom: 'Carrés, cubes, puissances',
  description: 'Carrés jusqu’à 30, cubes jusqu’à 12, puissances de 2 — dans les deux sens.',
  seuilLentMs: 5000,
  produire(a): Question {
    const genre = a.entier(0, 9)
    const direct = a.chance(0.5)
    if (genre <= 4) {
      // Les carrés de 1 à 10 sont des tables : on les tire moins souvent.
      const n = a.chance(0.2) ? a.entier(2, 10) : a.entier(11, 30)
      return question(direct ? 'carre' : 'racine', n)
    }
    if (genre <= 7) return question(direct ? 'cube' : 'racine3', a.entier(2, 12))
    return question(direct ? 'deux' : 'log2', a.entier(1, 12))
  },
  produireCle(_a, cle) {
    const [genre, param] = cle.split(':')
    const n = Number(param)
    const bornes = BORNES[genre as Genre]
    if (!bornes || !Number.isInteger(n) || n < bornes[0] || n > bornes[1]) return null
    return question(genre as Genre, n)
  },
}

function question(genre: Genre, n: number): Question {
  if (genre === 'carre' || genre === 'racine') {
    const c = n * n
    return genre === 'carre'
      ? {
          jeu: 'puissances',
          cle: `carre:${n}`,
          enonce: `${n}² ?`,
          attendu: { genre: 'nombre', valeur: c },
          saisie: 'nombre',
          reponse: nombre(c),
          solution: `${n}² = ${nombre(c)}`,
          astuce: astuceCarre(n),
          table: TABLE,
        }
      : {
          jeu: 'puissances',
          cle: `racine:${n}`,
          enonce: `${nombre(c)} est le carré de ?`,
          attendu: { genre: 'nombre', valeur: n },
          saisie: 'nombre',
          reponse: String(n),
          solution: `${nombre(c)} = ${n}²`,
          astuce: n > 10 && n % 5 !== 0 ? astuceRacine(n) : astuceCarre(n),
          table: TABLE,
        }
  }

  if (genre === 'cube' || genre === 'racine3') {
    const c = n ** 3
    const astuce = `${n}³ = ${n}² × ${n} = ${n * n} × ${n} = ${nombre(c)}.`
    return genre === 'cube'
      ? {
          jeu: 'puissances',
          cle: `cube:${n}`,
          enonce: `${n}³ ?`,
          attendu: { genre: 'nombre', valeur: c },
          saisie: 'nombre',
          reponse: nombre(c),
          solution: `${n}³ = ${nombre(c)}`,
          astuce,
          table: TABLE,
        }
      : {
          jeu: 'puissances',
          cle: `racine3:${n}`,
          enonce: `${nombre(c)} est le cube de ?`,
          attendu: { genre: 'nombre', valeur: n },
          saisie: 'nombre',
          reponse: String(n),
          solution: `${nombre(c)} = ${n}³`,
          astuce,
          table: TABLE,
        }
  }

  const p = 2 ** n
  const astuce =
    n >= 10
      ? `2¹⁰ = 1 024, puis on double : 2${exposant(n)} = ${nombre(p)}.`
      : `On double depuis 2 : 2, 4, 8, 16, 32, 64, 128, 256, 512 → 2${exposant(n)} = ${nombre(p)}.`
  return genre === 'deux'
    ? {
        jeu: 'puissances',
        cle: `deux:${n}`,
        enonce: `2${exposant(n)} ?`,
        attendu: { genre: 'nombre', valeur: p },
        saisie: 'nombre',
        reponse: nombre(p),
        solution: `2${exposant(n)} = ${nombre(p)}`,
        astuce,
        table: TABLE,
      }
    : {
        jeu: 'puissances',
        cle: `log2:${n}`,
        enonce: `${nombre(p)} = 2 puissance ?`,
        attendu: { genre: 'nombre', valeur: n },
        saisie: 'nombre',
        reponse: String(n),
        solution: `${nombre(p)} = 2${exposant(n)}`,
        astuce,
        table: TABLE,
      }
}
