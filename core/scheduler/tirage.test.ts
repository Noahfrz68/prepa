import { describe, expect, it } from 'vitest'
import { aleaDepuis } from '@/core/generation/alea'
import { modeleEnonce, tirageEquilibre, type Candidat } from './tirage'

const candidat = (id: number, skillId: string, enonce: string, vu = 0): Candidat => ({
  id,
  skillId,
  enonce,
  vu,
})

describe('modeleEnonce', () => {
  it('ignore les nombres et les accents', () => {
    expect(
      modeleEnonce("Le chiffre d'affaires d'un atelier augmente de 50 %"),
    ).toBe(modeleEnonce("Le chiffre d'affaires d'un club augmente de 20 %"))
    expect(modeleEnonce('Un vélo coûte 1 400 €.')).toBe(modeleEnonce('Un velo coute 900 €.'))
  })
})

describe('tirageEquilibre', () => {
  // Banque déséquilibrée : 30 questions de pourcentages, 2 par autre compétence.
  const banque: Candidat[] = [
    ...Array.from({ length: 30 }, (_, i) =>
      candidat(i, 'pct', `Le chiffre d'affaires d'un atelier ${i} augmente de ${i} %`),
    ),
    ...['a', 'b', 'c', 'd', 'e', 'f'].flatMap((s, k) => [
      candidat(100 + 2 * k, s, `Question ${s} numéro un`),
      candidat(101 + 2 * k, s, `Autre énoncé ${s}`),
    ]),
  ]
  const poids = new Map([['pct', 1], ['a', 1], ['b', 1], ['c', 1], ['d', 1], ['e', 1], ['f', 1]])

  it('couvre autant de sous-compétences que de questions demandées', () => {
    for (let graine = 1; graine <= 20; graine++) {
      const t = tirageEquilibre(banque, 7, poids, aleaDepuis(graine))
      expect(t).toHaveLength(7)
      expect(new Set(t.map((c) => c.skillId)).size).toBe(7)
    }
  })

  it('ne sert jamais deux fois le même modèle quand il existe autre chose', () => {
    // La banque compte 13 modèles distincts : les 30 questions de
    // pourcentages n'en font qu'un.
    for (let graine = 1; graine <= 20; graine++) {
      const t = tirageEquilibre(banque, 13, poids, aleaDepuis(graine))
      const modeles = t.map((c) => modeleEnonce(c.enonce))
      expect(t).toHaveLength(13)
      expect(new Set(modeles).size).toBe(13)
    }
  })

  it('préfère les questions jamais vues', () => {
    const b = [candidat(1, 'a', 'x un', 3), candidat(2, 'a', 'y deux', 0)]
    expect(tirageEquilibre(b, 1, new Map([['a', 1]]), aleaDepuis(1))[0].id).toBe(2)
  })

  it('relâche les contraintes plutôt que de rendre moins que demandé', () => {
    const b = Array.from({ length: 5 }, (_, i) => candidat(i, 'pct', `Même modèle ${i}`))
    expect(tirageEquilibre(b, 4, new Map([['pct', 1]]), aleaDepuis(1))).toHaveLength(4)
  })

  it('suit le poids des compétences à l’examen', () => {
    const b = [
      ...Array.from({ length: 50 }, (_, i) => candidat(i, 'lourde', `Lourde ${i} ${'x'.repeat(i)}`)),
      ...Array.from({ length: 50 }, (_, i) => candidat(100 + i, 'legere', `Légère ${i} ${'y'.repeat(i)}`)),
    ]
    const p = new Map([['lourde', 9], ['legere', 1]])
    let lourdesEnPremier = 0
    for (let graine = 1; graine <= 200; graine++) {
      if (tirageEquilibre(b, 1, p, aleaDepuis(graine))[0].skillId === 'lourde') lourdesEnPremier++
    }
    expect(lourdesEnPremier).toBeGreaterThan(160)
  })
})
