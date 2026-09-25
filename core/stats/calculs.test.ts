import { describe, expect, it } from 'vitest'
import {
  RATIO_PUITS,
  SEUIL_PUITS,
  SEUIL_FIABILITE,
  evaluerRegleRemplissage,
  calibrer,
  classerLeviers,
  diagnostiquerCalibration,
  questionsAExpedier,
  mediane,
  qualifierCompetences,
  type Niveau,
} from './calculs'

describe('calibrer', () => {
  it('renvoie toujours les quatre niveaux, même sans données', () => {
    const c = calibrer([])
    expect(c).toHaveLength(4)
    expect(c.map((x) => x.niveau)).toEqual([1, 2, 3, 4])
    expect(c.every((x) => x.verdict === 'donnees_insuffisantes')).toBe(true)
  })

  it("calcule l'espérance sur les données réelles", () => {
    // Sans pénalité : 0,25 × 4 = 1
    const [n1] = calibrer([{ niveau: 1, n: 100, justes: 25 }])
    expect(n1.tauxReussite).toBeCloseTo(0.25)
    expect(n1.esperance).toBeCloseTo(1)
    expect(n1.verdict).toBe('repondre')
  })

  // Le verdict porte sur le TEMPS, pas sur l'abstention : en dessous du hasard,
  // chercher ne rapporte rien de plus que cocher au jugé.
  it('conclut « coche et passe » quand on ne fait pas mieux que le hasard', () => {
    const [n1] = calibrer([{ niveau: 1, n: 100, justes: 10 }])
    expect(n1.esperance).toBeCloseTo(0.4)
    expect(n1.verdict).toBe('cocher_et_passer')
  })

  it('range le hasard exact du côté des questions à expédier', () => {
    const [n1] = calibrer([{ niveau: 1, n: 100, justes: 20 }])
    expect(n1.esperance).toBeCloseTo(0.8)
    expect(n1.verdict).toBe('cocher_et_passer')
  })

  // L'espérance n'est jamais négative, quel que soit le taux observé.
  it('ne produit jamais d’espérance négative', () => {
    for (const justes of [0, 1, 10, 20, 50, 100]) {
      expect(calibrer([{ niveau: 1, n: 100, justes }])[0].esperance).toBeGreaterThanOrEqual(0)
    }
  })

  it('signale une mesure non fiable en dessous du seuil', () => {
    const [n1] = calibrer([{ niveau: 1, n: SEUIL_FIABILITE - 1, justes: 10 }])
    expect(n1.fiable).toBe(false)
    const [m1] = calibrer([{ niveau: 1, n: SEUIL_FIABILITE, justes: 10 }])
    expect(m1.fiable).toBe(true)
  })
})

