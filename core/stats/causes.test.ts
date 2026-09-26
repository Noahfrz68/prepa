import { describe, expect, it } from 'vitest'
import { CAUSES, CAUSES_PAR_SECTION, causesDe } from './causes'

describe('causes d’erreur par sous-test', () => {
  it('ne propose pas « erreur de calcul » en expression, mais la règle et le vocabulaire', () => {
    expect(causesDe('expression')).not.toContain('calcul')
    expect(causesDe('expression')).toEqual(expect.arrayContaining(['regle', 'vocabulaire']))
  })

  it('garde le calcul là où l’on calcule', () => {
    expect(causesDe('calcul')).toContain('calcul')
    expect(causesDe('conditions_minimales')).toContain('calcul')
  })

  it('ne propose que des causes connues, et toutes par défaut', () => {
    for (const liste of Object.values(CAUSES_PAR_SECTION)) for (const c of liste) expect(CAUSES).toContain(c)
    expect(causesDe('inconnu')).toEqual(CAUSES)
  })
})
