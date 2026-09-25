import { describe, expect, it } from 'vitest'
import {
  ETAT_INITIAL,
  FACILITE_INITIALE,
  FACILITE_MINIMALE,
  PREMIER_INTERVALLE,
  SECOND_INTERVALLE,
  ajouterJours,
  competencesDues,
  decouperEnLots,
  joursEntre,
  noteDepuisReussite,
  nouvelleFacilite,
  plafonnerAvantExamen,
  reviser,
} from './sm2'

const JOUR = '2026-09-01'

describe('noteDepuisReussite', () => {
  it('note 5 un sans-faute et 0 un effondrement', () => {
    expect(noteDepuisReussite(10, 10)).toBe(5)
    expect(noteDepuisReussite(0, 10)).toBe(0)
  })

  it('est monotone croissante avec le taux', () => {
    const notes = [0, 2, 4, 6, 8, 9, 10].map((j) => noteDepuisReussite(j, 10))
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBeGreaterThanOrEqual(notes[i - 1])
    }
  })

  it('place le seuil de réussite à 70 %', () => {
    expect(noteDepuisReussite(7, 10)).toBe(3)
    expect(noteDepuisReussite(69, 100)).toBeLessThan(3)
  })

  it('renvoie 0 sans tentative, sans diviser par zéro', () => {
    expect(noteDepuisReussite(0, 0)).toBe(0)
  })
})

describe('nouvelleFacilite', () => {
  it('laisse la facilité inchangée à la note 4', () => {
    expect(nouvelleFacilite(2.5, 4)).toBeCloseTo(2.5)
  })

  it('augmente à 5 et diminue en dessous de 4', () => {
    expect(nouvelleFacilite(2.5, 5)).toBeGreaterThan(2.5)
    expect(nouvelleFacilite(2.5, 3)).toBeLessThan(2.5)
    expect(nouvelleFacilite(2.5, 0)).toBeLessThan(2.5)
  })

  it('ne descend jamais sous le plancher, même après des échecs répétés', () => {
    let f = FACILITE_INITIALE
    for (let i = 0; i < 50; i++) f = nouvelleFacilite(f, 0)
    expect(f).toBe(FACILITE_MINIMALE)
  })
})

describe('reviser', () => {
  it('programme la première révision à 1 jour puis à 6', () => {
    const un = reviser(ETAT_INITIAL, 4, JOUR)
    expect(un.repetitions).toBe(1)
    expect(un.intervalleJours).toBe(PREMIER_INTERVALLE)
    expect(un.prochaineRevision).toBe('2026-09-02')

    const deux = reviser(un, 4, '2026-09-02')
    expect(deux.repetitions).toBe(2)
    expect(deux.intervalleJours).toBe(SECOND_INTERVALLE)
    expect(deux.prochaineRevision).toBe('2026-09-08')
  })

  it('multiplie ensuite l’intervalle par la facilité', () => {
    let e = reviser(ETAT_INITIAL, 4, JOUR)
    e = reviser(e, 4, '2026-09-02')
    const trois = reviser(e, 4, '2026-09-08')
    expect(trois.intervalleJours).toBe(Math.round(SECOND_INTERVALLE * trois.facilite))
    expect(trois.intervalleJours).toBeGreaterThan(SECOND_INTERVALLE)
  })

  it('remet le rythme à zéro en cas d’échec, sans effacer la facilité acquise', () => {
    let e = reviser(ETAT_INITIAL, 5, JOUR)
    e = reviser(e, 5, '2026-09-02')
    e = reviser(e, 5, '2026-09-08')
    const facilitéAcquise = e.facilite
    expect(facilitéAcquise).toBeGreaterThan(FACILITE_INITIALE)

    const echec = reviser(e, 1, '2026-09-20')
    expect(echec.repetitions).toBe(0)
    expect(echec.intervalleJours).toBe(PREMIER_INTERVALLE)
    expect(echec.facilite).toBeLessThan(facilitéAcquise)
    expect(echec.facilite).toBeGreaterThanOrEqual(FACILITE_MINIMALE)
  })

  it('espace plus vite une compétence bien maîtrisée qu’une compétence limite', () => {
    const bonne = [5, 5, 5].reduce((e, n, i) => reviser(e, n, ajouterJours(JOUR, i)), ETAT_INITIAL)
    const limite = [3, 3, 3].reduce((e, n, i) => reviser(e, n, ajouterJours(JOUR, i)), ETAT_INITIAL)
    expect(bonne.intervalleJours).toBeGreaterThan(limite.intervalleJours)
  })
})

