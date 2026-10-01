import { describe, expect, it } from 'vitest'
import { aleaDepuis } from '@/core/generation/alea'
import { FORMULES, formules } from './jeux/formules'
import { verifier } from './reponses'

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))

/**
 * Chaque application recalculée depuis ses données, sans passer par le code
 * de la formule — écrit ici une seconde fois, indépendamment. En nombre de π
 * pour les aires et volumes ronds.
 */
const ATTENDU: Record<string, (d: Record<string, number>) => number> = {
  aire_triangle: ({ b, h }) => (b * h) / 2,
  aire_parallelogramme: ({ b, h }) => b * h,
  aire_trapeze: ({ B, b, h }) => ((B + b) / 2) * h,
  aire_losange: ({ D, d }) => (D * d) / 2,
  aire_disque: ({ r }) => r ** 2,
  perimetre_cercle: ({ r }) => 2 * r,
  aire_sphere: ({ r }) => 4 * r ** 2,
  volume_pave: ({ L, l, h }) => L * l * h,
  volume_cylindre: ({ r, h }) => r ** 2 * h,
  volume_cone: ({ r, h }) => (r ** 2 * h) / 3,
  volume_pyramide: ({ c, h }) => (c ** 2 * h) / 3,
  volume_sphere: ({ r }) => (4 / 3) * r ** 3,
  facteur_aire: ({ k }) => k ** 2,
  facteur_volume: ({ k }) => k ** 3,
  somme_angles: ({ n }) => 180 * (n - 2),
  diagonales_polygone: ({ n }) => (n * (n - 3)) / 2,
  permutations: ({ n }) => fact(n),
  arrangements: ({ n, k }) => fact(n) / fact(n - k),
  combinaisons: ({ n, k }) => fact(n) / fact(k) / fact(n - k),
  repetition: ({ n, k }) => n ** k,
  poignees: ({ n }) => (n * (n - 1)) / 2,
  terme_arithmetique: ({ u1, r, n }) => u1 + (n - 1) * r,
  somme_arithmetique: ({ premier, dernier, n }) => ((premier + dernier) / 2) * n,
  somme_entiers: ({ n }) => Array.from({ length: n }, (_, i) => i + 1).reduce((s, x) => s + x, 0),
  terme_geometrique: ({ u1, q, n }) => u1 * q ** (n - 1),
  nombre_termes: ({ a, b, r }) => (b - a) / r + 1,
  temps: ({ d, v }) => d / v,
  vitesse_moyenne: ({ v1, v2 }) => 2 / (1 / v1 + 1 / v2),
  travail_conjoint: ({ t1, t2 }) => 1 / (1 / t1 + 1 / t2),
  melange: ({ V1, c1, V2, c2 }) => (V1 * c1 + V2 * c2) / (V1 + V2),
  variation: ({ V1, V2 }) => ((V2 - V1) / V1) * 100,
  interets_composes: ({ C, t, n }) => C * (1 + t / 100) ** n,
  moyenne_ponderee: ({ n1, m1, n2, m2 }) => (n1 * m1 + n2 * m2) / (n1 + n2),
  pgcd_ppcm: ({ a, b, g }) => (a * b) / g,
  nombre_multiples: ({ n, p }) => Array.from({ length: n }, (_, i) => i + 1).filter((x) => x % p === 0).length,
  nombre_diviseurs: ({ a, b }) => {
    const n = 2 ** a * 3 ** b
    return Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0).length
  },
  somme_racines: ({ r1, r2 }) => r1 + r2,
  produit_racines: ({ r1, r2 }) => r1 * r2,
  discriminant: ({ a, b, c }) => b * b - 4 * a * c,
  produit_en_croix: ({ a, b, c }) => (b * c) / a,
}

describe('formules flash — le catalogue', () => {
  it('donne à chaque formule au moins quatre leurres distincts, aucun égal à la formule', () => {
    for (const f of FORMULES) {
      expect(f.leurres.length, f.id).toBeGreaterThanOrEqual(4)
      expect(new Set(f.leurres).size, f.id).toBe(f.leurres.length)
      expect(f.leurres, f.id).not.toContain(f.formule)
    }
  })

  it('a des identifiants uniques', () => {
    expect(new Set(FORMULES.map((f) => f.id)).size).toBe(FORMULES.length)
  })

  it('recalcule chaque application de son côté', () => {
    expect(Object.keys(ATTENDU).sort()).toEqual(FORMULES.filter((f) => f.appliquer).map((f) => f.id).sort())
    const a = aleaDepuis(31)
    for (const f of FORMULES.filter((x) => x.appliquer)) {
      for (let i = 0; i < 300; i++) {
        const ap = f.appliquer!(a)
        expect(ap.valeur, `${f.id} · ${ap.enonce}`).toBeCloseTo(ATTENDU[f.id](ap.donnees), 9)
        expect(Number.isFinite(ap.valeur), ap.enonce).toBe(true)
        // Des nombres pour le calcul de tête : au plus deux décimales.
        expect(Math.abs(ap.valeur * 100 - Math.round(ap.valeur * 100)), ap.enonce).toBeLessThan(1e-6)
      }
    }
  })
})

describe('formules flash — les questions', () => {
  const a = aleaDepuis(32)
  const qs = Array.from({ length: 3000 }, () => formules.produire(a))

  it('pose chaque formule, en reconnaissance comme en application', () => {
    const cles = new Set(qs.map((q) => q.cle))
    for (const f of FORMULES) {
      expect(cles.has(`formule:${f.id}`), f.id).toBe(true)
      if (f.appliquer) expect(cles.has(`appli:${f.id}`), f.id).toBe(true)
    }
  })

  it('propose cinq formules distinctes, dont la bonne une seule fois', () => {
    for (const q of qs.filter((x) => x.cle.startsWith('formule:'))) {
      const f = FORMULES.find((x) => `formule:${x.id}` === q.cle)!
      expect(q.choix, q.cle).toHaveLength(5)
      expect(new Set(q.choix).size, q.cle).toBe(5)
      expect(q.choix!.filter((c) => c === f.formule), q.cle).toHaveLength(1)
      expect(q.attendu.genre === 'choix' && q.choix![q.attendu.valeur], q.cle).toBe(f.formule)
    }
  })

  it('accepte « 12 » comme « 12π » pour une réponse en π', () => {
    for (const q of qs.filter((x) => x.reponse.endsWith('π'))) {
      expect(verifier(q.attendu, q.reponse), q.enonce).toBe(true)
      expect(verifier(q.attendu, q.reponse.replace('π', '')), q.enonce).toBe(true)
    }
  })

  it('montre la formule dans chaque correction longue', () => {
    for (const q of qs) {
      const f = FORMULES.find((x) => q.cle.endsWith(`:${x.id}`))!
      expect(q.astuce, q.cle).toContain(f.formule)
    }
  })
})
