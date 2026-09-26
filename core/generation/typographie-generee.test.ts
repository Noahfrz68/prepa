import { describe, expect, it } from 'vitest'
import { capitaliserPhrases } from './alea'
import { harmoniserDecimales } from './qcm'
import { genererLot } from './index'

describe('capitaliserPhrases', () => {
  it('met une majuscule en tête de chaque phrase', () => {
    expect(capitaliserPhrases('le nombre a baissé d’un tiers. la mesure est donc efficace.')).toBe(
      'Le nombre a baissé d’un tiers. La mesure est donc efficace.',
    )
    expect(capitaliserPhrases('une note de 4,6 sur 5. la satisfaction est élevée ? oui.')).toBe(
      'Une note de 4,6 sur 5. La satisfaction est élevée ? Oui.',
    )
  })

  it('ne touche pas une virgule décimale', () => {
    expect(capitaliserPhrases('il vaut 4,6 points')).toBe('Il vaut 4,6 points')
  })
})

describe('harmoniserDecimales', () => {
  it('complète les entiers quand une proposition porte des décimales', () => {
    expect(harmoniserDecimales(['5 h', '9 h', '8 h', '18 h', '3,61 h'])).toEqual([
      '5,00 h',
      '9,00 h',
      '8,00 h',
      '18,00 h',
      '3,61 h',
    ])
  })

  it('laisse intactes des propositions homogènes', () => {
    const t = ['5 h', '9 h', '8 h', '18 h', '3 h']
    expect(harmoniserDecimales(t)).toEqual(t)
  })

  it('garde le signe et les milliers', () => {
    expect(harmoniserDecimales(['−5 %', '1 200 €', '2,5 €', '7 €', '9 €'])).toEqual(t2)
  })

  it('ne touche pas une proposition à plusieurs nombres (fraction, durée)', () => {
    const t = ['1/15', '3/10', '9/100', '7/15', '3,5']
    expect(harmoniserDecimales(t)).toEqual(t)
  })
})

const t2 = ['−5,0 %', '1 200,0 €', '2,5 €', '7,0 €', '9,0 €']

describe('génération — typographie', () => {
  it('aucun énoncé de raisonnement ne commence une phrase par une minuscule', () => {
    const lot = genererLot('raisonnement', 200, 20260926)
    const fautifs = lot.questions.filter((q) => /[.!?]\s+[a-zàâéèêîôû]/.test(q.enonce))
    expect(fautifs.map((q) => q.enonce.slice(0, 80))).toEqual([])
  })

  it('en calcul, aucune bonne réponse ne se désigne par sa seule forme décimale', () => {
    const lot = genererLot('calcul', 300, 20260926)
    const fautifs = lot.questions.filter((q) => {
      if (!q.options || q.options.length !== 5) return false
      const decimales = q.options.map((o) => /\d,\d/.test(o))
      const n = decimales.filter(Boolean).length
      const k = 'ABCDE'.indexOf(q.bonneReponse)
      // La seule à avoir (ou à ne pas avoir) de décimales, et c'est la bonne.
      return (n === 1 && decimales[k]) || (n === 4 && !decimales[k])
    })
    expect(fautifs.map((q) => q.options?.join(' | '))).toEqual([])
  })
})
