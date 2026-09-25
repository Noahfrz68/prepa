import { describe, expect, it } from 'vitest'
import { genererLot } from '../index'
import { FAMILLES_LOGIQUE } from './index'
import { decrireCase } from '@/core/figures/decrire'
import { rang } from '../alea'
import type { Case, Figure } from '@/core/figures/types'
import type { QuestionGeneree } from '../types'

const LOT = genererLot('logique', 400, 4242)

function figureDe(q: QuestionGeneree): Figure {
  if (!q.figure) throw new Error(`Question sans figure : ${q.enonce}`)
  return q.figure
}

describe('logique — la disposition', () => {
  it('donne une figure à chaque question', () => {
    expect(LOT.questions.length).toBeGreaterThan(200)
    for (const q of LOT.questions) {
      expect(q.figure, q.enonce.slice(0, 50)).toBeTruthy()
    }
  })

  // Une croix dont le « ? » n'est pas exactement au croisement des deux séries
  // se dessine avec deux cases manquantes, ou avec une case en double : la
  // question devient illisible sans qu'aucun contrôle de forme ne s'en aperçoive.
  it('place le « ? » d’une croix au croisement exact des deux séries', () => {
    const croix = LOT.questions.filter((q) => figureDe(q).type === 'croix')
    expect(croix.length).toBeGreaterThan(30)

    for (const q of croix) {
      const f = figureDe(q)
      if (f.type !== 'croix') continue
      expect(f.iLigne).toBeGreaterThanOrEqual(0)
      expect(f.iLigne).toBeLessThan(f.ligne.length)
      expect(f.iColonne).toBeGreaterThanOrEqual(0)
      expect(f.iColonne).toBeLessThan(f.colonne.length)
      expect(f.ligne[f.iLigne].inconnue, 'la ligne doit porter le ?').toBe(true)
      expect(f.colonne[f.iColonne].inconnue, 'la colonne doit porter le ?').toBe(true)
      expect(f.ligne.filter((c) => c.inconnue)).toHaveLength(1)
      expect(f.colonne.filter((c) => c.inconnue)).toHaveLength(1)
    }
  })

  it('ne laisse jamais deux cases manquantes dans une bande ou une matrice', () => {
    for (const q of LOT.questions) {
      const f = figureDe(q)
      const cases =
        f.type === 'bande' ? f.cases : f.type === 'matrice' ? f.lignes.flat() : []
      expect(cases.filter((c) => c.inconnue).length, q.enonce.slice(0, 50)).toBeLessThanOrEqual(1)
    }
  })
})

describe('logique — les propositions dessinées', () => {
  it('donne cinq dessins distincts, et leur texte dit la même chose', () => {
    const figurees = LOT.questions.filter((q) => q.optionsFigure)
    expect(figurees.length).toBeGreaterThan(80)

    for (const q of figurees) {
      expect(q.optionsFigure, q.enonce.slice(0, 50)).toHaveLength(5)
      const descriptions = q.optionsFigure!.map(decrireCase)
      // Le texte de la proposition EST la description de son dessin : c'est lui
      // qui sert de clé de déduplication en base et de repli dans le carnet.
      expect(descriptions).toEqual(q.options)
      expect(new Set(descriptions).size).toBe(5)
    }
  })
})

/* ------------------------------------------------ l'unicité de la réponse -- */

/**
 * Les règles d'une croix de lettres, relues DEPUIS la figure.
 *
 * On ne fait pas confiance à ce que le générateur dit avoir fait : on reprend
 * les groupes affichés, on cherche quelle relation interne ils vérifient tous
 * et quelle position progresse dans la colonne, puis on compte les propositions
 * qui satisfont les deux. Le défaut visé est le seul qui rende une question
 * fausse : deux propositions valides, donc pas de bonne réponse.
 */
