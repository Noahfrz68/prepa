import { describe, expect, it } from 'vitest'
import {
  HEURES_MINIMALES_PENTE,
  PLANCHER_ENTRETIEN_MINUTES,
  PLANCHER_URGENCE,
  arbitrer,
  calculerPente,
  ecartACible,
  progressionRelative,
  type EntreeExamen,
} from './arbitrage'

const tm = (o: Partial<EntreeExamen> = {}): EntreeExamen => ({
  examId: 'tagemage',
  libelle: 'TAGE MAGE',
  joursRestants: 150,
  scoreCible: 450,
  scoreEstime: 300,
  penteObservee: null,
  banqueVide: false,
  ...o,
})

const tc = (o: Partial<EntreeExamen> = {}): EntreeExamen => ({
  examId: 'toeic_lr',
  libelle: 'TOEIC',
  joursRestants: 300,
  scoreCible: 850,
  scoreEstime: 700,
  penteObservee: null,
  banqueVide: false,
  ...o,
})

const minutes = (a: ReturnType<typeof arbitrer>, id: string) =>
  a.allocations.find((x) => x.examId === id)!.minutes

describe('progressionRelative', () => {
  // Le cœur du lot : 10 points sur 600 et 10 points sur 990 ne valent pas la
  // même chose. Seule la fraction d'écart refermée est comparable.
  it('normalise deux échelles différentes', () => {
    const tagemage = progressionRelative(tm({ scoreCible: 450, scoreEstime: 300 }), 2) // 2/150
    const toeic = progressionRelative(tc({ scoreCible: 850, scoreEstime: 700 }), 4) // 4/150
    expect(toeic).toBeGreaterThan(tagemage)
    expect(tagemage).toBeCloseTo(2 / 150)
  })

  it('vaut zéro quand la cible est atteinte', () => {
    expect(progressionRelative(tm({ scoreEstime: 460 }), 2)).toBe(0)
    expect(progressionRelative(tm({ scoreEstime: 450 }), 2)).toBe(0)
  })

  it('reste neutre quand l’écart n’est pas mesurable', () => {
    expect(progressionRelative(tm({ scoreCible: null }), 2)).toBe(1)
    expect(progressionRelative(tm({ scoreEstime: null }), 2)).toBe(1)
  })

  it('monte quand l’écart se referme', () => {
    const loin = progressionRelative(tm({ scoreEstime: 200 }), 2)
    const proche = progressionRelative(tm({ scoreEstime: 430 }), 2)
    expect(proche).toBeGreaterThan(loin)
  })
})

describe('ecartACible', () => {
  it('borne à zéro et gère l’absence de cible', () => {
    expect(ecartACible(tm({ scoreEstime: 500 }))).toBe(0)
    expect(ecartACible(tm({ scoreEstime: 300 }))).toBe(150)
    expect(ecartACible(tm({ scoreCible: null }))).toBeNull()
  })
})

describe('arbitrer — planchers', () => {
  it('garantit une heure d’entretien à chaque examen', () => {
    const a = arbitrer([tm(), tc()], 600)
    expect(minutes(a, 'tagemage')).toBeGreaterThanOrEqual(PLANCHER_ENTRETIEN_MINUTES)
    expect(minutes(a, 'toeic_lr')).toBeGreaterThanOrEqual(PLANCHER_ENTRETIEN_MINUTES)
  })

  // Cas nommé dans la spécification : l'examen lointain ne doit pas être
  // abandonné, l'examen proche ne doit pas être négligé.
  it('protège le TOEIC lointain quand le TAGE MAGE est dans 5 semaines', () => {
    const a = arbitrer([tm({ joursRestants: 35 }), tc({ joursRestants: 210 })], 600)
    expect(minutes(a, 'tagemage')).toBeGreaterThanOrEqual(600 * PLANCHER_URGENCE)
    expect(minutes(a, 'toeic_lr')).toBeGreaterThanOrEqual(PLANCHER_ENTRETIEN_MINUTES)
  })

  it('applique le plancher d’urgence à l’examen le plus proche seulement', () => {
    const a = arbitrer([tm({ joursRestants: 20 }), tc({ joursRestants: 30 })], 600)
    expect(a.allocations.find((x) => x.examId === 'tagemage')!.contrainte).toBe('urgence')
    expect(a.allocations.find((x) => x.examId === 'toeic_lr')!.contrainte).not.toBe('urgence')
  })

  it('n’applique aucune urgence quand les deux examens sont loin', () => {
    const a = arbitrer([tm({ joursRestants: 200 }), tc({ joursRestants: 300 })], 600)
    expect(a.allocations.every((x) => x.contrainte !== 'urgence')).toBe(true)
  })

  it('ignore l’urgence d’un examen sans date', () => {
    const a = arbitrer([tm({ joursRestants: null }), tc({ joursRestants: null })], 600)
    expect(a.allocations.every((x) => x.contrainte !== 'urgence')).toBe(true)
  })
})