describe('diagnostiquerCalibration', () => {
  it('refuse de conclure sous le seuil de fiabilité', () => {
    const d = diagnostiquerCalibration(calibrer([{ niveau: 4, n: 10, justes: 3 }]))
    expect(d.diagnostic).toBe('donnees_insuffisantes')
  })

  it('détecte la surconfiance', () => {
    // Certain à 92 % attendu, 40 % observé sur 60 tentatives.
    const d = diagnostiquerCalibration(calibrer([{ niveau: 4, n: 60, justes: 24 }]))
    expect(d.diagnostic).toBe('surconfiance')
    expect(d.ecartMoyen).toBeLessThan(0)
  })

  it('détecte la sous-confiance', () => {
    // Hésitant à 45 % attendu, 85 % observé.
    const d = diagnostiquerCalibration(calibrer([{ niveau: 2, n: 60, justes: 51 }]))
    expect(d.diagnostic).toBe('sousconfiance')
    expect(d.ecartMoyen).toBeGreaterThan(0)
  })

  // Non-régression : observé sur données réelles. Une moyenne pondérée sur les
  // quatre niveaux concluait « correcte » alors que le niveau 4 était à 68 %
  // pour 92 % attendus. Le haut de l'échelle ne doit jamais être dilué.
  it('ne laisse pas un bas bien calibré masquer une surconfiance en haut', () => {
    const d = diagnostiquerCalibration(
      calibrer([
        { niveau: 1, n: 44, justes: 8 }, // 18 % — conforme
        { niveau: 2, n: 61, justes: 30 }, // 49 % — conforme
        { niveau: 3, n: 60, justes: 40 }, // 67 % — conforme
        { niveau: 4, n: 60, justes: 41 }, // 68 % pour 92 % attendus
      ]),
    )
    expect(d.diagnostic).toBe('surconfiance')
    expect(d.ecartHaut).toBeLessThan(-0.1)
    // La moyenne globale, elle, reste dans la tolérance : c'est bien elle le piège.
    expect(Math.abs(d.ecartMoyen)).toBeLessThan(0.1)
  })

  it('ne conclut pas sur un haut de gamme trop peu fourni', () => {
    const d = diagnostiquerCalibration(
      calibrer([
        { niveau: 1, n: 40, justes: 8 },
        { niveau: 4, n: 5, justes: 0 },
      ]),
    )
    expect(d.diagnostic).toBe('correcte')
  })

  it('juge correcte une calibration alignée sur les repères', () => {
    const d = diagnostiquerCalibration(
      calibrer([
        { niveau: 1, n: 20, justes: 4 }, // 20 %
        { niveau: 2, n: 20, justes: 9 }, // 45 %
        { niveau: 3, n: 20, justes: 14 }, // 70 %
        { niveau: 4, n: 20, justes: 18 }, // 90 %
      ]),
    )
    expect(d.diagnostic).toBe('correcte')
  })
})

describe('evaluerRegleRemplissage', () => {
  it('chiffre ce que coûtent les cases laissées vides', () => {
    const r = evaluerRegleRemplissage(20, 100)
    expect(r.tauxBlanches).toBeCloseTo(0.2)
    expect(r.coutEstime).toBeCloseTo(16) // 20 × 0,8
  })

  it('ne compte aucun coût quand rien n’a été laissé vide', () => {
    expect(evaluerRegleRemplissage(0, 100).coutEstime).toBe(0)
  })

  it('gère l’absence de tentative', () => {
    expect(evaluerRegleRemplissage(0, 0).tauxBlanches).toBe(0)
  })
})

describe('mediane', () => {
  it('gère un nombre impair de valeurs', () => {
    expect(mediane([5, 1, 3])).toBe(3)
  })
  it('moyenne les deux valeurs centrales si le nombre est pair', () => {
    expect(mediane([1, 2, 3, 4])).toBe(2.5)
  })
  it('renvoie null sur une liste vide', () => {
    expect(mediane([])).toBeNull()
  })
  it('ne modifie pas le tableau source', () => {
    const src = [3, 1, 2]
    mediane(src)
    expect(src).toEqual([3, 1, 2])
  })
})

