import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import { ATOMES, FAMILLES_ENIGMES, JOURS, MOIS, permutations } from './raisonnement-enigmes'
import type { QuestionGeneree } from './types'

/**
 * Chaque énigme refaite à partir de son TEXTE seul : on relit l'énoncé et les
 * propositions avec des expressions régulières, on énumère tous les cas à la
 * main, et l'on vérifie qu'exactement une proposition a le statut demandé —
 * celle que la famille a marquée juste. Rien ne passe par le code des familles,
 * sinon une erreur de sens y serait recopiée à l'identique.
 */

type Sens<M> = (m: M) => boolean
const famille = (nom: string) => FAMILLES_ENIGMES.find((f) => f.nom === nom)!
const lignes = (q: QuestionGeneree) => q.enonce.split('\n')
const juste = (q: QuestionGeneree) => q.options['ABCDE'.indexOf(q.bonneReponse)]

/** Les propositions qui ont le statut demandé dans tous les cas compatibles. */
function retenues<M>(q: QuestionGeneree, cas: M[], lire: (t: string) => Sens<M>): string[] {
  const fausse = q.enonce.includes('nécessairement fausse')
  expect(cas.length, q.enonce).toBeGreaterThan(0)
  return q.options.filter((o) => {
    const s = lire(o)
    return fausse ? !cas.some(s) : cas.every(s)
  })
}

function produire(nom: string, graine: number, n: number) {
  const a = aleaDepuis(graine)
  return Array.from({ length: n }, () => famille(nom).produire(a))
}

const ORD = ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième']
const NOM = '([A-ZÉ][a-zéèë]+)'
const que = `(?:que |qu’)${NOM}`

function noms(q: QuestionGeneree): string[] {
  const m = /— (.+) —/.exec(q.enonce)!
  return m[1].replace(' et ', ', ').split(', ')
}

/* ---- classement et rangée : la place de chaque personne ---- */

function lireClassement(n: string[]): (t: string) => Sens<number[]> {
  const i = (x: string) => n.indexOf(x)
  const regles: Array<[RegExp, (r: string[]) => Sens<number[]>]> = [
    [new RegExp(`^${NOM} a franchi la ligne avant ${NOM}\\.$`), ([, x, y]) => (m) => m[i(x)] < m[i(y)]],
    [new RegExp(`^${NOM} gagne plus ${que}\\.$`), ([, x, y]) => (m) => m[i(x)] < m[i(y)]],
    [new RegExp(`^${NOM} a franchi la ligne après ${NOM} mais avant ${NOM}\\.$`), ([, x, y, z]) => (m) => m[i(y)] < m[i(x)] && m[i(x)] < m[i(z)]],
    [new RegExp(`^${NOM} gagne moins ${que} mais plus ${que}\\.$`), ([, x, y, z]) => (m) => m[i(y)] < m[i(x)] && m[i(x)] < m[i(z)]],
    [new RegExp(`^${NOM} a franchi la ligne juste avant ${NOM}\\.$`), ([, x, y]) => (m) => m[i(y)] === m[i(x)] + 1],
    [new RegExp(`^Dans l’ordre des salaires, ${NOM} vient juste après ${NOM}\\.$`), ([, y, x]) => (m) => m[i(y)] === m[i(x)] + 1],
    [new RegExp(`^${NOM} (a gagné la course|a le salaire le plus élevé)\\.$`), ([, x]) => (m) => m[i(x)] === 0],
    [new RegExp(`^${NOM} (a franchi la ligne en dernier|a le salaire le plus bas)\\.$`), ([, x]) => (m) => m[i(x)] === 4],
    [new RegExp(`^${NOM} n’a ni (gagné la course ni franchi la ligne en dernier|le salaire le plus élevé ni le plus bas)\\.$`), ([, x]) => (m) => m[i(x)] > 0 && m[i(x)] < 4],
    [new RegExp(`^${NOM} a terminé à la (\\S+) place\\.$`), ([, x, k]) => (m) => m[i(x)] === ORD.indexOf(k)],
    [new RegExp(`^${NOM} a le (\\S+) salaire le plus élevé\\.$`), ([, x, k]) => (m) => m[i(x)] === ORD.indexOf(k.replace('premier', 'première'))],
  ]
  return (t) => {
    for (const [re, f] of regles) {
      const r = re.exec(t)
      if (r) return f(r)
    }
    throw new Error(`Phrase de classement inconnue : ${t}`)
  }
}

