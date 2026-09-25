import { describe, expect, it } from 'vitest'
import {
  GRILLES,
  MINIMUM_ESTIMATION_WRITING,
  NOTE_MAX_WRITING,
  TACHES_PAR_TYPE,
  TACHES_WRITING,
  compterMots,
  estimerWriting,
  noteGlobale,
} from './writing'

describe('structure de l’épreuve', () => {
  it('couvre les huit tâches', () => {
    const numeros = TACHES_WRITING.flatMap((t) => t.numeros)
    expect(numeros).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('identifie les tâches qui demandent une image', () => {
    expect(TACHES_PAR_TYPE.get('phrase_image')!.necessiteImage).toBe(true)
    expect(TACHES_PAR_TYPE.get('reponse_courriel')!.necessiteImage).toBe(false)
    expect(TACHES_PAR_TYPE.get('essai_opinion')!.necessiteImage).toBe(false)
  })

  it('donne le poids le plus lourd à l’essai', () => {
    const essai = TACHES_PAR_TYPE.get('essai_opinion')!
    for (const t of TACHES_WRITING) {
      if (t.type !== 'essai_opinion') expect(essai.noteMax).toBeGreaterThan(t.noteMax)
    }
  })

  // Contraste avec le Speaking : sur un texte, tous les critères sont
  // évaluables. C'est ce qui rend cette épreuve notable honnêtement.
  it('n’a que des critères évaluables sur un texte', () => {
    for (const criteres of Object.values(GRILLES)) {
      expect(criteres.every((c) => c.fiable)).toBe(true)
      expect(criteres.length).toBeGreaterThan(0)
    }
  })
})

describe('compterMots', () => {
  it('compte les mots en ignorant les espaces multiples', () => {
    expect(compterMots('  The   quarterly report is ready  ')).toBe(5)
  })

  it('renvoie zéro sur du vide', () => {
    expect(compterMots('   ')).toBe(0)
  })
})

describe('noteGlobale', () => {
  it('donne la note maximale sur un sans-faute', () => {
    const notes = GRILLES.essai_opinion.map((c) => ({ id: c.id, note: c.noteMax, justification: '' }))
    expect(noteGlobale('essai_opinion', notes)).toBe(TACHES_PAR_TYPE.get('essai_opinion')!.noteMax)
  })

  it('donne zéro quand rien n’est acquis', () => {
    expect(noteGlobale('essai_opinion', [])).toBe(0)
  })

  it('borne une note hors barème plutôt que de la propager', () => {
    const notes = GRILLES.phrase_image.map((c) => ({ id: c.id, note: 99, justification: '' }))
    expect(noteGlobale('phrase_image', notes)).toBe(TACHES_PAR_TYPE.get('phrase_image')!.noteMax)
  })

  it('ignore un critère inconnu', () => {
    expect(noteGlobale('phrase_image', [{ id: 'invente', note: 3, justification: '' }])).toBe(0)
  })
})

describe('estimerWriting', () => {
  it('extrapole sur 200 à partir des tâches faites', () => {
    const e = estimerWriting([
      { type: 'essai_opinion', note: 5 },
      { type: 'reponse_courriel', note: 4 },
    ])
    expect(e.score).toBe(NOTE_MAX_WRITING)
  })

  it('renvoie zéro sans production', () => {
    expect(estimerWriting([])).toEqual({ score: 0, n: 0, fiable: false })
  })

  it('signale un échantillon trop mince', () => {
    expect(estimerWriting([{ type: 'essai_opinion', note: 3 }]).fiable).toBe(false)
    expect(
      estimerWriting(
        Array.from({ length: MINIMUM_ESTIMATION_WRITING }, () => ({
          type: 'essai_opinion' as const,
          note: 3,
        })),
      ).fiable,
    ).toBe(true)
  })

  it('normalise entre des tâches de barèmes différents', () => {
    // Moitié du barème dans les deux cas : le score doit être le même.
    const a = estimerWriting([{ type: 'phrase_image', note: 1.5 }])
    const b = estimerWriting([{ type: 'essai_opinion', note: 2.5 }])
    expect(a.score).toBe(b.score)
  })
})
