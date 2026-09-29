import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sha256Hex } from './sha256'

describe('sha256Hex', () => {
  it('donne exactement le hash de node:crypto, y compris aux frontières de bloc et en UTF-8', () => {
    const cas = [
      '',
      'abc',
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(63),
      'a'.repeat(64),
      'a'.repeat(1000),
      'Réplique n° 1 — l’accent britannique, « guillemets » et 😀',
      JSON.stringify({ accent: 'UK', segments: [{ locuteur: 0, texte: 'Good morning.' }] }),
    ]
    for (const texte of cas) {
      expect(sha256Hex(texte)).toBe(createHash('sha256').update(texte).digest('hex'))
    }
  })
})
