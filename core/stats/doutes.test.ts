import { describe, expect, it } from 'vitest'
import { signauxDeDoute } from './doutes'

const base = { n: 1, justes: 0, erreursCertaines: 0, fausseRepetee: null }

describe('signauxDeDoute', () => {
  it('se tait sur une simple erreur hésitante', () => {
    expect(signauxDeDoute(base)).toEqual([])
  })

  it('signale une erreur commise en se disant certain', () => {
    const s = signauxDeDoute({ ...base, erreursCertaines: 1 })
    expect(s.map((x) => x.signal)).toEqual(['erreur_certaine'])
  })

  it('signale la même mauvaise réponse donnée deux fois, en nommant la lettre', () => {
    const s = signauxDeDoute({ ...base, n: 2, fausseRepetee: { lettre: 'C', fois: 2 } })
    expect(s[0].signal).toBe('meme_fausse_repetee')
    expect(s[0].raison).toMatch(/C/)
  })

  it('signale une question jamais réussie en trois essais, pas en deux', () => {
    expect(signauxDeDoute({ ...base, n: 2 }).map((x) => x.signal)).not.toContain('jamais_reussie')
    expect(signauxDeDoute({ ...base, n: 3 }).map((x) => x.signal)).toContain('jamais_reussie')
  })
})
