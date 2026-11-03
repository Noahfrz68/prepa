import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import { FAMILLES_IDEES } from './calcul-idees'
import { genererLot } from '.'
import type { QuestionGeneree } from './types'

const MILLIERS = /[   ]/g

function nombres(t: string): number[] {
  return [...t.matchAll(/\d+(?:[   ]\d{3})*(?:,\d+)?/g)].map((m) => Number(m[0].replace(MILLIERS, '').replace(',', '.')))
}

/** « 15/28 » → 0,535… ; « 960 € » → 960. */
function valeur(o: string): number {
  const f = /^(\d+)\/(\d+)$/.exec(o)
  return f ? Number(f[1]) / Number(f[2]) : nombres(o)[0]
}

const MOTS: Record<string, number> = { deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 }

/**
 * Chaque question refaite à partir de son énoncé seul (et de sa figure pour la
 * grille), par énumération : jamais en reprenant les formules de la famille.
 * Rend la liste des valeurs justes — une seule attendue.
 */
const RESOUDRE: Record<string, (q: QuestionGeneree) => number> = {
  'probabilité conditionnelle': ({ enonce: e }) => {
    let issues: number[][] = []
    let cond: (i: number[]) => boolean
    let evt: (i: number[]) => boolean
    if (e.includes('dés')) {
      const v = Number(/affiche (\d)/.exec(e)![1])
      for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) issues.push([r, b])
      cond = e.includes('le dé rouge affiche') ? (i) => i[0] === v : (i) => i.includes(v)
      const somme = /fasse (\d+)/.exec(e)
      evt = somme ? (i) => i[0] + i[1] === Number(somme[1]) : (i) => i[0] === v && i[1] === v
    } else {
      const k = MOTS[/(?:a eu|On lance) (\w+)/.exec(e)![1]]
      issues = Array.from({ length: 2 ** k }, (_, m) => Array.from({ length: k }, (_, j) => (m >> j) & 1))
      const nomme = /Sachant que (la première|[A-ZÉ][a-zéè]+ est)/.test(e)
      cond = nomme ? (i) => i[0] === 1 : (i) => i.includes(1)
      const seul = /exactement un|une seule/.test(e)
      evt = seul ? (i) => i.filter((c) => c === 1).length === 1 : (i) => i.every((c) => c === 1)
    }
    const c = issues.filter(cond)
    return c.filter(evt).length / c.length
  },

  'deux vitesses, deux heures d’arrivée': ({ enonce: e }) => {
    const h = [...e.matchAll(/(\d+) h(?: (\d+))?/g)].map((m) => Number(m[1]) * 60 + Number(m[2] ?? 0))
    const [v1, v2] = [...e.matchAll(/(\d+) km\/h/g)].map((m) => Number(m[1]))
    for (let d = 1; d <= 2000; d++) {
      if (Math.abs((d * 60) / v1 - (d * 60) / v2 - (h[0] - h[1])) < 1e-9) {
        const depart = h[0] - (d * 60) / v1
        return (d * 60) / (h[2] - depart)
      }
    }
    throw new Error(e)
  },

  'grille à sommes égales': (q) => {
    if (q.figure?.type !== 'matrice') throw new Error('figure absente')
    const lignes = q.figure.lignes
    const n = lignes[0].length
    const max = 2 * n
    // Remplissage par retour arrière, contrôlé seulement par les règles de l'énoncé.
    const g: number[][] = [Array(n).fill(0), Array(n).fill(0)]
    const pris = new Set<number>()
    const solutions: number[] = []
    const cases = lignes.flatMap((r, i) => r.map((c, j) => ({ i, j, t: c.texte })))
    const poser = (k: number) => {
      if (k === cases.length) {
        const cols = new Set(g[0].map((x, j) => x + g[1][j]))
        const rangs = new Set(g.map((r) => r.reduce((s, x) => s + x, 0)))
        if (cols.size === 1 && rangs.size === 1) {
          const x = cases.find((c) => c.t === 'X')!
          solutions.push(g[x.i][x.j])
        }
        return
      }
      const { i, j, t } = cases[k]
      if (t && t !== 'X') {
        g[i][j] = Number(t)
        return poser(k + 1)
      }
      for (let v = 1; v <= max; v++) {
        if (pris.has(v)) continue
        pris.add(v)
        g[i][j] = v
        poser(k + 1)
        pris.delete(v)
      }
    }
    // Les nombres dévoilés sont réservés d'avance ; les n + 1 cases vides se
    // partagent le reste, au plus 7! essais.
    for (const c of cases) if (c.t && c.t !== 'X') pris.add(Number(c.t))
    poser(0)
    expect(solutions, q.enonce).toHaveLength(1)
    return solutions[0]
  },

  'nombres selon leurs chiffres': ({ enonce: e }) => {
    const m = MOTS[/à (\w+) chiffres/.exec(e)![1]]
    const k = nombres(e).at(-1)!
    const tete = (x: number) => Number(String(x)[0])
    const test = e.includes('strictement supérieur')
      ? (c: number) => c > k
      : e.includes('supérieur ou égal')
        ? (c: number) => c >= k
        : e.includes('strictement inférieur')
          ? (c: number) => c < k
          : (c: number) => c <= k
    let n = 0
    for (let x = 10 ** (m - 1); x < 10 ** m; x++) {
      if (e.includes('nombres pairs') && x % 2) continue
      if (e.includes('nombres impairs') && x % 2 === 0) continue
      if (test(tete(x))) n++
    }
    return n
  },

  'offre par lots': ({ enonce: e }) => {
    const [n, suivant] = nombres(e)
    const g = /le \d+ᵉ|la \d+ᵉ/.test(e) ? 1 : suivant
    const emportes = (p: number) => p + Math.floor(p / n) * g
    const prix = Number(/à (\d+) € l'unité|coûte (\d+) €/.exec(e)!.slice(1).find(Boolean))
    if (e.includes(' paie ')) {
      const paye = nombres(e.split(' paie ')[1])[0]
      return emportes(paye / prix)
    }
    const N = Number(/avec (\d+)/.exec(e)![1])
    for (let p = 0; p <= N; p++) if (emportes(p) === N) return p * prix
    throw new Error(e)
  },

  'seul total compatible': (q) => {
    const e = q.enonce
    const PARTS: Record<string, number> = { tiers: 3, quart: 4, sixième: 6, septième: 7, huitième: 8, neuvième: 9, onzième: 11, douzième: 12 }
    const [, mot, part] = /\b(un|deux) (tiers|quarts?|sixièmes?|septièmes?|huitièmes?|neuvièmes?|onzièmes?|douzièmes?)/.exec(e)!
    const num = mot === 'un' ? 1 : 2
    const den = PARTS[part.replace(/s$/, '').replace(/^tier$/, 'tiers')]
    const p = Number(/(\d+) %/.exec(e)![1])
    const justes = q.options.map(valeur).filter((v) => Number.isInteger((v * num) / den) && Number.isInteger((v * p) / 100))
    expect(justes, e).toHaveLength(1)
    return justes[0]
  },

  'restes compatibles': (q) => {
    const [p, rp, q2, rq] = nombres(q.enonce.replace(/aucune?/g, '0'))
    const justes = q.options.map(valeur).filter((v) => v % p === rp && v % q2 === rq)
    expect(justes, q.enonce).toHaveLength(1)
    return justes[0]
  },

  'somme de consécutifs possible': (q) => {
    const k = MOTS[/somme de (\w+) entiers/.exec(q.enonce)![1]]
    const possible = (v: number) => {
      for (let n = 1; k * n <= v; n++) if (Array.from({ length: k }, (_, i) => n + i).reduce((s, x) => s + x, 0) === v) return true
      return false
    }
    const justes = q.options.map(valeur).filter(possible)
    expect(justes, q.enonce).toHaveLength(1)
    return justes[0]
  },
}