function reglesCroixLettres(f: Figure) {
  if (f.type !== 'croix') return null

  const ligne = f.ligne.filter((c) => !c.inconnue).map((c) => c.texte as string)
  // La colonne saute l'indice du « ? » : garder la POSITION de chaque groupe
  // est indispensable, sinon l'écart entre deux cases visibles vaut deux pas
  // là où le trou s'est intercalé, et aucune progression ne paraît régulière.
  const colonne = f.colonne
    .map((c, n) => [n, c] as const)
    .filter(([, c]) => !c.inconnue)
    .map(([n, c]) => [n, c.texte as string] as const)

  if (ligne.some((g) => !g || !/^[A-Z]{3}$/.test(g))) return null
  if (colonne.some(([, g]) => !g || !/^[A-Z]{3}$/.test(g))) return null

  const mod26 = (n: number) => ((n % 26) + 26) % 26

  // Relation interne : position j = position i décalée de k, vraie partout.
  const internes: Array<[number, number, number]> = []
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) continue
      const k = mod26(rang(ligne[0][j]) - rang(ligne[0][i]))
      if (ligne.every((g) => mod26(rang(g[j]) - rang(g[i])) === k)) internes.push([i, j, k])
    }
  }

  // Progression verticale : une position dont le rang avance d'un pas
  // constant, mesuré sur deux cases CONSÉCUTIVES dans la colonne.
  const verticales: Array<[number, number]> = []
  for (let p = 0; p < 3; p++) {
    const voisines = colonne.findIndex(([n], idx) => idx > 0 && n === colonne[idx - 1][0] + 1)
    if (voisines < 0) continue
    const pas = mod26(rang(colonne[voisines][1][p]) - rang(colonne[voisines - 1][1][p]))
    const base = colonne[0]
    const regulier = colonne.every(
      ([n, g]) => rang(g[p]) === (mod26(rang(base[1][p]) - 1 + (n - base[0]) * pas) % 26) + 1,
    )
    if (regulier) verticales.push([p, pas])
  }

  /** Le rang attendu à la position `p`, à la hauteur du « ? ». */
  const attendu = (p: number, pas: number) => {
    const base = colonne[0]
    return (mod26(rang(base[1][p]) - 1 + (f.iColonne - base[0]) * pas) % 26) + 1
  }

  return { internes, verticales, attendu, mod26 }
}

describe('logique — une seule réponse possible', () => {
  it('ne laisse jamais deux groupes satisfaire les deux règles d’une croix', () => {
    const croix = LOT.questions.filter(
      (q) => q.skillId === 'tm.logique.croix_de_lettres' && q.figure,
    )
    expect(croix.length).toBeGreaterThan(15)

    let verifiees = 0
    for (const q of croix) {
      const r = reglesCroixLettres(q.figure!)
      if (!r) continue

      // La règle interne lie deux positions : dès que l'une progresse dans la
      // colonne, l'autre progresse aussi. Plusieurs lectures verticales sont
      // donc NORMALES, et elles doivent toutes désigner le même groupe. On
      // écarte les couples de règles qu'aucune proposition ne satisfait : ce
      // sont des coïncidences d'affichage, pas la règle posée par la famille.
      const designes = new Set<string>()
      for (const [i, j, k] of r.internes) {
        for (const [p, pas] of r.verticales) {
          const rangAttendu = r.attendu(p, pas)
          const valides = q.options.filter(
            (o) => r.mod26(rang(o[j]) - rang(o[i])) === k && rang(o[p]) === rangAttendu,
          )
          if (valides.length === 0) continue
          for (const v of valides) designes.add(v)
        }
      }

      if (designes.size === 0) continue
      expect([...designes], `${q.options.join(' ')}`).toHaveLength(1)
      verifiees++
    }

    // Le test ne vaut que s'il a réellement contrôlé des questions.
    expect(verifiees).toBeGreaterThan(10)
  })
})

describe('logique — la couverture des familles', () => {
  it('fabrique des questions pour chacune des seize sous-compétences', () => {
    const attendues = new Set(FAMILLES_LOGIQUE.map((f) => f.skillId))
    expect(attendues.size).toBe(16)

    const produites = new Set(LOT.questions.map((q) => q.skillId))
    for (const s of attendues) {
      expect(produites.has(s), `aucune question pour ${s}`).toBe(true)
    }
  })

  it('ne fait jamais d’une case d’énoncé une case vide non voulue', () => {
    const vide: Case = {}
    expect(decrireCase(vide)).toBe('case vide')
    for (const q of LOT.questions) {
      const f = figureDe(q)
      const cases =
        f.type === 'bande'
          ? f.cases
          : f.type === 'matrice'
            ? f.lignes.flat()
            : f.type === 'croix'
              ? [...f.ligne, ...f.colonne]
              : [f.a, f.b, f.c]
      for (const c of cases) {
        expect(decrireCase(c), q.enonce.slice(0, 50)).not.toBe('case vide')
      }
    }
  })
})
