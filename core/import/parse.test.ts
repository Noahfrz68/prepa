import { describe, expect, it } from 'vitest'
import { decouperBlocs, lireCsv, parserCsv, parserTexteColle } from './parse'

describe('decouperBlocs', () => {
  it('découpe sur les lignes vides', () => {
    expect(decouperBlocs('bloc un\nsuite\n\nbloc deux')).toHaveLength(2)
  })

  it('retombe sur la numérotation quand il n’y a pas de ligne vide', () => {
    const texte = ['1. Première question', 'A) x', 'B) y', '2. Deuxième question', 'A) z', 'B) w'].join('\n')
    expect(decouperBlocs(texte)).toHaveLength(2)
  })

  it('ne confond pas une option avec un début de question', () => {
    const texte = ['1. Question', 'A) 1) piège', 'B) autre', 'Réponse : A'].join('\n')
    expect(decouperBlocs(texte)).toHaveLength(1)
  })

  it('renvoie une liste vide sur du vide', () => {
    expect(decouperBlocs('   \n  ')).toEqual([])
  })
})

describe('parserTexteColle', () => {
  it('parse un QCM classique', () => {
    const texte = [
      '1. Un train parcourt 240 km en 3 h. Quelle est sa vitesse moyenne ?',
      'A) 60 km/h',
      'B) 70 km/h',
      'C) 80 km/h',
      'D) 90 km/h',
      'E) 100 km/h',
      'Réponse : C',
      'Explication : 240 / 3 = 80',
    ].join('\n')

    const { items, avertissements } = parserTexteColle(texte)
    expect(avertissements).toEqual([])
    expect(items).toHaveLength(1)
    expect(items[0].enonce).toContain('240 km')
    expect(items[0].options).toHaveLength(5)
    expect(items[0].bonneReponse).toBe('C')
    expect(items[0].typeItem).toBe('qcm')
    expect(items[0].explication).toBe('240 / 3 = 80')
  })

  it('accepte les variantes de notation des propositions et de la réponse', () => {
    const texte = ['Combien font 2 + 2 ?', '(a. 3', 'b. 4', 'Reponse C'].join('\n')
    // « Reponse C » sans séparateur n'est pas reconnu : on attend un avertissement.
    expect(parserTexteColle(texte).items).toHaveLength(0)

    const texte2 = ['Combien font 2 + 2 ?', 'a. 3', 'b. 4', 'reponse: B'].join('\n')
    const r2 = parserTexteColle(texte2)
    expect(r2.items).toHaveLength(1)
    expect(r2.items[0].bonneReponse).toBe('B')
  })

  it('détecte les conditions minimales', () => {
    const texte = [
      'Quelle est la valeur de x ?',
      '(1) x est un entier pair compris entre 3 et 7.',
      '(2) x est un multiple de 3.',
      'Réponse : A',
    ].join('\n')

    const { items } = parserTexteColle(texte)
    expect(items).toHaveLength(1)
    expect(items[0].typeItem).toBe('conditions_minimales')
    expect(items[0].info1).toContain('entier pair')
    expect(items[0].info2).toContain('multiple de 3')
    expect(items[0].options).toEqual([])
  })

  it('signale un bloc sans bonne réponse au lieu de l’inventer', () => {
    const texte = ['Question orpheline ?', 'A) oui', 'B) non'].join('\n')
    const { items, avertissements } = parserTexteColle(texte)
    expect(items).toHaveLength(0)
    expect(avertissements[0]).toMatch(/bonne réponse/i)
  })

  it('signale une réponse qui ne correspond à aucune proposition', () => {
    const texte = ['Question ?', 'A) oui', 'B) non', 'Réponse : E'].join('\n')
    const { items, avertissements } = parserTexteColle(texte)
    expect(items).toHaveLength(0)
    expect(avertissements[0]).toMatch(/ne correspond à aucune proposition/i)
  })

  it('parse plusieurs questions séparées par des lignes vides', () => {
    const texte = [
      'Q1 ?',
      'A) a',
      'B) b',
      'Réponse : A',
      '',
      'Q2 ?',
      'A) c',
      'B) d',
      'Réponse : B',
    ].join('\n')
    expect(parserTexteColle(texte).items).toHaveLength(2)
  })
})

