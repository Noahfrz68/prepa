import { describe, expect, it } from 'vitest'
import { decimal, duree } from './nombres'

describe('formateurs français', () => {
  it('écrit les durées avec une espace entre heures et minutes', () => {
    expect(duree(599)).toBe('9 h 59')
    expect(duree(120)).toBe('2 h')
    expect(duree(45)).toBe('45 min')
    expect(duree(65)).toBe('1 h 05')
  })

  it('écrit les décimales avec une virgule', () => {
    expect(decimal(43.2)).toBe('43,2')
    expect(decimal(1.3)).toBe('1,3')
    expect(decimal(2)).toBe('2')
  })
})
