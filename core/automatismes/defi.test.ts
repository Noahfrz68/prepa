import { describe, expect, it } from 'vitest'
import { defiDuJour, estJour, JEUX_MIN_DEFI, jourDecale, jourLocal, QUESTIONS_DEFI } from './defi'
import { verifier } from './reponses'
import { JEUX } from './index'

describe('défi du jour', () => {
  it('donne les mêmes questions pour un même jour, sur n’importe quel appareil', () => {
    expect(defiDuJour('2026-10-01').map((q) => q.enonce)).toEqual(defiDuJour('2026-10-01').map((q) => q.enonce))
  })

  it('change d’un jour à l’autre', () => {
    const vus = new Set<string>()
    for (let i = 0; i < 60; i++) vus.add(defiDuJour(jourDecale('2026-10-01', i)).map((q) => q.enonce).join('|'))
    expect(vus.size).toBe(60)
  })

  it(`compte ${QUESTIONS_DEFI} questions, de ${JEUX_MIN_DEFI} jeux au moins, sans fait répété`, () => {
    for (let i = 0; i < 365; i++) {
      const jour = jourDecale('2026-01-01', i)
      const qs = defiDuJour(jour)
      expect(qs, jour).toHaveLength(QUESTIONS_DEFI)
      expect(new Set(qs.map((q) => q.jeu)).size, jour).toBeGreaterThanOrEqual(JEUX_MIN_DEFI)
      expect(new Set(qs.map((q) => q.cle)).size, jour).toBe(QUESTIONS_DEFI)
      for (const q of qs) {
        const juste = q.attendu.genre === 'choix' ? String(q.attendu.valeur) : q.reponse.replace(/^[≈×]\s*/, '')
        expect(verifier(q.attendu, juste), q.enonce).toBe(true)
      }
    }
  })
})

describe('jours', () => {
  it('avance et recule sur le calendrier, fins de mois et d’année comprises', () => {
    expect(jourDecale('2026-10-01', -1)).toBe('2026-09-30')
    expect(jourDecale('2026-12-31', 1)).toBe('2027-01-01')
    expect(jourDecale('2028-02-28', 1)).toBe('2028-02-29')
    expect(jourDecale('2027-03-01', -1)).toBe('2027-02-28')
  })

  it('lit le jour local, et reconnaît un jour valide', () => {
    expect(jourLocal(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01')
    expect(jourLocal(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
    expect(estJour('2026-10-01')).toBe(true)
    for (const j of ['2026-13-01', '2026-1-1', '', null, 20261001]) expect(estJour(j), String(j)).toBe(false)
  })
})

/**
 * Les défis tels qu'ils ont été tirés avant l'ajout des triplets, des
 * formules et des identités (relevés le 1er octobre 2026). Un jeu ajouté
 * n'entre dans le défi qu'à sa date (`defiDepuis`) : ceux-là ne doivent plus
 * jamais changer.
 */
const DEFIS_PASSES: Record<string, string[]> = {
  '2026-09-28': ["17 ; 19 ; 24 ; 32 ; 43 ; ?", "6 ; 12 ; 24 ; 48 ; 96 ; ?", "63 est-il premier ?", "Le 10 août 2030 est un samedi. Quel jour est le 24 décembre 2030 ?", "1/50 = ? %", "1 439 est-il divisible par 6 ?", "143 ÷ 11 ?", "80 × 11 ?", "1/5 = ? %", "Rang de O ?"],
  '2026-09-29': ["343 ÷ 7 ?", "Le 21 avril 2027 est un mercredi. Quel jour est le 15 juin 2027 ?", "4 440 ÷ 92 ≈ ?", "797 × 72 ≈ ?", "Lettre de rang 5 ?", "Rang de T à rebours (Z = 1) ?", "11 est-il premier ?", "10 ; 32 ; 15 ; 29 ; 20 ; ?", "14² ?", "4² ?"],
  '2026-09-30': ["Le 28 septembre 2028 est un jeudi. Quel jour est le 14 octobre 2028 ?", "Nous sommes jeudi. Quel jour était-ce il y a 228 jours ?", "3 ; 9 ; 27 ; 81 ; 243 ; ?", "Rang de W ?", "14 × 8 ?", "−10 % puis +50 % : variation totale ?", "3/8 = ? %", "Rang de R ?", "4² ?", "67 est-il premier ?"],
  '2026-10-01': ["64 est le carré de ?", "399 ÷ 7 ?", "Rang de B ?", "Le 13 avril 2026 est un lundi. Quel jour est le 1er août 2026 ?", "30,3 % de 7 028 ≈ ?", "19 ; 58 ; 21 ; 55 ; 23 ; ?", "Nous sommes jeudi. Quel jour serons-nous dans 302 jours ?", "62,5 % = quelle fraction ?", "1 331 est le cube de ?", "5 % = quelle fraction ?"],
  '2026-10-02': ["405 × 21 ≈ ?", "Baisse de 75 % : coefficient ?", "8 ; 13 ; 19 ; 26 ; 34 ; ?", "Lettre de rang 18 ?", "√601 ≈ ?", "2³ ?", "Nous sommes vendredi. Quel jour était-ce il y a 95 jours ?", "1/5 en décimal ?", "Le 20 juillet 2029 est un vendredi. Quel jour est le 8 août 2029 ?", "2¹⁰ ?"],
}

describe('défis passés', () => {
  it('restent identiques quand on ajoute des jeux', () => {
    for (const [jour, enonces] of Object.entries(DEFIS_PASSES)) {
      expect(defiDuJour(jour).map((q) => q.enonce), jour).toEqual(enonces)
    }
  })

  it('n’accueillent un nouveau jeu qu’à partir de sa date d’entrée', () => {
    for (const j of JEUX.filter((x) => x.defiDepuis)) {
      for (let i = 1; i <= 60; i++) {
        const avant = jourDecale(j.defiDepuis!, -i)
        expect(defiDuJour(avant).some((q) => q.jeu === j.id), `${j.id} le ${avant}`).toBe(false)
      }
      const apres = Array.from({ length: 60 }, (_, i) => jourDecale(j.defiDepuis!, i))
      expect(apres.some((jour) => defiDuJour(jour).some((q) => q.jeu === j.id)), j.id).toBe(true)
    }
  })
})