describe('qualifierCompetences', () => {
  const base = { skillId: 's', libelle: 'l', section: 'calcul' }

  it('marque une compétence lente et ratée comme puits de temps', () => {
    const [c] = qualifierCompetences([{ ...base, n: 20, justes: 6, tempsMedianMs: 160_000 }], 80_000)
    expect(c.ratioTemps).toBeCloseTo(2)
    expect(c.estPuits).toBe(true)
  })

  it('ne marque pas une compétence lente mais réussie', () => {
    const [c] = qualifierCompetences([{ ...base, n: 20, justes: 18, tempsMedianMs: 160_000 }], 80_000)
    expect(c.estPuits).toBe(false)
  })

  it('ne marque pas une compétence ratée mais rapide', () => {
    const [c] = qualifierCompetences([{ ...base, n: 20, justes: 6, tempsMedianMs: 40_000 }], 80_000)
    expect(c.estPuits).toBe(false)
  })

  it('exige un minimum de tentatives', () => {
    const [c] = qualifierCompetences([{ ...base, n: 2, justes: 0, tempsMedianMs: 300_000 }], 80_000)
    expect(c.estPuits).toBe(false)
    // 6 tentatives à 33 % ne suffisent plus à conseiller d'expédier un type.
    const [d] = qualifierCompetences([{ ...base, n: SEUIL_PUITS - 1, justes: 2, tempsMedianMs: 300_000 }], 80_000)
    expect(d.estPuits).toBe(false)
  })

  it('juge la lenteur par rapport au sous-test de la compétence', () => {
    const medianes = new Map([['logique', 120_000], ['expression', 20_000]])
    // 100 s est rapide pour la logique, lent pour l'expression.
    const [logique, expression] = qualifierCompetences(
      [
        { ...base, section: 'logique', n: 20, justes: 6, tempsMedianMs: 100_000 },
        { ...base, section: 'expression', n: 20, justes: 6, tempsMedianMs: 100_000 },
      ],
      medianes,
    )
    expect(logique.estPuits).toBe(false)
    expect(expression.estPuits).toBe(true)
  })

  it('reste neutre quand aucun temps médian global n’est disponible', () => {
    const [c] = qualifierCompetences([{ ...base, n: 20, justes: 2, tempsMedianMs: 999_000 }], null)
    expect(c.ratioTemps).toBe(1)
    expect(c.estPuits).toBe(false)
  })

  it('applique le seuil de ratio de façon stricte', () => {
    const [c] = qualifierCompetences(
      [{ ...base, n: 20, justes: 2, tempsMedianMs: RATIO_PUITS * 80_000 }],
      80_000,
    )
    expect(c.estPuits).toBe(false)
  })
})

describe('classerLeviers', () => {
  it('classe par points perdus sur 15 questions et calcule les parts', () => {
    const l = classerLeviers([
      { section: 'calcul', n: 10, justes: 9, fausses: 1, blanches: 0, points: 36, tempsMs: 0 },
      { section: 'logique', n: 10, justes: 2, fausses: 8, blanches: 0, points: 8, tempsMs: 0 },
    ])
    expect(l[0].section).toBe('logique')
    expect(l[0].pointsPerdus).toBe(48) // 80 % ratés × 60
    expect(l[1].pointsPerdus).toBe(6) // 10 % ratés × 60
    expect(l[0].partDesPertes + l[1].partDesPertes).toBeCloseTo(1)
  })

  it('ne confond pas volume d’entraînement et faiblesse', () => {
    // Beaucoup pratiqué et bien réussi contre peu pratiqué et mal réussi.
    const l = classerLeviers([
      { section: 'calcul', n: 378, justes: 299, fausses: 79, blanches: 0, points: 1196, tempsMs: 0 },
      { section: 'expression', n: 81, justes: 38, fausses: 43, blanches: 0, points: 152, tempsMs: 0 },
    ])
    expect(l[0].section).toBe('expression')
  })

  it('ne produit pas de perte négative sur un sans-faute', () => {
    const [l] = classerLeviers([
      { section: 'calcul', n: 5, justes: 5, fausses: 0, blanches: 0, points: 20, tempsMs: 0 },
    ])
    expect(l.pointsPerdus).toBe(0)
    expect(l.partDesPertes).toBe(0)
  })
})

describe('questionsAExpedier', () => {
  const calib = calibrer([
    { niveau: 1, n: 50, justes: 5 }, // 10 % : pas mieux que le hasard
    { niveau: 2, n: 50, justes: 30 }, // 60 % : il y a quelque chose à chercher
  ])

  it('compte les questions abordées sans faire mieux que le hasard', () => {
    const r = questionsAExpedier(
      [
        { niveau: 1 as Niveau, n: 30 },
        { niveau: 2 as Niveau, n: 70 },
      ],
      calib,
    )
    expect(r.expediees).toBe(5) // 30 % de 15
    expect(r.fiable).toBe(true)
  })

  it('ne recommande rien sans données', () => {
    expect(questionsAExpedier([], calib)).toEqual({ expediees: 0, n: 0, fiable: false })
  })

  it('signale une base trop mince', () => {
    const r = questionsAExpedier([{ niveau: 1 as Niveau, n: 4 }], calib)
    expect(r.fiable).toBe(false)
  })
})