describe('arbitrer — conservation du budget', () => {
  it('distribue exactement le budget, sans perte ni création', () => {
    for (const budget of [60, 121, 300, 457, 600, 1000]) {
      const a = arbitrer([tm(), tc()], budget)
      const total = a.allocations.reduce((acc, x) => acc + x.minutes, 0)
      expect(total).toBe(budget)
    }
  })

  it('n’attribue rien avec un budget nul', () => {
    const a = arbitrer([tm(), tc()], 0)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(0)
  })

  it('partage proportionnellement quand le budget ne couvre pas les planchers', () => {
    const a = arbitrer([tm(), tc()], 90)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(90)
    expect(a.notes.join(' ')).toMatch(/insuffisant/i)
    expect(minutes(a, 'tagemage')).toBeGreaterThan(0)
    expect(minutes(a, 'toeic_lr')).toBeGreaterThan(0)
  })
})

describe('arbitrer — prorata', () => {
  it('donne plus à l’examen dont l’écart se referme le plus vite, à besoins comparables', () => {
    const a = arbitrer(
      [
        tm({ scoreEstime: 300, penteObservee: 1 }), // 150 d'écart, 1 pt/h → 150 h
        tc({ scoreEstime: 700, penteObservee: 6 }), // 150 d'écart, 6 pt/h → 25 h
      ],
      600,
    )
    expect(minutes(a, 'toeic_lr')).toBeGreaterThan(minutes(a, 'tagemage'))
  })

  // Non-régression : sans plafond de besoin, un examen presque bouclé raflait
  // 92 % du budget parce que refermer ses 10 derniers points donne une énorme
  // fraction d'écart par heure — alors que cinq heures y suffisent.
  it('ne donne pas plus à un examen que ce qu’il lui reste à faire', () => {
    const a = arbitrer(
      [
        tm({ scoreEstime: 440, penteObservee: 2 }), // 10 pts à 2 pt/h → 300 min
        tc({ scoreEstime: 500, penteObservee: 6 }),
      ],
      600,
    )
    expect(minutes(a, 'tagemage')).toBeLessThanOrEqual(300 + PLANCHER_ENTRETIEN_MINUTES)
    expect(minutes(a, 'toeic_lr')).toBeGreaterThan(0)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(600)
  })

  it('signale un volume qui dépasse ce que les deux cibles demandent', () => {
    const a = arbitrer(
      [
        tm({ scoreEstime: 445, penteObservee: 5 }), // 1 h
        tc({ scoreEstime: 845, penteObservee: 5 }), // 1 h
      ],
      900,
    )
    expect(a.notes.join(' ')).toMatch(/d[ée]passe ce qu’il faut|dépasse ce qu’il faut/i)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(900)
  })

  it('ramène un examen dont la cible est atteinte à son seul entretien', () => {
    const a = arbitrer([tm({ scoreEstime: 480 }), tc()], 600)
    expect(minutes(a, 'tagemage')).toBe(PLANCHER_ENTRETIEN_MINUTES)
    expect(minutes(a, 'toeic_lr')).toBe(600 - PLANCHER_ENTRETIEN_MINUTES)
  })

  it('partage également et le signale quand aucune cible n’est renseignée', () => {
    const a = arbitrer([tm({ scoreCible: null }), tc({ scoreCible: null })], 600)
    expect(minutes(a, 'tagemage')).toBe(minutes(a, 'toeic_lr'))
  })

  it('signale une estimation grossière tant qu’aucune pente n’est mesurée', () => {
    expect(arbitrer([tm(), tc()], 600).estimationGrossiere).toBe(true)
    expect(
      arbitrer([tm({ penteObservee: 3 }), tc({ penteObservee: 5 })], 600).estimationGrossiere,
    ).toBe(false)
  })
})

