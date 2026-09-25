import { describe, expect, it } from 'vitest'
import { OPTIONS_CONDITIONS_MINIMALES, lettreConditionsMinimales } from './index'

describe('lettreConditionsMinimales', () => {
  it('suit la table officielle A–E', () => {
    expect(lettreConditionsMinimales(true, false, null)).toBe('A')
    expect(lettreConditionsMinimales(false, true, null)).toBe('B')
    expect(lettreConditionsMinimales(false, false, true)).toBe('C')
    expect(lettreConditionsMinimales(true, true, null)).toBe('D')
    expect(lettreConditionsMinimales(false, false, false)).toBe('E')
  })

  it('ne pose la question « ensemble » que si aucune ne suffit seule', () => {
    expect(lettreConditionsMinimales(false, false, null)).toBeNull()
  })

  it('reste aligné sur le libellé des propositions', () => {
    expect(OPTIONS_CONDITIONS_MINIMALES[0]).toMatch(/\(1\) permet à elle seule/)
    expect(OPTIONS_CONDITIONS_MINIMALES[3]).toMatch(/Chaque information/)
    expect(OPTIONS_CONDITIONS_MINIMALES[4]).toMatch(/ne suffisent pas/)
  })
})
