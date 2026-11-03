import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import { FAMILLES_CALCUL } from './calcul'
import type { QuestionGeneree } from './types'

/**
 * Les neuf familles de calcul relevées de la difficulté 2 à 3 (2026-11-03),
 * refaites depuis leur seul énoncé, par force brute quand c'est possible :
 * jamais en reprenant les formules de la famille.
 */

const MILLIERS = /[   ]/g
const nombres = (t: string) =>
  [...t.matchAll(/\d+(?:[   ]\d{3})*(?:,\d+)?/g)].map((m) => Number(m[0].replace(MILLIERS, '').replace(',', '.')))

/** « 3 465 € » → 3465 ; « 7 h 12 » → 432 (minutes) ; « 81 π cm² » → 81 ; « 8ᵉ jour » → 8. */
function valeur(o: string): number {
  const h = /^(\d+) h (\d+)$/.exec(o)
  if (h) return Number(h[1]) * 60 + Number(h[2])
  return nombres(o)[0]
}

const RESOUDRE: Record<string, (e: string) => number> = {
  'variations successives': (e) => {
    const [v] = nombres(e.split('%')[0])
    if (e.includes('revenir') || e.includes('retrouver')) {
      const c = e.includes('augmente de') ? 1 + v / 100 : 1 - v / 100
      return Math.abs(1 / c - 1) * 100
    }
    const [prix, h1, b, h2] = nombres(e)
    return prix * (1 + h1 / 100) * (1 - b / 100) * (1 + h2 / 100)
  },

  'partage selon un rapport': (e) => {
    const [p, q, ecart] = nombres(e)
    // Essais : la plus petite part qui rende l'écart.
    for (let part = 1; part < 1000; part++) {
      if (Math.abs(q - p) * part !== ecart) continue
      if (e.includes('en tout')) return (p + q) * part
      return e.endsWith('de visiteurs ?') ? q * part : p * part
    }
    throw new Error(e)
  },

  'nombre inconnu': (e) => {
    const [k, n] = nombres(e)
    const m = { double: 2, triple: 3, quadruple: 4, quintuple: 5 }[/le (\w+) de l'âge/.exec(e)![1]]!
    const [aine] = e.split(' a aujourd')
    for (let x = 1; x < 100; x++) {
      if (k * x + n === m * (x + n)) return e.includes(`Quel âge a ${aine} `) ? k * x : x
    }
    throw new Error(e)
  },

  'PGCD et PPCM': (e) => {
    const [x, y] = nombres(e).filter((n) => n > 6)
    if (e.includes('plaque')) {
      for (let c = Math.min(x, y); c > 0; c--) if (x % c === 0 && y % c === 0) return (x / c) * (y / c)
    }
    if (e.includes('roses')) {
      for (let b = Math.min(x, y); b > 0; b--) if (x % b === 0 && y % b === 0) return x / b
    }
    let t = 1
    while (t % x !== 0 || t % y !== 0) t++
    if (e.includes('bus')) return 360 + t
    let n = 0
    for (let s = 0; s < 3600; s++) if (s % x === 0 && s % y === 0) n++
    return n
  },

  'triangle rectangle': (e) => {
    const [hyp, c1] = e.includes('échelle') ? nombres(e) : nombres(e)
    for (let c2 = 1; c2 < hyp; c2++) {
      if (c1 * c1 + c2 * c2 !== hyp * hyp) continue
      if (e.includes('échelle')) return c2
      return e.includes('aire') ? (c1 * c2) / 2 : c1 + c2 + hyp
    }
    throw new Error(e)
  },

  'progression arithmétique': (e) => {
    const nb = nombres(e.replace(/1ʳᵉ|1ᵉʳ/g, ''))
    if (e.includes('en tout') || e.includes('au total') || e.includes('qui a ')) {
      const [u1, r, n] = nb
      let s = 0
      for (let k = 0; k < n; k++) s += u1 + k * r
      return s
    }
    const [i, ui, j, uj, n] = nb
    const r = (uj - ui) / (j - i)
    return ui + (n - i) * r
  },

  'périmètre et aire du disque': (e) => {
    const nb = nombres(e)
    if (e.includes('couronne')) return nb[1] * nb[1] - nb[0] * nb[0]
    if (e.includes('un périmètre de')) return (nb[0] / 2) ** 2
    return 2 * Math.sqrt(nb[0])
  },

  'volume d’un pavé, en litres': (e) => {
    const nb = nombres(e)
    if (e.includes('On verse')) {
      const [litres, L, l] = nb
      return (litres * 1000) / (L * l)
    }
    const [m, dm, cm] = nb
    return m * 10 * dm * (cm / 10)
  },

  'progression géométrique': (e) => {
    const q = /double|deux/.test(e) ? 2 : 3
    if (e.includes('rebond')) {
      const [rebonds, hauteur] = nombres(e)
      return hauteur * q ** rebonds
    }
    const [u1, N] = nombres(e.replace(/1ᵉʳ/, ''))
    let jour = 1
    while (u1 * q ** (jour - 1) <= N) jour++
    return jour
  },
}

const familles = FAMILLES_CALCUL.filter((f) => f.nom in RESOUDRE)
const juste = (q: QuestionGeneree) => valeur(q.options['ABCDE'.indexOf(q.bonneReponse)])

describe('calcul — familles relevées à la difficulté 3', () => {
  it('sont toutes couvertes', () => {
    expect(familles.map((f) => f.nom).sort()).toEqual(Object.keys(RESOUDRE).sort())
  })

  it.each(familles.map((f) => [f.nom, f] as const))('%s : la réponse marquée juste est la bonne, et la seule', (_, f) => {
    const a = aleaDepuis(1103)
    for (let i = 0; i < 300; i++) {
      const q = f.produire(a)
      const attendu = RESOUDRE[f.nom](q.enonce)
      const trace = `${q.enonce} → ${q.options.join(' / ')}`
      expect(juste(q), trace).toBeCloseTo(attendu, 1)
      expect(q.options.filter((o) => Math.abs(valeur(o) - attendu) < 0.05), trace).toHaveLength(1)
      expect(q.difficulte, trace).toBeGreaterThanOrEqual(3)
    }
  })
})
