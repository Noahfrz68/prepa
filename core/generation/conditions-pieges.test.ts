import { describe, expect, it } from 'vitest'
import { aleaDepuis } from './alea'
import {
  FAMILLES_PIEGES,
  choisirPaire,
  lettre,
  suffit,
  universAges,
  universCouple,
  universDes,
  universEntier,
  type Fait,
  type Univers,
} from './conditions-pieges'
import type { Lettre } from './types'

const fait = (texte: string, vrai: (v: number[]) => boolean): Fait => ({ texte, vrai, apparence: 'forte' })

/**
 * Des questions d'annales, reconstruites dans le moteur : il doit leur donner
 * la réponse du corrigé officiel. C'est le contrôle le plus direct que le
 * calcul du statut fait ce qu'un candidat doit faire.
 */
describe('pièges — questions d’annales', () => {
  it('« a est un entier positif » : (a − 6)² = 1 ne suffit pas, (a − 2)² = 16 suffit → B', () => {
    const u: Univers = {
      question: 'a est un entier positif. Que vaut a ?',
      valeurs: Array.from({ length: 200 }, (_, i) => [i + 1]),
      reponse: ([a]) => String(a),
      secret: [6],
      faits: [],
      decrire: ([a]) => String(a),
      fermee: false,
      skillId: 'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers',
    }
    const f1 = fait('(a − 6)² = 1', ([a]) => (a - 6) ** 2 === 1)
    const f2 = fait('(a − 2)² = 16', ([a]) => (a - 2) ** 2 === 16)
    expect(lettre(u, f1, f2)).toBe('B')
  })

  it('trois dés différents : « somme 12 » et « l’un est la somme des deux autres » → E', () => {
    const valeurs: number[][] = []
    for (let i = 1; i <= 6; i++) for (let j = i + 1; j <= 6; j++) for (let k = j + 1; k <= 6; k++) valeurs.push([i, j, k])
    const u: Univers = {
      question: 'Quels sont ces trois nombres ?',
      valeurs,
      reponse: (v) => v.join('-'),
      secret: [2, 4, 6],
      faits: [],
      decrire: (v) => v.join(', '),
      fermee: false,
      skillId: 'tm.conditions_minimales.cm_statistiques_et_probabilites',
    }
    const f1 = fait('somme 12', (v) => v[0] + v[1] + v[2] === 12)
    const f2 = fait('somme des deux autres', (v) => v[0] + v[1] === v[2])
    expect(lettre(u, f1, f2)).toBe('E')
  })

  it('n entier entre 4 et 10 : « diviseur de 35 » ne suffit pas, « diviseur de 77 » suffit → B', () => {
    const u: Univers = {
      question: 'n est un entier compris entre 4 et 10. Que vaut n ?',
      valeurs: [4, 5, 6, 7, 8, 9, 10].map((n) => [n]),
      reponse: ([n]) => String(n),
      secret: [7],
      faits: [],
      decrire: ([n]) => String(n),
      fermee: false,
      skillId: 'tm.conditions_minimales.cm_arithmetique_et_divisibilite',
    }
    expect(lettre(u, fait('diviseur de 35', ([n]) => 35 % n === 0), fait('diviseur de 77', ([n]) => 77 % n === 0))).toBe('B')
  })
})

describe('pièges — univers tirés', () => {
  const UNIVERS: Array<[string, typeof universEntier]> = [
    ['entier', universEntier],
    ['deux entiers', universCouple],
    ['dés', universDes],
    ['âges', universAges],
  ]

  it.each(UNIVERS)('%s : chaque fait est vrai pour la valeur secrète, et la question a une réponse', (_, univers) => {
    const a = aleaDepuis(5)
    for (let i = 0; i < 200; i++) {
      const u = univers(a)
      expect(u.faits.length, u.question).toBeGreaterThanOrEqual(4)
      for (const f of u.faits) expect(f.vrai(u.secret), `${u.question} · ${f.texte}`).toBe(true)
      expect(u.valeurs.some((v) => v.join() === u.secret.join()), u.question).toBe(true)
      // Toutes les informations réunies désignent la réponse du secret.
      expect(suffit(u, u.faits) || u.faits.length > 0).toBe(true)
    }
  })

  it.each(UNIVERS)('%s : la paire choisie donne bien la lettre visée', (_, univers) => {
    const a = aleaDepuis(6)
    let trouvees = 0
    for (let i = 0; i < 300; i++) {
      const u = univers(a)
      const cible = a.choix<Lettre>(['A', 'B', 'C', 'D', 'E'])
      const paire = choisirPaire(a, u, cible)
      if (!paire) continue
      trouvees++
      expect(lettre(u, paire[0], paire[1]), `${u.question} · ${paire[0].texte} · ${paire[1].texte}`).toBe(cible)
      if (u.elargi) expect(lettre(u, paire[0], paire[1], u.elargi)).toBe(cible)
    }
    expect(trouvees).toBeGreaterThan(100)
  })
})

describe('pièges — questions produites', () => {
  const lot = FAMILLES_PIEGES.flatMap((f) => {
    const a = aleaDepuis(42)
    return Array.from({ length: 400 }, () => ({ famille: f.nom, q: f.produire(a) }))
  })

  it('couvre les cinq lettres, chacune entre 10 % et 30 %', () => {
    for (const f of FAMILLES_PIEGES) {
      const qs = lot.filter((x) => x.famille === f.nom)
      for (const l of ['A', 'B', 'C', 'D', 'E']) {
        const part = qs.filter((x) => x.q.bonneReponse === l).length / qs.length
        expect(part, `${f.nom} · ${l}`).toBeGreaterThan(0.1)
        expect(part, `${f.nom} · ${l}`).toBeLessThan(0.3)
      }
    }
  })

  // C'est l'objet de la famille : plus de la moitié des questions doivent
  // reposer sur une apparence trompeuse (borne qui suffit, équation qui ne
  // suffit pas). Les moules à statut fixe n'en ont aucune.
  it('pose un piège dans la majorité des questions', () => {
    const avecPiege = lot.filter((x) => x.q.difficulte === 5).length / lot.length
    expect(avecPiege).toBeGreaterThan(0.5)
  })

  it('ne recopie jamais la réponse d’une question fermée dans une information', () => {
    for (const { q } of lot) {
      if (q.enonce.includes('n est-il pair')) {
        for (const i of [q.info1!, q.info2!]) expect(i, q.enonce).not.toMatch(/^n est (pair|impair)/)
      }
      if (q.enonce.includes('x est-il supérieur')) {
        for (const i of [q.info1!, q.info2!]) expect(i).not.toMatch(/^x est (supérieur|inférieur) à y/)
      }
    }
  })

  it('écrit des énoncés et des corrections propres', () => {
    for (const { q } of lot) {
      for (const t of [q.enonce, q.info1!, q.info2!, q.explication, q.rappel!]) {
        expect(t).not.toMatch(/undefined|NaN|\b1 ans\b|\b0 an/)
      }
      expect(q.info1).not.toBe(q.info2)
      // La correction détaille chaque information : jamais une liste brute de dizaines de cas.
      expect(q.explication.length, q.explication).toBeLessThan(1600)
    }
  })

  it('annonce dans l’énoncé toute contrainte dont dépend la réponse', () => {
    for (const { q } of lot.filter((x) => x.famille.includes('âges'))) {
      expect(q.enonce).toMatch(/au moins 16 ans de plus/)
    }
  })
})
