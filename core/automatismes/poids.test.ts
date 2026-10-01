import { describe, expect, it } from 'vitest'
import { aleaDepuis } from '@/core/generation/alea'
import { choisirQuestion, ECART_MIN, JEUX, jeu, jeuxDe, MELANGE } from './index'
import { apresReponse, POIDS, poidsFait, SERIE_MAITRISE, tirerPondere, type EtatsFaits } from './poids'

const JOUR = 86_400_000
const MAINTENANT = Date.parse('2026-10-01T12:00:00Z')

describe('poidsFait', () => {
  it('suit l’état du fait', () => {
    expect(poidsFait(undefined, MAINTENANT)).toBe(POIDS.nouveau)
    expect(poidsFait({ serie: 0, aRevoir: true, vuLe: MAINTENANT }, MAINTENANT)).toBe(POIDS.aRevoir)
    expect(poidsFait({ serie: 1, aRevoir: false, vuLe: MAINTENANT }, MAINTENANT)).toBe(POIDS.enCours)
  })

  it('espace un fait maîtrisé : rare juste après, de plus en plus présent ensuite', () => {
    const maitrise = (jours: number) => poidsFait({ serie: SERIE_MAITRISE, aRevoir: false, vuLe: MAINTENANT - jours * JOUR }, MAINTENANT)
    expect(maitrise(0)).toBeLessThan(maitrise(3))
    expect(maitrise(3)).toBeLessThan(maitrise(10))
    expect(maitrise(10)).toBeGreaterThan(POIDS.enCours)
  })
})

describe('apresReponse', () => {
  it('allonge la série sur une réponse juste et rapide', () => {
    const a = apresReponse(undefined, true, false, MAINTENANT)
    expect(a).toEqual({ serie: 1, aRevoir: false, vuLe: MAINTENANT })
    expect(apresReponse(a, true, false, MAINTENANT + 1).serie).toBe(2)
  })

  it('remet à revoir sur une erreur ou une lenteur, série remise à zéro', () => {
    const su = { serie: 5, aRevoir: false, vuLe: 0 }
    expect(apresReponse(su, false, false, MAINTENANT)).toEqual({ serie: 0, aRevoir: true, vuLe: MAINTENANT })
    expect(apresReponse(su, true, true, MAINTENANT)).toEqual({ serie: 0, aRevoir: true, vuLe: MAINTENANT })
  })
})

describe('tirerPondere', () => {
  it('tire en proportion des poids', () => {
    const a = aleaDepuis(1)
    const n = { a: 0, b: 0, c: 0 }
    for (let i = 0; i < 20_000; i++) n[tirerPondere(a, ['a', 'b', 'c'] as const, [1, 3, 0])]++
    expect(n.c).toBe(0)
    expect(n.b / n.a).toBeGreaterThan(2.6)
    expect(n.b / n.a).toBeLessThan(3.4)
  })
})

