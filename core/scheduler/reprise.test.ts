import { describe, expect, it } from 'vitest'
import { estDue, etatReprise } from './reprise'

describe('etatReprise', () => {
  it('programme la première reprise le lendemain de l’erreur', () => {
    const e = etatReprise('2026-09-24', 0)
    expect(e.dueLe).toBe('2026-09-25')
    expect(estDue(e, '2026-09-24')).toBe(false)
    expect(estDue(e, '2026-09-25')).toBe(true)
  })

  it('espace les reprises suivantes à trois puis sept jours', () => {
    expect(etatReprise('2026-09-25', 1).dueLe).toBe('2026-09-28')
    expect(etatReprise('2026-09-28', 2).dueLe).toBe('2026-10-05')
  })

  it('consolide après trois réussites d’affilée', () => {
    const e = etatReprise('2026-10-05', 3)
    expect(e.consolidee).toBe(true)
    expect(estDue(e, '2027-01-01')).toBe(false)
  })
})
