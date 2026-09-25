import { describe, expect, it } from 'vitest'
import {
  ACCENTS,
  ECART_ACCENT_SIGNIFICATIF,
  MINIMUM_PAR_ACCENT,
  PARTS_LISTENING,
  PARTS_LISTENING_PAR_ID,
  accentFaible,
  accentPourIndex,
  type Accent,
  type StatAccent,
} from './listening'

describe('structure des parts', () => {
  it('couvre les quatre parts du Listening', () => {
    expect(PARTS_LISTENING.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(PARTS_LISTENING.reduce((acc, p) => acc + p.questions, 0)).toBe(100)
  })

  // La compétence réellement testée en Part 3 et 4 : lire les questions
  // pendant le silence. Elle n'existe pas en Part 1 et 2.
  it('ne prévoit de préparation que là où il y a des questions à lire', () => {
    expect(PARTS_LISTENING_PAR_ID.get('p1')!.secondesPreparation).toBe(0)
    expect(PARTS_LISTENING_PAR_ID.get('p2')!.secondesPreparation).toBe(0)
    expect(PARTS_LISTENING_PAR_ID.get('p3')!.secondesPreparation).toBeGreaterThan(0)
    expect(PARTS_LISTENING_PAR_ID.get('p4')!.secondesPreparation).toBeGreaterThan(0)
  })

  it('n’affiche les questions avant l’audio que quand elles sont écrites', () => {
    expect(PARTS_LISTENING_PAR_ID.get('p1')!.questionsVisiblesAvant).toBe(false)
    expect(PARTS_LISTENING_PAR_ID.get('p3')!.questionsVisiblesAvant).toBe(true)
  })

  it('groupe trois questions par enregistrement en Part 3 et 4', () => {
    expect(PARTS_LISTENING_PAR_ID.get('p3')!.questionsParAudio).toBe(3)
    expect(PARTS_LISTENING_PAR_ID.get('p4')!.questionsParAudio).toBe(3)
    expect(PARTS_LISTENING_PAR_ID.get('p1')!.questionsParAudio).toBe(1)
  })

  it('prévoit deux locuteurs pour les conversations', () => {
    expect(PARTS_LISTENING_PAR_ID.get('p3')!.locuteurs).toBe(2)
    expect(PARTS_LISTENING_PAR_ID.get('p4')!.locuteurs).toBe(1)
  })
})

describe('accentPourIndex', () => {
  it('alterne les quatre accents', () => {
    const suite = Array.from({ length: 8 }, (_, i) => accentPourIndex(i))
    expect(new Set(suite).size).toBe(ACCENTS.length)
    expect(suite[0]).toBe(suite[4])
  })

  it('tourne sur ce qui est disponible', () => {
    const suite = Array.from({ length: 4 }, (_, i) => accentPourIndex(i, ['US', 'UK']))
    expect(suite).toEqual(['US', 'UK', 'US', 'UK'])
  })

  it('retombe sur l’américain si rien n’est disponible', () => {
    expect(accentPourIndex(0, [])).toBe('US')
  })
})

describe('accentFaible', () => {
  const stat = (accent: Accent, n: number, taux: number): StatAccent => ({
    accent,
    libelle: accent,
    n,
    justes: Math.round(n * taux),
    tauxReussite: n === 0 ? null : taux,
  })

  it('repère un accent nettement en retrait', () => {
    const f = accentFaible([
      stat('US', 20, 0.8),
      stat('UK', 20, 0.75),
      stat('AU', 20, 0.4),
      stat('CA', 20, 0.78),
    ])
    expect(f?.accent).toBe('AU')
  })

  it('ne conclut pas sur un écart faible', () => {
    const f = accentFaible([
      stat('US', 20, 0.8),
      stat('UK', 20, 0.75),
      stat('AU', 20, 0.72),
    ])
    expect(f).toBeNull()
  })

  it('exige assez de matière par accent', () => {
    const f = accentFaible([
      stat('US', 20, 0.8),
      stat('AU', MINIMUM_PAR_ACCENT - 1, 0.1),
    ])
    expect(f).toBeNull()
  })

  it('ne conclut pas sur un seul accent mesuré', () => {
    expect(accentFaible([stat('US', 50, 0.3)])).toBeNull()
  })

  it('applique le seuil de façon stricte', () => {
    const f = accentFaible([
      stat('US', 20, 0.8),
      stat('AU', 20, 0.8 - ECART_ACCENT_SIGNIFICATIF + 0.01),
    ])
    expect(f).toBeNull()
  })
})
