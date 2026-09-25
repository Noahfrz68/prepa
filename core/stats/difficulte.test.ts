import { describe, expect, it } from 'vitest'
import { FORCE_PRIOR, difficulteObservee } from './difficulte'

describe('difficulteObservee', () => {
  it('ne condamne pas une question sur une seule erreur', () => {
    // Type réussi à 80 % : une erreur isolée ne la rend pas « très difficile ».
    const d = difficulteObservee(0, 1, 0.8)
    expect(d.reussiteEstimee).toBeCloseTo((0 + FORCE_PRIOR * 0.8) / (1 + FORCE_PRIOR))
    expect(d.niveau).toBe(3)
    expect(d.fiable).toBe(false)
  })

  it('laisse les réponses parler quand elles sont nombreuses', () => {
    const d = difficulteObservee(2, 20, 0.8)
    expect(d.niveau).toBe(5)
    expect(d.fiable).toBe(true)
  })

  it('classe une question toujours réussie comme facile', () => {
    expect(difficulteObservee(10, 10, 0.6).niveau).toBeLessThanOrEqual(2)
  })

  it('se replie sur une référence neutre sans taux de type', () => {
    expect(difficulteObservee(0, 0, null).reussiteEstimee).toBeCloseTo(0.6)
  })
})