describe('lireCsv', () => {
  it('gère les guillemets, les séparateurs internes et les guillemets doublés', () => {
    const csv = 'a,b\n"contient, une virgule","dit ""bonjour"""'
    expect(lireCsv(csv)).toEqual([
      ['a', 'b'],
      ['contient, une virgule', 'dit "bonjour"'],
    ])
  })

  it('gère un saut de ligne à l’intérieur d’un champ', () => {
    expect(lireCsv('a\n"deux\nlignes"')).toEqual([['a'], ['deux\nlignes']])
  })
})

describe('parserCsv', () => {
  const entete = 'enonce,option_a,option_b,option_c,bonne_reponse,explication'

  it('parse un CSV valide', () => {
    const csv = [entete, 'Capitale de la France ?,Lyon,Paris,Nice,B,Paris depuis 508'].join('\n')
    const { items, avertissements } = parserCsv(csv)
    expect(avertissements).toEqual([])
    expect(items).toHaveLength(1)
    expect(items[0].options).toEqual(['Lyon', 'Paris', 'Nice'])
    expect(items[0].bonneReponse).toBe('B')
  })

  it('accepte le point-virgule comme séparateur', () => {
    const csv = ['enonce;option_a;option_b;bonne_reponse', 'Deux plus deux ?;3;4;B'].join('\n')
    expect(parserCsv(csv).items).toHaveLength(1)
  })

  it('accepte les alias de colonnes', () => {
    const csv = ['question;a;b;reponse', 'Deux plus deux ?;3;4;B'].join('\n')
    expect(parserCsv(csv).items).toHaveLength(1)
  })

  it('refuse un CSV sans les colonnes obligatoires', () => {
    const { items, avertissements } = parserCsv('foo,bar\n1,2')
    expect(items).toHaveLength(0)
    expect(avertissements[0]).toMatch(/manquantes/i)
  })

  it('ignore et signale les lignes invalides sans perdre les bonnes', () => {
    const csv = [
      entete,
      'Bonne question ?,a,b,c,A,',
      'Mauvaise réponse ?,a,b,c,Z,',
      ',a,b,c,A,',
    ].join('\n')
    const { items, avertissements } = parserCsv(csv)
    expect(items).toHaveLength(1)
    expect(avertissements).toHaveLength(2)
  })
})

describe('propositions sur plusieurs lignes', () => {
  // Défaut constaté sur une annale : les cinq propositions d'une question
  // d'orthographe sont la même longue phrase à quelques lettres près, et la
  // lettre qui les distingue tombe sur la DEUXIÈME ligne. Coupées à la
  // première, trois d'entre elles devenaient rigoureusement identiques — la
  // question n'avait plus de réponse, et rien ne le signalait.
  it('recolle une proposition qui court sur plusieurs lignes', () => {
    const l = String.fromCharCode(10)
    const texte = [
      'Question 1. Quelle phrase est correcte ?',
      'A) On est souvent trompé en amour, souvent blessé et souvent',
      'malheureux ; mais on aime, et on se dit : j’ai aimé.',
      'B) On est souvent trompé en amour, souvent blessé et souvent',
      'malheureux ; mais on aime, et on se dit : j’ai aimés.',
      'C) On est souvent trompé en amour, souvent blessé et souvent',
      'malheureux ; mais on aiment, et on se dit : j’ai aimé.',
      'D) Quatrième proposition.',
      'E) Cinquième proposition.',
      'Réponse : A',
    ].join(l)

    const r = parserTexteColle(texte)
    expect(r.items).toHaveLength(1)
    const o = r.items[0].options

    // Le défaut qui rendait la question insoluble : A, B et C identiques.
    expect(new Set(o).size).toBe(5)
    expect(o[0]).toContain('j’ai aimé.')
    expect(o[1]).toContain('j’ai aimés.')
    expect(o[2]).toContain('on aiment')

    // Et la suite d'une proposition ne doit pas polluer l'énoncé.
    expect(r.items[0].enonce).toBe('Quelle phrase est correcte ?')
  })
})
