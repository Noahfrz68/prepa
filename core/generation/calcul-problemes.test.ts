import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import { FAMILLES_PROBLEMES } from './calcul-problemes'
import type { QuestionGeneree } from './types'

/** Les espaces qui séparent les milliers : normale, insécable, fine insécable. */
const MILLIERS = /[   ]/g

/** Les nombres d'un texte, écrits à la française (« 33 000 », « 7,5 », « −244 », « 2007 »). */
function nombres(t: string): number[] {
  return [...t.matchAll(/[−-]?\d+(?:[   ]\d{3})*(?:,\d+)?/g)].map((m) =>
    Number(m[0].replace(MILLIERS, '').replace('−', '-').replace(',', '.')),
  )
}

/** La valeur d'une proposition : « 4,0 % » → 4, « 2 h 30 » → 2,5. */
function valeur(o: string): number {
  const hm = /^(\d+) h(?: (\d+))?$/.exec(o)
  if (hm) return Number(hm[1]) + Number(hm[2] ?? 0) / 60
  return nombres(o)[0]
}

const valeurJuste = (q: QuestionGeneree) => valeur(q.options['ABCDE'.indexOf(q.bonneReponse)])

const FRACTIONS: Record<string, number> = {
  'la moitié': 1 / 2, 'le tiers': 1 / 3, 'le quart': 1 / 4, 'le cinquième': 1 / 5, 'le sixième': 1 / 6,
  'le neuvième': 1 / 9, 'le dixième': 1 / 10, 'les deux cinquièmes': 2 / 5,
}

/**
 * Chaque problème refait à partir de son ÉNONCÉ seul, sans passer par le code
 * de la famille — par force brute quand c'est possible, comme on vérifierait
 * une annale à la main.
 */
const RESOUDRE: Record<string, (e: string) => number> = {
  'capital placé pour partie': (e) => {
    const [C, p, q, n, T] = nombres(e)
    return ((T - C) / n / ((C * p) / q)) * 100
  },
  'clôture autour d’un carré': (e) => {
    const [w, A] = nombres(e)
    return (Math.sqrt(A) - 2 * w) ** 2
  },
  'cadeau commun': (e) => {
    const nb = nombres(e)
    const [p, k, q] = e.includes('l’un d’eux') ? [nb[0], 1, nb[1]] : nb
    // Le nombre d'amis par essais successifs, puis le prix.
    for (let n = k + 1; n < 200; n++) if (n * p === (n - k) * q) return n * p
    throw new Error(e)
  },
  'plots et intervalles': (e) => {
    const m = /de ([\d,   ]+?) (km|m) /.exec(e)!
    const L = Number(m[1].replace(MILLIERS, '').replace(',', '.')) * (m[2] === 'km' ? 1000 : 1)
    const d = Number(/tous les (\d+) mètres/.exec(e)![1])
    if (e.includes('circulaire')) return L / d
    return (L / d + 1) * (e.includes('des deux côtés') ? 2 : 1)
  },
  'entiers consécutifs': (e) => {
    const k = nombres(e)[0]
    const m = { deux: 2, trois: 3, quatre: 4 }[/des (\w+) derniers/.exec(e)![1]]!
    const r = e.includes('le double') ? 2 : e.includes('le triple') ? 3 : nombres(e)[1]
    for (let n = 1; n < 100; n++) {
      const suite = Array.from({ length: k }, (_, i) => n + i)
      const premiers = suite.slice(0, m).reduce((s, x) => s + x, 0)
      const derniers = suite.slice(-m).reduce((s, x) => s + x, 0)
      if (derniers === r * premiers) return suite.reduce((s, x) => s + x, 0)
    }
    throw new Error(e)
  },
  'fractions et reste': (e) => {
    const parts = Object.entries(FRACTIONS)
      .filter(([nom]) => e.includes(`${nom} des stylos`) || e.includes(`, ${nom} `))
      .map(([, f]) => f)
    const R = Number(/les (\d+) autres/.exec(e)![1])
    return R / (1 - parts.reduce((s, f) => s + f, 0))
  },
  'multiples dans un intervalle': (e) => {
    const [k, bas, haut] = nombres(e)
    let n = 0
    for (let x = bas; x <= haut; x++) if (x % k === 0) n++
    return n
  },
  'croissance par phases': (e) => {
    const [y0, y1, y2, depart] = nombres(e)
    const verbes = [...e.matchAll(/(doubler|tripler)/g)].map((m) => (m[1] === 'doubler' ? 2 : 3))
    let membres = depart
    for (let y = y0 + 1; y <= y2; y++) membres *= y <= y1 ? verbes[0] : verbes[1]
    return membres
  },
  'moyenne d’un groupe manquant': (e) => {
    const r = { deux: 2, trois: 3, quatre: 4 }[/(\w+) fois plus/.exec(e)![1]]!
    const [F, M] = nombres(e)
    // Une fille et r garçons : le total de la classe moins celui de la fille.
    return ((r + 1) * M - F) / r
  },
  rattrapage: (e) => {
    const [v1, t, v2] = nombres(e)
    // Minute par minute, jusqu'à ce que les deux aient parcouru la même distance.
    for (let m = 1; m < 10000; m++) if (Math.abs(v2 * m - v1 * (m + t)) < 1e-9) return m
    throw new Error(e)
  },
  'prix avant deux variations': (e) => {
    const [h, b, F] = nombres(e)
    return F / (1 + h / 100) / (1 - b / 100)
  },
  'travail commencé seul': (e) => {
    const [t1, t2, h] = nombres(e)
    // Travail restant après h heures, divisé par le débit à deux.
    return (1 - h / t1) / (1 / t1 + 1 / t2)
  },
}

describe('problèmes de calcul rédigés', () => {
  it('ont tous leur résolution indépendante', () => {
    expect(Object.keys(RESOUDRE).sort()).toEqual(FAMILLES_PROBLEMES.map((f) => f.nom).sort())
  })

  it.each(FAMILLES_PROBLEMES.map((f) => [f.nom, f] as const))('%s : la réponse marquée juste est la bonne', (_, f) => {
    const a = aleaDepuis(1234)
    for (let i = 0; i < 300; i++) {
      const q = f.produire(a)
      expect(valeurJuste(q), `${q.enonce} → ${q.options.join(' / ')}`).toBeCloseTo(RESOUDRE[f.nom](q.enonce), 1)
    }
  })

  it.each(FAMILLES_PROBLEMES.map((f) => [f.nom, f] as const))('%s : une seule proposition donne la bonne valeur', (_, f) => {
    const a = aleaDepuis(4321)
    for (let i = 0; i < 200; i++) {
      const q = f.produire(a)
      const attendu = RESOUDRE[f.nom](q.enonce)
      const egales = q.options.filter((o) => Math.abs(valeur(o) - attendu) < 0.05)
      expect(egales, `${q.enonce} → ${q.options.join(' / ')}`).toHaveLength(1)
    }
  })

  it('écrit proprement, sans pronom qui suppose un genre', () => {
    const a = aleaDepuis(7)
    for (const f of FAMILLES_PROBLEMES) {
      for (let i = 0; i < 100; i++) {
        const q = f.produire(a)
        for (const t of [q.enonce, q.explication, q.rappel!, ...q.options, ...Object.values(q.diagnostics ?? {})]) {
          expect(t, f.nom).not.toMatch(/undefined|NaN|Infinity|\bde [AEIOUÉ]\w+ |le triple la|,\d*0 km/)
        }
        expect(q.enonce, f.nom).not.toMatch(/\b(Il|il) (en place|retire|rattrape)|seule? et|le rejoint/)
      }
    }
  })
})
