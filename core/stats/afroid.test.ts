import { describe, expect, it } from 'vitest'
import { reussiteAFroid } from './afroid'

describe('réussite à froid', () => {
  it('sépare la première rencontre d’un scénario de l’habitude', () => {
    const t = (scenario: string | null, juste: boolean) => ({ section: 'calcul', scenario, juste })
    const r = reussiteAFroid([
      t('urne', false), // 1re rencontre : à froid
      t('urne', true), // 2e, 3e : ni l'un ni l'autre
      t('urne', true),
      t('urne', true), // 4e : habitude
      t('urne', true),
      t('dés', true), // autre scénario : à froid
    ])
    expect(r).toEqual([{ section: 'calcul', froid: { n: 2, justes: 1 }, habitude: { n: 2, justes: 2 } }])
  })

  it('ignore les sous-tests où la notion ne s’applique pas', () => {
    expect(reussiteAFroid([{ section: 'logique', scenario: null, juste: true }])).toEqual([])
  })
})
