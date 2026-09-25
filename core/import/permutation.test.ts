import { describe, expect, it } from 'vitest'
import { aleaDepuis } from '@/core/generation/alea'
import {
  ciblesEquilibrees,
  equilibrer,
  partLettreDominante,
  permutationVers,
  permuterQuestion,
  reecrireLettres,
} from './permutation'

// A→C, B→A, C→E, D→B, E→D
const P = [2, 0, 4, 1, 3]

describe('permuterQuestion', () => {
  it('déplace les propositions et la bonne réponse ensemble', () => {
    const q = permuterQuestion(
      { options: ['a', 'b', 'c', 'd', 'e'], bonneReponse: 'B', explication: null },
      P,
    )
    expect(q.options).toEqual(['b', 'd', 'a', 'e', 'c'])
    expect(q.bonneReponse).toBe('A')
    expect(q.options[0]).toBe('b')
  })

  it('réécrit les clés des diagnostics', () => {
    const q = permuterQuestion(
      {
        options: ['a', 'b', 'c', 'd', 'e'],
        bonneReponse: 'A',
        diagnostics: JSON.stringify({ B: 'oubli', E: 'inversion' }),
      },
      P,
    )
    expect(JSON.parse(q.diagnostics!)).toEqual({ A: 'oubli', D: 'inversion' })
  })

  it('refuse une permutation qui ne couvre pas toutes les propositions', () => {
    expect(() =>
      permuterQuestion({ options: ['a', 'b', 'c', 'd', 'e'], bonneReponse: 'A' }, [0, 0, 1, 2, 3]),
    ).toThrow()
  })
})

describe('reecrireLettres', () => {
  it('réécrit les renvois aux propositions', () => {
    expect(reecrireLettres('A inverse la thèse ; B et D sont contredits.', P)).toBe(
      'C inverse la thèse ; A et B sont contredits.',
    )
    expect(reecrireLettres('La réponse E est fausse (réponse B).', P)).toBe(
      'La réponse D est fausse (réponse A).',
    )
    expect(reecrireLettres('C prend parti ; A, D, E ne portent que sur un détail.', P)).toBe(
      'E prend parti ; C, B, D ne portent que sur un détail.',
    )
  })

  it('ne touche ni aux mots, ni aux références de règle, ni aux paragraphes', () => {
    const t = 'Règle ST1 : à relire au §2. Arbitrages (§1-2) ; voir Q8 et ST1.'
    expect(reecrireLettres(t, P)).toBe(t)
  })

  it('laisse les formules génériques et les citations intactes', () => {
    const t =
      'Structure « non pas A, mais B ». Le distracteur reprend A mot pour mot. D inverse.'
    expect(reecrireLettres(t, P)).toBe(
      'Structure « non pas A, mais B ». Le distracteur reprend A mot pour mot. B inverse.',
    )
  })
})

describe('équilibrage', () => {
  it('amène la bonne réponse à la place voulue', () => {
    const alea = aleaDepuis(1)
    for (let bonne = 0; bonne < 5; bonne++) {
      for (let cible = 0; cible < 5; cible++) {
        const p = permutationVers(bonne, cible, 5, alea)
        expect(p[bonne]).toBe(cible)
        expect(new Set(p).size).toBe(5)
      }
    }
  })

  it('répartit les cibles à parts égales', () => {
    const cibles = ciblesEquilibrees(50, aleaDepuis(7))
    for (const l of ['A', 'B', 'C', 'D', 'E']) {
      expect(cibles.filter((c) => c === l)).toHaveLength(10)
    }
  })

  it('comble d’abord les lettres sous-représentées de la banque', () => {
    const cibles = ciblesEquilibrees(3, aleaDepuis(3), { A: 5, B: 5, C: 5, D: 4, E: 3 })
    expect([...cibles].sort()).toEqual(['D', 'E', 'E'])
  })

  it('efface le biais d’une série entièrement en B', () => {
    const questions = Array.from({ length: 100 }, (_, i) => ({
      options: [`faux${i}a`, `juste${i}`, `faux${i}c`, `faux${i}d`, `faux${i}e`],
      bonneReponse: 'B',
      explication: 'A est un contresens.',
    }))
    const res = equilibrer(questions, aleaDepuis(42))

    const dominante = partLettreDominante(res.map((r) => r.question.bonneReponse))
    expect(dominante!.part).toBeCloseTo(0.2)
    for (const [i, r] of res.entries()) {
      const q = r.question
      expect(q.options[['A', 'B', 'C', 'D', 'E'].indexOf(q.bonneReponse)]).toBe(`juste${i}`)
      // L'explication suit le distracteur qu'elle désignait.
      const lettre = q.explication!.slice(0, 1)
      expect(q.options[['A', 'B', 'C', 'D', 'E'].indexOf(lettre)]).toBe(`faux${i}a`)
    }
  })

  it('laisse intactes les questions qui n’ont pas cinq propositions', () => {
    const q = { options: ['a', 'b', 'c'], bonneReponse: 'B' }
    const [r] = equilibrer([q], aleaDepuis(1))
    expect(r.permutation).toBeNull()
    expect(r.question).toBe(q)
  })
})