function lireRangee(n: string[]): (t: string) => Sens<number[]> {
  const i = (x: string) => n.indexOf(x)
  const de = `(?:de |d')${NOM}`
  const regles: Array<[RegExp, (r: string[]) => Sens<number[]>]> = [
    [new RegExp(`^La place ${de} est à gauche de celle ${de}\\.$`), ([, x, y]) => (m) => m[i(x)] < m[i(y)]],
    [new RegExp(`^${NOM} et ${NOM} occupent deux places voisines\\.$`), ([, x, y]) => (m) => Math.abs(m[i(x)] - m[i(y)]) === 1],
    [new RegExp(`^${NOM} et ${NOM} n’occupent pas deux places voisines\\.$`), ([, x, y]) => (m) => Math.abs(m[i(x)] - m[i(y)]) !== 1],
    [
      new RegExp(`^La place ${de} est située entre celle ${de} et celle ${de}\\.$`),
      ([, x, y, z]) => (m) => (m[i(y)] < m[i(x)] && m[i(x)] < m[i(z)]) || (m[i(z)] < m[i(x)] && m[i(x)] < m[i(y)]),
    ],
    [new RegExp(`^${NOM} occupe une place au bout de la rangée\\.$`), ([, x]) => (m) => m[i(x)] === 0 || m[i(x)] === 4],
    [new RegExp(`^${NOM} n’occupe aucune des deux places du bout\\.$`), ([, x]) => (m) => m[i(x)] !== 0 && m[i(x)] !== 4],
    [new RegExp(`^${NOM} occupe la place (\\d)\\.$`), ([, x, k]) => (m) => m[i(x)] === Number(k) - 1],
    [new RegExp(`^${NOM} n’occupe pas la place (\\d)\\.$`), ([, x, k]) => (m) => m[i(x)] !== Number(k) - 1],
  ]
  return (t) => {
    for (const [re, f] of regles) {
      const r = re.exec(t)
      if (r) return f(r)
    }
    throw new Error(`Phrase de rangée inconnue : ${t}`)
  }
}

describe('énigmes — classement et rangée', () => {
  it.each([
    ['classement', lireClassement],
    ['places dans une rangée', lireRangee],
  ] as const)('%s : une seule proposition a le statut demandé, et c’est la bonne', (nom, lecteur) => {
    for (const q of produire(nom, 11, 300)) {
      const n = noms(q)
      const lire = lecteur(n)
      const premisses = lignes(q).slice(1, -1).map(lire)
      // Mêmes cas que la famille, mais énumérés indépendamment : toutes les façons de placer cinq personnes.
      const cas = permutations(5).filter((m) => premisses.every((p) => p(m)))
      expect(cas.length, q.enonce).toBeGreaterThanOrEqual(2)
      expect(retenues(q, cas, lire), `${q.enonce}\n${q.options.join('\n')}`).toEqual([juste(q)])
    }
  })

  it('les deux consignes sont posées', () => {
    const qs = produire('classement', 3, 200)
    expect(qs.some((q) => q.enonce.includes('nécessairement fausse'))).toBe(true)
    expect(qs.some((q) => q.enonce.includes('nécessairement vraie'))).toBe(true)
  })
})

/* ---- chaîne de conditions ---- */

function lireLitteral(t: string): [number, boolean] {
  const x = t.replace(/\.$/, '')
  for (let k = 0; k < ATOMES.length; k++) {
    for (const [j, forme] of ATOMES[k].entries()) {
      if (x === forme || x === forme.charAt(0).toUpperCase() + forme.slice(1)) return [k, j === 0]
    }
  }
  throw new Error(`Affirmation inconnue : ${t}`)
}

function lireCondition(t: string): Sens<number> {
  const vaut = (m: number, [k, oui]: [number, boolean]) => (((m >> k) & 1) === 1) === oui
  let r = /^(?:— )?Si (.+), alors (.+)\.$/.exec(t)
  if (r) {
    const [p, q] = [lireLitteral(r[1]), lireLitteral(r[2])]
    return (m) => !vaut(m, p) || vaut(m, q)
  }
  r = /^(?:— )?(.+), ou bien (.+) \(ou les deux\)\.$/.exec(t)
  if (r) {
    const [p, q] = [lireLitteral(r[1]), lireLitteral(r[2])]
    return (m) => vaut(m, p) || vaut(m, q)
  }
  r = /^On constate par ailleurs (?:que |qu’)(.+)$/.exec(t)
  const l = lireLitteral(r ? r[1] : t)
  return (m) => vaut(m, l)
}

