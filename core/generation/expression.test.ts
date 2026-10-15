import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import { PHRASES } from './corpus-expression'
import { FAMILLES_EXPRESSION } from './expression'

const CORRECTES = new Set(PHRASES.map((p) => p.correcte))
/** La phrase du corpus d'où vient une proposition, correcte ou fautive. */
const origine = (t: string) => PHRASES.find((p) => p.correcte === t || p.variantes.some((v) => v.texte === t))

describe('seule phrase correcte', () => {
  const famille = FAMILLES_EXPRESSION.find((f) => f.nom === 'seule phrase correcte')!
  const a = aleaDepuis(17)
  const qs = Array.from({ length: 400 }, () => famille.produire(a))

  it('n’a qu’une proposition correcte, et c’est la bonne réponse', () => {
    for (const q of qs) {
      const correctes = q.options.filter((o) => CORRECTES.has(o))
      expect(correctes, q.options.join('\n')).toEqual([q.options['ABCDE'.indexOf(q.bonneReponse)]])
    }
  })

  // Le format perd tout son intérêt si deux propositions viennent de la même
  // phrase : on retrouve alors la comparaison qu'il devait empêcher.
  it('tire les cinq propositions de cinq phrases différentes', () => {
    for (const q of qs) {
      const sources = q.options.map(origine)
      expect(sources.every(Boolean), q.options.join('\n')).toBe(true)
      expect(new Set(sources).size, q.options.join('\n')).toBe(5)
    }
  })

  it('puise surtout dans les phrases de niveau annales', () => {
    const parts = qs.map((q) => q.options.filter((o) => origine(o)!.difficile).length)
    expect(parts.every((n) => n >= 3)).toBe(true)
    expect(qs.filter((q) => origine(q.options['ABCDE'.indexOf(q.bonneReponse)])!.difficile).length / qs.length).toBeGreaterThan(0.6)
  })

  it('nomme la règle violée par chaque fautive', () => {
    for (const q of qs) {
      expect(Object.keys(q.diagnostics ?? {}).sort()).toEqual(['A', 'B', 'C', 'D', 'E'].filter((l) => l !== q.bonneReponse))
    }
  })
})

describe('corpus — aucune fautive n’est la phrase correcte d’une autre', () => {
  it('sépare strictement correctes et fautives', () => {
    for (const p of PHRASES) for (const v of p.variantes) expect(CORRECTES.has(v.texte), v.texte).toBe(false)
  })

  it('compte au moins vingt-quatre phrases de niveau annales, réparties sur les trois compétences', () => {
    const durs = PHRASES.filter((p) => p.difficile)
    expect(durs.length).toBeGreaterThanOrEqual(24)
    for (const s of ['orthographe', 'grammaire_et_conjugaison', 'correction_syntaxique']) {
      expect(durs.filter((p) => p.skill === s).length, s).toBeGreaterThanOrEqual(7)
    }
  })
})
