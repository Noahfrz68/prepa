import { describe, expect, it } from 'vitest'
import { parserListening } from './listening'

const CONVERSATION = `[ACCENT: UK]
[1] Good morning, I'd like to book a meeting room for Thursday.
[2] Certainly. How many people will be attending?
[1] About twelve, and we'll need a projector.
---
Q. What does the man want to do?
A) Cancel a booking
B) Reserve a room
C) Buy a projector
D) Change a date
Réponse : B
Explication : « book a room » = réserver.

Q. What does the man request?
A) Coffee
B) A projector
C) More chairs
D) A larger room
Réponse : B`

describe('parserListening', () => {
  it('parse une conversation à deux locuteurs avec ses questions', () => {
    const { groupes, avertissements } = parserListening(CONVERSATION)
    expect(avertissements).toEqual([])
    expect(groupes).toHaveLength(1)

    const g = groupes[0]
    expect(g.accent).toBe('UK')
    expect(g.segments).toHaveLength(3)
    expect(g.segments.map((s) => s.locuteur)).toEqual([0, 1, 0])
    expect(g.questions).toHaveLength(2)
    expect(g.questions[0].bonneReponse).toBe('B')
    expect(g.questions[0].options).toHaveLength(4)
    expect(g.questions[0].explication).toContain('réserver')
  })

  it('retient l’accent par défaut quand aucun n’est déclaré', () => {
    const texte = CONVERSATION.replace('[ACCENT: UK]\n', '')
    expect(parserListening(texte, 'AU').groupes[0].accent).toBe('AU')
  })

  it('traite un monologue sans marqueur de locuteur', () => {
    const texte = `Attention passengers, the flight to Boston is delayed by thirty minutes.
---
Q. What is announced?
A) A cancellation
B) A delay
Réponse : B`
    const g = parserListening(texte).groupes[0]
    expect(g.segments).toHaveLength(1)
    expect(g.segments[0].locuteur).toBe(0)
  })

  it('accepte l’absence de séparateur', () => {
    const texte = `Attention passengers, the flight is delayed.
Q. What is announced?
A) A cancellation
B) A delay
Réponse : B`
    const g = parserListening(texte).groupes[0]
    expect(g.segments).toHaveLength(1)
    expect(g.questions).toHaveLength(1)
  })

  it('sépare plusieurs enregistrements', () => {
    const texte = `${CONVERSATION}\n\n\n${CONVERSATION.replace('[ACCENT: UK]', '[ACCENT: US]')}`
    const { groupes } = parserListening(texte)
    expect(groupes).toHaveLength(2)
    expect(groupes.map((g) => g.accent)).toEqual(['UK', 'US'])
  })

  it('écarte un bloc sans question exploitable et le dit', () => {
    const texte = `[1] Just a script, nothing else.`
    const { groupes, avertissements } = parserListening(texte)
    expect(groupes).toHaveLength(0)
    expect(avertissements[0]).toMatch(/aucune question/i)
  })

  it('signale une question sans bonne réponse sans perdre les autres', () => {
    const texte = `${CONVERSATION}\n\nQ. Orpheline ?\nA) oui\nB) non`
    const { groupes, avertissements } = parserListening(texte)
    expect(groupes[0].questions).toHaveLength(2)
    expect(avertissements.join(' ')).toMatch(/sans bonne réponse/i)
  })

  it('signale une réponse hors des propositions', () => {
    const texte = `[1] Script.\n---\nQ. Question ?\nA) un\nB) deux\nRéponse : D`
    const { avertissements } = parserListening(texte)
    expect(avertissements.join(' ')).toMatch(/ne correspond à aucune proposition/i)
  })

  it('ne produit rien sur du vide', () => {
    const { groupes, avertissements } = parserListening('   ')
    expect(groupes).toHaveLength(0)
    expect(avertissements[0]).toMatch(/aucun bloc/i)
  })
})
