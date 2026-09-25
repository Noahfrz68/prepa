import { describe, expect, it } from 'vitest'
import { normaliserMultiplication } from './typographie'

describe('normaliserMultiplication', () => {
  it('remplace le x pris entre deux nombres par ×', () => {
    expect(normaliserMultiplication('36 x 25')).toBe('36 × 25')
    expect(normaliserMultiplication('1.21 x 10000')).toBe('1.21 × 10000')
    expect(normaliserMultiplication('3 x 80=240')).toBe('3 × 80=240')
    expect(normaliserMultiplication('8 x 3 x 3 x 2')).toBe('8 × 3 × 3 × 2')
    expect(normaliserMultiplication('16x8')).toBe('16 × 8')
  })

  it('laisse les inconnues et les mots tranquilles', () => {
    for (const t of ['x années', '3x + 2 = 8', 'Que vaut x ?', 'extrait', '2 x y']) {
      expect(normaliserMultiplication(t)).toBe(t)
    }
  })
})
