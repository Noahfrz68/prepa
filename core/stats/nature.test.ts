import { describe, expect, it } from 'vitest'
import { descriptionComposition, natureDe } from './nature'

describe('nature d’une épreuve', () => {
  it('classe selon la part d’annales, seuil à la moitié', () => {
    expect(natureDe(1)).toBe('annales')
    expect(natureDe(0.5)).toBe('annales')
    expect(natureDe(0.24)).toBe('generees')
    expect(natureDe(0)).toBe('generees')
  })

  it('décrit la composition en clair', () => {
    expect(descriptionComposition(1)).toBe('toutes les questions tirées d’annales')
    expect(descriptionComposition(0)).toBe('aucune question d’annale')
    expect(descriptionComposition(0.239)).toBe('24 % de questions d’annales')
  })
})