describe('énigmes — chaîne de conditions', () => {
  const qs = produire('chaîne de conditions', 21, 300)

  it('une seule proposition a le statut demandé, et c’est la bonne', () => {
    for (const q of qs) {
      const premisses = lignes(q).slice(1, -1).map(lireCondition)
      const cas = Array.from({ length: 1 << ATOMES.length }, (_, m) => m).filter((m) => premisses.every((p) => p(m)))
      expect(retenues(q, cas, lireCondition), `${q.enonce}\n${q.options.join('\n')}`).toEqual([juste(q)])
    }
  })

  it('ne propose que des affirmations dont l’énoncé parle', () => {
    for (const q of qs) {
      const cites = new Set(lignes(q).slice(1, -1).flatMap((l) => ATOMES.flatMap((at, k) => (at.some((f) => l.toLowerCase().includes(f.toLowerCase())) ? [k] : []))))
      for (const o of q.options) {
        const dans = ATOMES.flatMap((at, k) => (at.some((f) => o.toLowerCase().includes(f.toLowerCase())) ? [k] : []))
        for (const k of dans) expect(cites.has(k), `${q.enonce}\n→ ${o}`).toBe(true)
      }
    }
  })
})

/* ---- Véridiques et Fourbes ---- */

function lireDeclaration(t: string, n: string[], s: number): Sens<number> {
  const f = (m: number, x: string) => ((m >> n.indexOf(x)) & 1) === 1
  const moi = (m: number) => ((m >> s) & 1) === 1
  const nb = (m: number) => [0, 1, 2].filter((i) => (m >> i) & 1).length
  let r: RegExpExecArray | null
  if ((r = new RegExp(`^${NOM} appartient au clan des Fourbes\\.$`).exec(t))) return (m) => f(m, r![1])
  if ((r = new RegExp(`^${NOM} appartient au clan des Véridiques\\.$`).exec(t))) return (m) => !f(m, r![1])
  if ((r = new RegExp(`^${NOM} et moi appartenons au même clan\\.$`).exec(t))) return (m) => f(m, r![1]) === moi(m)
  if ((r = new RegExp(`^${NOM} et moi appartenons à des clans différents\\.$`).exec(t))) return (m) => f(m, r![1]) !== moi(m)
  if ((r = new RegExp(`^${NOM} et ${NOM} appartiennent au même clan\\.$`).exec(t))) return (m) => f(m, r![1]) === f(m, r![2])
  if ((r = new RegExp(`^${NOM} et ${NOM} appartiennent à des clans différents\\.$`).exec(t))) return (m) => f(m, r![1]) !== f(m, r![2])
  if (t === 'Exactement un de nous trois appartient au clan des Fourbes.') return (m) => nb(m) === 1
  if (t === 'Exactement deux de nous trois appartiennent au clan des Fourbes.') return (m) => nb(m) === 2
  if (t === 'Au moins l’un de nous trois appartient au clan des Fourbes.') return (m) => nb(m) >= 1
  if (t === 'Nous appartenons tous les trois au clan des Fourbes.') return (m) => nb(m) === 3
  throw new Error(`Déclaration inconnue : ${t}`)
}

function lireRepartition(o: string, n: string[]): number {
  if (o === 'Aucun des trois') return 0
  if (o === 'Les trois') return 7
  return o
    .replace(' seulement', '')
    .split(' et ')
    .reduce((m, x) => m | (1 << n.indexOf(x)), 0)
}

describe('énigmes — Véridiques et Fourbes', () => {
  it('la répartition marquée juste est la seule qui tienne', () => {
    for (const q of produire('Véridiques et Fourbes', 31, 300)) {
      const n = /trois habitants, (\S+), (\S+) et (\S+)\./.exec(q.enonce)!.slice(1)
      const dits = lignes(q)
        .filter((l) => l.includes(' déclare : '))
        .map((l) => {
          const [, qui, t] = /^(\S+) déclare : « (.+) »$/.exec(l)!
          const s = n.indexOf(qui)
          const sens = lireDeclaration(t, n, s)
          return (m: number) => sens(m) === (((m >> s) & 1) === 0)
        })
      const tiennent = [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => dits.every((d) => d(m)))
      expect(tiennent, q.enonce).toHaveLength(1)
      expect(q.options.map((o) => lireRepartition(o, n)).filter((m) => m === tiennent[0]), q.enonce).toHaveLength(1)
      expect(lireRepartition(juste(q), n), `${q.enonce}\n${q.options.join(' / ')}`).toBe(tiennent[0])
    }
  })
})

/* ---- calendrier ---- */

