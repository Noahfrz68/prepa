import { describe, expect, it } from 'vitest'
import { lireFacteurs, lireFraction, lireNombre, lireOuiNon, verifier } from './reponses'

describe('lireNombre', () => {
  it('accepte la virgule, le point, les espaces et le signe %', () => {
    for (const s of ['12,5', '12.5', ' 12,5 % ', '12 , 5', '12,50']) expect(lireNombre(s), s).toBe(12.5)
    expect(lireNombre('1 024')).toBe(1024)
    expect(lireNombre('1 024')).toBe(1024)
    expect(lireNombre(',5')).toBe(0.5)
  })

  it('garde le signe, typographique ou non', () => {
    expect(lireNombre('−4')).toBe(-4)
    expect(lireNombre('-4 %')).toBe(-4)
    expect(lireNombre('+32')).toBe(32)
  })

  it('lit une fraction comme sa valeur', () => {
    expect(lireNombre('3/8')).toBe(0.375)
    expect(lireNombre('1/0')).toBeNull()
  })

  it('refuse ce qui n’est pas un nombre', () => {
    for (const s of ['', 'abc', '12a', '1,2,3', '--4', '%']) expect(lireNombre(s), s).toBeNull()
  })
})

describe('lireFraction', () => {
  it('exige l’écriture a/b', () => {
    expect(lireFraction('3/8')).toEqual({ numerateur: 3, denominateur: 8 })
    expect(lireFraction(' 3 / 8 ')).toEqual({ numerateur: 3, denominateur: 8 })
    expect(lireFraction('0,375')).toBeNull()
    expect(lireFraction('3/0')).toBeNull()
  })
})

describe('lireOuiNon', () => {
  it('comprend les réponses courtes', () => {
    for (const s of ['oui', 'O', 'y', '1']) expect(lireOuiNon(s), s).toBe(true)
    for (const s of ['non', 'N', '0']) expect(lireOuiNon(s), s).toBe(false)
    expect(lireOuiNon('peut-être')).toBeNull()
  })
})

describe('lireFacteurs', () => {
  it('lit les exposants supérieurs, ^ et les répétitions', () => {
    for (const s of ['2³ × 3² × 5', '2^3*3^2*5', '2 2 2 3 3 5', '2x2x2x3x3x5', '5 × 3² × 2³']) {
      expect(lireFacteurs(s), s).toBe(360)
    }
  })

  it('refuse un facteur qui n’est pas premier', () => {
    expect(lireFacteurs('4 × 9 × 10')).toBeNull()
    expect(lireFacteurs('360')).toBeNull()
    expect(lireFacteurs('1')).toBeNull()
  })
})

describe('verifier', () => {
  it('compare avec la tolérance donnée, et seulement elle', () => {
    const tiers = { genre: 'nombre' as const, valeur: 100 / 3, tolerance: 0.06 }
    expect(verifier(tiers, '33,3')).toBe(true)
    expect(verifier(tiers, '33,33')).toBe(true)
    expect(verifier(tiers, '33')).toBe(false)
    expect(verifier({ genre: 'nombre', valeur: 289 }, '288')).toBe(false)
  })

  it('ne confond pas une baisse et une hausse', () => {
    expect(verifier({ genre: 'nombre', valeur: -4 }, '4')).toBe(false)
    expect(verifier({ genre: 'nombre', valeur: -4 }, '−4 %')).toBe(true)
  })

  it('accepte une fraction égale, pas un décimal', () => {
    const f = { genre: 'fraction' as const, numerateur: 3, denominateur: 8 }
    expect(verifier(f, '3/8')).toBe(true)
    expect(verifier(f, '6/16')).toBe(true)
    expect(verifier(f, '0,375')).toBe(false)
  })

  it('lit une lettre sans tenir compte de la casse', () => {
    expect(verifier({ genre: 'lettre', valeur: 'P' }, ' p ')).toBe(true)
    expect(verifier({ genre: 'lettre', valeur: 'P' }, 'Q')).toBe(false)
  })

  it('tient une saisie illisible pour fausse', () => {
    expect(verifier({ genre: 'ouinon', valeur: false }, '')).toBe(false)
    expect(verifier({ genre: 'facteurs', valeur: 12 }, '')).toBe(false)
  })
})
