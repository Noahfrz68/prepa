import { describe, expect, it } from 'vitest'
import { LEXIQUE, PAIRES, PHRASES, CONNECTEURS } from './corpus-expression'

const sansAccent = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Le corpus d'expression n'est pas calculable : sa justesse tient à sa
 * rédaction. Ces contrôles ne peuvent donc pas prouver qu'une variante est
 * fautive — mais ils attrapent tout ce qui, structurellement, rendrait une
 * question insoluble ou à deux réponses.
 */
describe('corpus des phrases', () => {
  it('donne quatre variantes fautives distinctes par phrase', () => {
    for (const p of PHRASES) {
      expect(p.variantes.length, p.correcte).toBeGreaterThanOrEqual(4)
      const textes = p.variantes.map((v) => v.texte)
      expect(new Set(textes).size, p.correcte).toBe(textes.length)
    }
  })

  it('ne laisse jamais la phrase correcte parmi ses propres variantes', () => {
    for (const p of PHRASES) {
      expect(p.variantes.map((v) => v.texte), p.correcte).not.toContain(p.correcte)
    }
  })

  it('n’emploie jamais deux fois la même phrase correcte', () => {
    const correctes = PHRASES.map((p) => p.correcte)
    expect(new Set(correctes).size).toBe(correctes.length)
  })

  // Une variante doit tester UN point. Si elle s'éloigne de la phrase d'origine
  // sur plusieurs mots, elle cumule les fautes — et l'explication devient fausse.
  it('ne fait varier qu’un ou deux mots par rapport à la phrase correcte', () => {
    const excedents: string[] = []
    for (const p of PHRASES) {
      const base = p.correcte.split(/\s+/)
      for (const v of p.variantes) {
        const mots = v.texte.split(/\s+/)
        const communs = new Set(base)
        const differents = mots.filter((m) => !communs.has(m)).length
        if (differents > 2) excedents.push(`${v.texte} (${differents} mots)`)
      }
    }
    expect(excedents).toEqual([])
  })

  it('nomme la règle violée par chaque variante', () => {
    for (const p of PHRASES) {
      for (const v of p.variantes) expect(v.regle.length, v.texte).toBeGreaterThan(15)
    }
  })
})

describe('corpus du lexique', () => {
  it('distingue synonyme, antonyme et leurres', () => {
    for (const e of LEXIQUE) {
      expect(e.synonyme, e.mot).not.toBe(e.antonyme)
      expect(e.leurres.length, e.mot).toBeGreaterThanOrEqual(4)
      expect(e.leurres, e.mot).not.toContain(e.synonyme)
      expect(e.leurres, e.mot).not.toContain(e.antonyme)
      expect(new Set(e.leurres).size, e.mot).toBe(e.leurres.length)
    }
  })

  it('montre le mot dans son contexte', () => {
    for (const e of LEXIQUE) {
      // Le contexte doit contenir le mot, éventuellement fléchi : on compare
      // sur cinq lettres, sans accents. « saugrenu » se retrouve ainsi dans
      // « saugrenue », « atermoyer » dans « atermoie » dont le radical change,
      // et « éluder » dans « éludé » où seul l'accent diffère.
      expect(sansAccent(e.contexte), e.mot).toContain(sansAccent(e.mot).slice(0, 5))
    }
  })

  it('n’emploie jamais deux fois le même mot', () => {
    const mots = LEXIQUE.map((e) => e.mot)
    expect(new Set(mots).size).toBe(mots.length)
  })
})

describe('corpus des connecteurs', () => {
  it('couvre chaque relation par au moins deux paires', () => {
    const parRelation: Record<string, number> = {}
    for (const p of PAIRES) parRelation[p.relation] = (parRelation[p.relation] ?? 0) + 1
    for (const r of Object.keys(CONNECTEURS)) {
      expect(parRelation[r] ?? 0, r).toBeGreaterThanOrEqual(2)
    }
  })

  it('n’attribue jamais un même connecteur à deux relations', () => {
    const tous = Object.values(CONNECTEURS).flat()
    expect(new Set(tous).size).toBe(tous.length)
  })
})