describe('dates', () => {
  it('ajoute et retranche des jours en franchissant les mois', () => {
    expect(ajouterJours('2026-01-31', 1)).toBe('2026-02-01')
    expect(ajouterJours('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('compte les jours entre deux dates, dans les deux sens', () => {
    expect(joursEntre('2026-09-01', '2026-09-08')).toBe(7)
    expect(joursEntre('2026-09-08', '2026-09-01')).toBe(-7)
  })

  it('franchit une année bissextile', () => {
    expect(ajouterJours('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('plafonnerAvantExamen', () => {
  it('ne touche pas une échéance qui tombe avant l’examen', () => {
    expect(plafonnerAvantExamen('2026-10-01', JOUR, '2026-12-08')).toBe('2026-10-01')
  })

  it('ramène dans la fenêtre une échéance postérieure à l’examen', () => {
    // 98 jours jusqu'à la veille : l'échéance revient à mi-chemin.
    const r = plafonnerAvantExamen('2027-06-01', JOUR, '2026-12-08')
    expect(joursEntre(JOUR, r)).toBeGreaterThan(0)
    expect(joursEntre(r, '2026-12-07')).toBeGreaterThanOrEqual(0)
  })

  it('ne fait rien sans date d’examen', () => {
    expect(plafonnerAvantExamen('2030-01-01', JOUR, null)).toBe('2030-01-01')
  })

  it('renvoie aujourd’hui quand l’examen est déjà passé ou imminent', () => {
    expect(plafonnerAvantExamen('2027-01-01', JOUR, '2026-09-01')).toBe(JOUR)
    expect(plafonnerAvantExamen('2027-01-01', JOUR, '2026-08-01')).toBe(JOUR)
  })

  it('garantit qu’une compétence trop espacée sera revue avant l’examen', () => {
    let e = ETAT_INITIAL
    let jour = JOUR
    // Enchaîne des révisions parfaites : l'intervalle explose vite.
    for (let i = 0; i < 8; i++) {
      e = reviser(e, 5, jour)
      jour = e.prochaineRevision!
    }
    const plafonnee = plafonnerAvantExamen(e.prochaineRevision!, JOUR, '2026-12-08')
    expect(joursEntre(plafonnee, '2026-12-07')).toBeGreaterThanOrEqual(0)
  })
})

describe('decouperEnLots', () => {
  const t = (jour: string, juste: boolean) => ({ jour, juste })

  it('referme un lot dès que le seuil est atteint', () => {
    const lots = decouperEnLots(
      [t('2026-09-01', true), t('2026-09-01', false), t('2026-09-02', true)],
      3,
    )
    expect(lots).toEqual([{ jour: '2026-09-02', n: 3, justes: 2 }])
  })

  // Non-régression : c'est le cas qui empêchait le calendrier de se déclencher.
  it('traverse les séances au lieu d’exiger le seuil dans chacune', () => {
    const lots = decouperEnLots(
      [t('2026-09-01', true), t('2026-09-05', true), t('2026-09-09', false)],
      3,
    )
    expect(lots).toHaveLength(1)
    expect(lots[0].jour).toBe('2026-09-09')
  })

  it('date le lot par sa dernière tentative', () => {
    const lots = decouperEnLots(
      [t('2026-09-01', true), t('2026-09-02', true), t('2026-09-03', true)],
      3,
    )
    expect(lots[0].jour).toBe('2026-09-03')
  })

  it('laisse de côté un reliquat insuffisant plutôt que de programmer sur du bruit', () => {
    const lots = decouperEnLots(
      [t('2026-09-01', true), t('2026-09-02', true), t('2026-09-03', true), t('2026-09-04', false)],
      3,
    )
    expect(lots).toHaveLength(1)
  })

  it('produit plusieurs lots successifs', () => {
    const suite = Array.from({ length: 9 }, (_, i) => t(`2026-09-0${i + 1}`, i % 2 === 0))
    expect(decouperEnLots(suite, 3)).toHaveLength(3)
  })

  it('ne produit rien sur une liste vide', () => {
    expect(decouperEnLots([], 3)).toEqual([])
  })
})

describe('competencesDues', () => {
  it('classe les plus en retard en premier', () => {
    const d = competencesDues(
      [
        { skillId: 'a', prochaineRevision: '2026-08-30' },
        { skillId: 'b', prochaineRevision: '2026-08-20' },
        { skillId: 'c', prochaineRevision: '2026-09-01' },
      ],
      JOUR,
    )
    expect(d.map((x) => x.skillId)).toEqual(['b', 'a', 'c'])
    expect(d[0].joursDeRetard).toBe(12)
  })

  it('exclut ce qui n’est pas encore dû', () => {
    const d = competencesDues([{ skillId: 'a', prochaineRevision: '2026-09-05' }], JOUR)
    expect(d).toHaveLength(0)
  })

  it('traite une compétence jamais révisée comme prioritaire', () => {
    const d = competencesDues(
      [
        { skillId: 'jamais', prochaineRevision: null },
        { skillId: 'retard', prochaineRevision: '2026-08-01' },
      ],
      JOUR,
    )
    expect(d[0].skillId).toBe('jamais')
  })
})