const valeurJuste = (q: QuestionGeneree) => valeur(q.options['ABCDE'.indexOf(q.bonneReponse)])

describe('calcul — questions à une idée', () => {
  it('ont toutes leur résolution indépendante', () => {
    expect(Object.keys(RESOUDRE).sort()).toEqual(FAMILLES_IDEES.map((f) => f.nom).sort())
  })

  it.each(FAMILLES_IDEES.map((f) => [f.nom, f] as const))('%s : la réponse marquée juste est la bonne, et la seule', (_, f) => {
    const a = aleaDepuis(2026)
    for (let i = 0; i < 300; i++) {
      const q = f.produire(a)
      const attendu = RESOUDRE[f.nom](q)
      const trace = `${q.enonce} → ${q.options.join(' / ')}`
      expect(valeurJuste(q), trace).toBeCloseTo(attendu, 6)
      expect(q.options.filter((o) => Math.abs(valeur(o) - attendu) < 1e-9), trace).toHaveLength(1)
    }
  })

  // Même clé que la déduplication du générateur : énoncé, figure et bonne réponse.
  it.each(FAMILLES_IDEES.map((f) => [f.nom, f] as const))('%s : varie ses exercices', (_, f) => {
    const a = aleaDepuis(5)
    const enonces = new Set(Array.from({ length: 60 }, () => {
      const q = f.produire(a)
      return q.enonce + JSON.stringify(q.figure ?? '') + valeurJuste(q)
    }))
    expect(enonces.size).toBeGreaterThan(30)
  })

  it('écrit proprement', () => {
    const a = aleaDepuis(8)
    for (const f of FAMILLES_IDEES) {
      for (let i = 0; i < 150; i++) {
        const q = f.produire(a)
        for (const t of [q.enonce, q.explication, q.rappel!, ...q.options, ...Object.values(q.diagnostics ?? {})]) {
          expect(t, f.nom).not.toMatch(/undefined|NaN|Infinity|\bde [aeiouéAEIOUÉ]|\b(un|le) (pièce|bouteille|baguette)|\b1 réalisent|\b1 places|\bde œ/)
        }
      }
    }
  })

  it('pèse environ 40 % du calcul généré', () => {
    const lot = genererLot('calcul', 400, 99)
    const idees = new Set(FAMILLES_IDEES.map((f) => f.nom))
    const part = Object.entries(lot.parFamille).filter(([nom]) => idees.has(nom)).reduce((s, [, n]) => s + n, 0) / lot.questions.length
    expect(part).toBeGreaterThan(0.35)
    expect(part).toBeLessThan(0.5)
  })

  it('alterne « au moins un » et un individu nommé, pour que 1/3 ne se récite pas', () => {
    const f = FAMILLES_IDEES.find((x) => x.nom === 'probabilité conditionnelle')!
    const a = aleaDepuis(3)
    const reponses = new Set(Array.from({ length: 200 }, () => {
      const q = f.produire(a)
      return valeurJuste(q).toFixed(4)
    }))
    expect(reponses.has((1 / 3).toFixed(4))).toBe(true)
    expect(reponses.has((1 / 2).toFixed(4))).toBe(true)
    expect(reponses.size).toBeGreaterThan(4)
  })
})