describe('arbitrer — capacité de la banque', () => {
  // Non-régression : observé en conditions réelles. Le TOEIC recevait 2 h 30
  // et n'en planifiait que 30 min faute de contenu ; les deux heures perdues
  // manquaient au TAGE MAGE, dont l'examen était dans cinq semaines.
  it('ne donne pas à un examen plus que ce que sa banque peut absorber', () => {
    const a = arbitrer(
      [tm({ joursRestants: 35 }), tc({ capaciteMinutes: 30 })],
      480,
    )
    expect(minutes(a, 'toeic_lr')).toBeLessThanOrEqual(30)
    expect(minutes(a, 'tagemage')).toBeGreaterThanOrEqual(480 - 30)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(480)
  })

  it('signale une banque trop mince pour remplir même le plancher', () => {
    const a = arbitrer([tm(), tc({ capaciteMinutes: 30 })], 480)
    expect(a.notes.join(' ')).toMatch(/ne permet de composer que 30 min/i)
  })

  it('n’impose aucun plafond quand la capacité n’est pas renseignée', () => {
    const a = arbitrer([tm({ penteObservee: 1 }), tc({ penteObservee: 1 })], 480)
    expect(a.allocations.reduce((acc, x) => acc + x.minutes, 0)).toBe(480)
  })
})

describe('arbitrer — banque vide', () => {
  it('écarte un examen sans questions et donne tout à l’autre', () => {
    const a = arbitrer([tm(), tc({ banqueVide: true })], 600)
    expect(minutes(a, 'toeic_lr')).toBe(0)
    expect(minutes(a, 'tagemage')).toBe(600)
    expect(a.notes.join(' ')).toMatch(/aucune question en banque/i)
  })

  it('ne produit aucune allocation quand les deux banques sont vides', () => {
    const a = arbitrer([tm({ banqueVide: true }), tc({ banqueVide: true })], 600)
    expect(a.allocations.every((x) => x.minutes === 0)).toBe(true)
  })
})

describe('calculerPente', () => {
  const s = (score: number, jour: string) => ({ score, jour })

  it('mesure le gain par heure investie', () => {
    expect(calculerPente([s(300, '2026-08-01'), s(360, '2026-09-01')], 30)).toBeCloseTo(2)
  })

  it('trie par date avant de calculer', () => {
    expect(calculerPente([s(360, '2026-09-01'), s(300, '2026-08-01')], 30)).toBeCloseTo(2)
  })

  it('refuse de projeter sur une seule mesure', () => {
    expect(calculerPente([s(300, '2026-08-01')], 30)).toBeNull()
  })

  it('refuse de projeter sur un volume dérisoire', () => {
    expect(calculerPente([s(300, '2026-08-01'), s(360, '2026-09-01')], HEURES_MINIMALES_PENTE - 0.1)).toBeNull()
  })

  it('ne projette pas une régression ni une stagnation', () => {
    expect(calculerPente([s(360, '2026-08-01'), s(300, '2026-09-01')], 30)).toBeNull()
    expect(calculerPente([s(300, '2026-08-01'), s(300, '2026-09-01')], 30)).toBeNull()
  })
})
