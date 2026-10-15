import { describe, expect, it } from 'vitest'
import { aleaDepuis } from '../alea'
import type { Case, Forme } from '@/core/figures/types'
import type { QuestionGeneree } from '../types'
import { CATALOGUE_LETTRES, CATALOGUE_NOMBRES, FAMILLES_PROPRIETES, RELATIONS, induites, type Modele } from './proprietes'

/** Le nombre affiché (« 1 024 » → 1024). */
const lireNombre = (t: string) => Number(t.replace(/\s/g, ''))

/**
 * Relit une croix à partir de ce qui est AFFICHÉ, comme un candidat : on
 * induit toutes les règles du catalogue que vérifient les deux séries, et on
 * compte les propositions qui en respectent une de chaque côté. Il doit y en
 * avoir exactement une, et ce doit être la bonne réponse.
 */
function propositionsValables<T>(q: QuestionGeneree, catalogue: Modele<T>[], lire: (t: string) => T): number[] {
  const fig = q.figure!
  if (fig.type !== 'croix') throw new Error('pas une croix')
  const exemples = (cases: Case[]) =>
    cases.flatMap((c, i) => (c.inconnue ? [] : [{ x: lire(c.texte!), i }]))
  const H = induites(catalogue, exemples(fig.ligne))
  const V = induites(catalogue, exemples(fig.colonne))
  return q.options.flatMap((o, k) => {
    const x = lire(o)
    return H.some((r) => r.test(x, fig.iLigne)) && V.some((r) => r.test(x, fig.iColonne)) ? [k] : []
  })
}

describe('croix — questions d’annales reconstruites', () => {
  it('« les trois chiffres se suivent » × « le produit des chiffres vaut 24 » → 234 seul', () => {
    const H = induites(CATALOGUE_NOMBRES, [123, 345, 567, 789].map((x, i) => ({ x, i: i < 2 ? i : i + 1 })))
    const V = induites(CATALOGUE_NOMBRES, [138, 226, 318, 461].map((x, i) => ({ x, i: i < 2 ? i : i + 1 })))
    expect(H.map((r) => r.texte)).toContain('les trois chiffres se suivent, en montant')
    expect(V.map((r) => r.texte)).toContain('le produit des chiffres vaut 24')
    const valables = [234, 345, 146, 456, 333].filter((n) => H.some((r) => r.test(n, 2)) && V.some((r) => r.test(n, 2)))
    expect(valables).toEqual([234])
  })

  // Annale n° 1235 : horizontalement, les deux premières lettres de chaque
  // groupe se suivent ; verticalement, les deuxièmes lettres se suivent d'une
  // case à l'autre. Propositions MIF, ABJ, NBC, NOG, KDS — corrigé : ABJ.
  it('« les deux premières lettres se suivent » × « la 2ᵉ lettre avance de 1 » → ABJ seul', () => {
    // Le « ? » est en 3ᵉ case de la ligne et en 2ᵉ case de la colonne.
    const H = induites(CATALOGUE_LETTRES, [{ x: 'MNB', i: 0 }, { x: 'DEX', i: 1 }, { x: 'RSA', i: 3 }, { x: 'KLO', i: 4 }])
    const V = induites(CATALOGUE_LETTRES, [{ x: 'XAQ', i: 0 }, { x: 'PCL', i: 2 }, { x: 'MDZ', i: 3 }, { x: 'TEH', i: 4 }])
    const valables = ['MIF', 'ABJ', 'NBC', 'NOG', 'KDS'].filter((g) => H.some((r) => r.test(g, 2)) && V.some((r) => r.test(g, 1)))
    expect(valables).toEqual(['ABJ'])
  })
})

// Les croix de lettres parcourent 17 576 groupes par case : quelques secondes
// pour un lot, davantage quand toute la suite tourne en parallèle.
describe('familles au niveau des annales', () => {
  const lot = (nom: string, n: number) => {
    const f = FAMILLES_PROPRIETES.find((x) => x.nom === nom)!
    // Les croix de lettres parcourent 17 576 groupes : un lot plus court suffit.
    if (nom.includes('lettres')) n = Math.min(n, 120)
    const a = aleaDepuis(99)
    return Array.from({ length: n }, () => f.produire(a))
  }

  it('croix de chiffres : une seule proposition valable, quelle que soit la règle lue', () => {
    for (const q of lot('croix — propriétés des chiffres', 300)) {
      const valables = propositionsValables(q, CATALOGUE_NOMBRES, lireNombre)
      expect(valables, `${q.rappel} · ${q.options.join(' / ')}`).toEqual(['ABCDE'.indexOf(q.bonneReponse)])
    }
  })

  it('croix de lettres : une seule proposition valable, quelle que soit la règle lue', () => {
    for (const q of lot('croix — propriétés des lettres', 300)) {
      const valables = propositionsValables(q, CATALOGUE_LETTRES, (t) => t)
      expect(valables, `${q.rappel} · ${q.options.join(' / ')}`).toEqual(['ABCDE'.indexOf(q.bonneReponse)])
    }
  }, 30_000)

  it('séries croisées : une seule case valable, quelle que soit la relation lue', () => {
    for (const q of lot('série croisée figure ↔ code', 300)) {
      const fig = q.figure!
      if (fig.type !== 'bande') throw new Error('pas une bande')
      const vignettes = fig.cases.filter((c) => !c.inconnue).map((c) => ({ forme: c.forme as Forme, code: c.lettre! }))
      const lues = RELATIONS.filter((r) => vignettes.every((v) => r.test(v)))
      expect(lues.length, q.rappel).toBeGreaterThan(0)
      const valables = q.optionsFigure!.flatMap((c, k) =>
        lues.some((r) => r.test({ forme: c.forme as Forme, code: c.lettre! })) ? [k] : [],
      )
      expect(valables, `${q.rappel} · ${q.options.join(' / ')}`).toEqual(['ABCDE'.indexOf(q.bonneReponse)])
    }
  })

  it('n’affiche jamais deux fois le même groupe, ni la réponse dans une série', () => {
    for (const nom of ['croix — propriétés des chiffres', 'croix — propriétés des lettres']) {
      for (const q of lot(nom, 200)) {
        const fig = q.figure!
        if (fig.type !== 'croix') continue
        const affiches = [...fig.ligne, ...fig.colonne].filter((c) => !c.inconnue).map((c) => c.texte)
        expect(new Set(affiches).size, q.rappel).toBe(affiches.length)
        expect(affiches, q.rappel).not.toContain(q.options['ABCDE'.indexOf(q.bonneReponse)])
      }
    }
  }, 30_000)

  it('varie les règles : chaque modèle du catalogue sert', () => {
    const textes = lot('croix — propriétés des chiffres', 400).map((q) => q.rappel!)
    for (const motif of ['somme des chiffres', 'produit des chiffres', 'se suivent', 'pairs', 'carré du troisième', 'premiers', 'multiples', 'chiffre augmente', 'chiffre diminue']) {
      expect(textes.some((t) => t.includes(motif)), motif).toBe(true)
    }
  })

  it('écrit proprement', () => {
    for (const nom of FAMILLES_PROPRIETES.map((f) => f.nom)) {
      for (const q of lot(nom, 100)) {
        for (const t of [q.enonce, q.explication, q.rappel!, ...q.options, ...Object.values(q.diagnostics ?? {})]) {
          expect(t).not.toMatch(/undefined|NaN|le hexagone|le octogone|à rebours d’une/)
        }
      }
    }
  }, 30_000)
})