describe('choisirQuestion', () => {
  /** Fréquence d'un fait sur `n` tirages indépendants, sans historique récent. */
  function frequence(cle: string, etats: EtatsFaits, jeux = jeuxDe('lettres'), n = 3000): number {
    const a = aleaDepuis(99)
    let vus = 0
    for (let i = 0; i < n; i++) if (choisirQuestion(jeux, a, [], etats, MAINTENANT).cle === cle) vus++
    return vus / n
  }

  it('fait revenir bien plus souvent un fait à revoir', () => {
    const neutre = frequence('rang:P', {})
    const aRevoir = frequence('rang:P', { 'rang:P': { serie: 0, aRevoir: true, vuLe: MAINTENANT } })
    expect(aRevoir).toBeGreaterThan(5 * neutre)
    // Assez pour revenir plusieurs fois dans une partie de 20 questions.
    expect(aRevoir).toBeGreaterThan(0.12)
  })

  // Une table précise sort une fois sur mille au hasard : sans question
  // ciblée, la ratée ne reviendrait jamais dans la partie.
  it('fait revenir un fait rare au tirage, même dans le Mélange', () => {
    const etats: EtatsFaits = { 'table:7×8': { serie: 0, aRevoir: true, vuLe: MAINTENANT } }
    expect(frequence('table:7×8', etats, jeuxDe('calcul'))).toBeGreaterThan(0.12)
    expect(frequence('table:7×8', etats, jeuxDe(MELANGE.id))).toBeGreaterThan(0.12)
  })

  it('ne fait pas plus d’une question sur deux une reprise, même avec beaucoup d’erreurs', () => {
    const etats: EtatsFaits = {}
    for (let x = 6; x <= 9; x++) for (let y = 11; y <= 15; y++) etats[`table:${x}×${y}`] = { serie: 0, aRevoir: true, vuLe: MAINTENANT }
    const a = aleaDepuis(5)
    let reprises = 0
    for (let i = 0; i < 3000; i++) if (etats[choisirQuestion(jeuxDe(MELANGE.id), a, [], etats, MAINTENANT).cle]) reprises++
    expect(reprises / 3000).toBeGreaterThan(0.35)
    expect(reprises / 3000).toBeLessThan(0.56)
  })

  it('ignore un fait à revoir d’un autre jeu', () => {
    const etats: EtatsFaits = { 'carre:17': { serie: 0, aRevoir: true, vuLe: MAINTENANT } }
    const a = aleaDepuis(6)
    for (let i = 0; i < 300; i++) expect(choisirQuestion(jeuxDe('lettres'), a, [], etats, MAINTENANT).jeu).toBe('lettres')
  })

  it('fait revenir moins souvent un fait maîtrisé la veille', () => {
    const neutre = frequence('rang:P', {})
    const su = frequence('rang:P', { 'rang:P': { serie: 4, aRevoir: false, vuLe: MAINTENANT - JOUR } })
    expect(su).toBeLessThan(neutre / 2)
  })

  it('ne reprend pas un fait à revoir vu dans les dernières questions', () => {
    const a = aleaDepuis(5)
    const etats: EtatsFaits = { 'rang:P': { serie: 0, aRevoir: true, vuLe: MAINTENANT } }
    const recentes = ['rang:P', ...Array.from({ length: ECART_MIN - 1 }, (_, i) => `rang:${'ABC'[i]}`)]
    for (let i = 0; i < 500; i++) expect(choisirQuestion(jeuxDe('lettres'), a, recentes, etats, MAINTENANT).cle).not.toBe('rang:P')
  })

  it('pioche dans tous les jeux pour le Mélange, à parts comparables', () => {
    const a = aleaDepuis(3)
    const parJeu = new Map<string, number>()
    for (let i = 0; i < 2000; i++) {
      const q = choisirQuestion(jeuxDe(MELANGE.id), a, [], {}, MAINTENANT)
      parJeu.set(q.jeu, (parJeu.get(q.jeu) ?? 0) + 1)
    }
    expect([...parJeu.keys()].sort()).toEqual(JEUX.map((j) => j.id).sort())
    for (const n of parJeu.values()) expect(n).toBeGreaterThan(2000 / JEUX.length / 2)
  })

  it('fait pencher le Mélange vers les jeux conseillés', () => {
    const a = aleaDepuis(13)
    let fractions = 0
    for (let i = 0; i < 4000; i++) {
      if (choisirQuestion(jeuxDe(MELANGE.id), a, [], {}, MAINTENANT, { fractions: 2 }).jeu === 'fractions') fractions++
    }
    // Poids 2 sur 9 au lieu de 1 sur 8.
    expect(fractions / 4000).toBeGreaterThan(0.18)
    expect(fractions / 4000).toBeLessThan(0.27)
  })

  it('rejoue la même suite à graine égale', () => {
    const tirer = () => {
      const a = aleaDepuis(8)
      return Array.from({ length: 30 }, () => choisirQuestion(jeuxDe('calcul'), a, [], {}, MAINTENANT).enonce)
    }
    expect(tirer()).toEqual(tirer())
  })
})

describe('produireCle', () => {
  it('reproduit chaque fait tiré, dans chaque jeu', () => {
    for (const j of JEUX) {
      const a = aleaDepuis(23)
      for (let i = 0; i < 2000; i++) {
        const q = j.produire(a)
        const r = j.produireCle(a, q.cle)
        expect(r?.cle, `${j.id} · ${q.cle}`).toBe(q.cle)
        // Un fait précis donne la même question ; une catégorie, une autre du même genre.
        if (/^(carre|racine|cube|racine3|deux|log2|rang|lettre|rebours|premier|pourcent|fraction|decimal|coef|annulation):/.test(q.cle)) {
          expect(r?.enonce, q.cle).toBe(q.enonce)
        }
      }
    }
  })

  it('refuse une clé d’un autre jeu ou hors bornes', () => {
    const a = aleaDepuis(1)
    for (const [id, cle] of [
      ['lettres', 'carre:17'],
      ['lettres', 'rang:?'],
      ['puissances', 'carre:31'],
      ['puissances', 'cube:0'],
      ['fractions', 'pourcent:2/7'],
      ['fractions', 'decimal:1/3'],
      ['fractions', 'coef:33'],
      ['premiers', 'premier:93.5'],
      ['premiers', 'premier:4'],
      ['premiers', 'divisible:7'],
      ['calcul', 'table:3×4'],
      ['calcul', 'pourcentage:33'],
      ['calcul', 'successives:15/10'],
      ['calcul', 'x5:12'],
    ] as const) {
      expect(jeu(id)!.produireCle(a, cle), `${id} · ${cle}`).toBeNull()
    }
  })
})

describe('clés des faits', () => {
  // La répétition range les faits par clé, tous jeux confondus (Mélange) :
  // deux jeux ne doivent jamais produire la même.
  it('n’appartiennent qu’à un seul jeu', () => {
    const proprietaire = new Map<string, string>()
    for (const j of JEUX) {
      const a = aleaDepuis(17)
      for (let i = 0; i < 2000; i++) {
        const cle = jeu(j.id)!.produire(a).cle
        expect(proprietaire.get(cle) ?? j.id, cle).toBe(j.id)
        proprietaire.set(cle, j.id)
      }
    }
  })
})