describe('énigmes — calendrier', () => {
  it('le jour marqué juste est le bon, recompté avec le calendrier du système', () => {
    const j = (nom: string) => JOURS.indexOf(nom.toLowerCase())
    for (const q of produire('calendrier', 41, 400)) {
      let attendu: number
      let r = /^Avant-hier, nous étions (\S+)\. .* dans (\d+) jours/.exec(q.enonce)
      if (r) attendu = (j(r[1]) + 2 + Number(r[2])) % 7
      else if ((r = /^Dans (\d+) jours, nous serons le surlendemain d’un (\S+)\. .*hier/.exec(q.enonce))) {
        attendu = (((j(r[2]) + 2 - Number(r[1]) - 1) % 7) + 7) % 7
      } else {
        r = /le (\d+)(?:er)? (\S+) est un (\S+)\. .* le (\d+)(?:er)? (\S+) de la même année/.exec(q.enonce)!
        const mois = (nom: string) => MOIS.findIndex(([x]) => x === nom)
        // 2023 n'est pas bissextile : Date compte les jours à notre place.
        const d1 = Date.UTC(2023, mois(r[2]), Number(r[1]))
        const d2 = Date.UTC(2023, mois(r[5]), Number(r[4]))
        attendu = (j(r[3]) + (d2 - d1) / 86_400_000) % 7
      }
      expect(j(juste(q)), q.enonce).toBe(attendu)
      expect(new Set(q.options).size).toBe(5)
    }
  })
})

/* ---- sous-groupes qui se recoupent ---- */

describe('énigmes — sous-groupes qui se recoupent', () => {
  it('une seule proposition est certaine, et c’est la bonne', () => {
    for (const q of produire('sous-groupes qui se recoupent', 51, 300)) {
      const pct = q.enonce.includes('%')
      const N = pct ? 100 : Number(/ (\d+) (?:élèves|salariés|clients|adhérents)/.exec(q.enonce)![1])
      const [na, nb] = [...q.enonce.matchAll(/(\d+)(?: %)? (?:font|parlent|ont acheté|pratiquent)/g)].map((m) => Number(m[1]))
      // Tous les effectifs possibles des quatre cases du diagramme.
      const cas: Array<{ deux: number; aucun: number }> = []
      for (let deux = 0; deux <= N; deux++) {
        const aucun = N - na - nb + deux
        if (na - deux >= 0 && nb - deux >= 0 && aucun >= 0) cas.push({ deux, aucun })
      }
      const lire = (o: string): Sens<{ deux: number; aucun: number }> => {
        const k = Number(/\d+/.exec(o)?.[0])
        const surDeux = o.includes('à la fois')
        const v = (c: { deux: number; aucun: number }) => (surDeux ? c.deux : c.aucun)
        if (o.startsWith('Chaque ')) return (c) => c.aucun === 0
        if (o.startsWith('Au moins')) return (c) => v(c) >= k
        if (o.startsWith('Au plus')) return (c) => v(c) <= k
        if (o.startsWith('Exactement')) return (c) => v(c) === k
        throw new Error(o)
      }
      expect(retenues(q, cas, lire), `${q.enonce}\n${q.options.join('\n')}`).toEqual([juste(q)])
    }
  })
})

/* ---- écriture ---- */

describe('énigmes — écriture', () => {
  it('écrit des énoncés et des corrections propres', () => {
    for (const f of FAMILLES_ENIGMES) {
      for (const q of produire(f.nom, 61, 100)) {
        for (const t of [q.enonce, q.explication, q.rappel!, ...q.options, ...Object.values(q.diagnostics ?? {})]) {
          expect(t, f.nom).not.toMatch(/undefined|NaN|\bde [AEIOUÉ]|\bque [AEIOUÉ]|\b[01] (élèves|salariés|clients|adhérents|personnes)\b/)
        }
        expect(new Set(q.options).size, q.enonce).toBe(5)
        expect(q.difficulte).toBe(5)
        expect(q.explication.length, q.explication).toBeLessThan(2400)
      }
    }
  })

  it('chaque mauvaise proposition porte la raison qui l’écarte', () => {
    for (const f of FAMILLES_ENIGMES.filter((x) => x.nom !== 'calendrier')) {
      for (const q of produire(f.nom, 71, 100)) {
        expect(Object.keys(q.diagnostics ?? {}).sort(), `${f.nom} · ${q.enonce}`).toEqual(
          ['A', 'B', 'C', 'D', 'E'].filter((l) => l !== q.bonneReponse),
        )
      }
    }
  })
})
