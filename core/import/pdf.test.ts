import { describe, expect, it } from 'vitest'
import { decouperOptionsEnLigne, parserPdf } from './pdf'

/** Reproduit la mise en page réelle d'un test d'entraînement. */
const DOCUMENT = `TEST
SOUS-TEST 2 : CALCUL
Durée : 20 minutes
15 questions
Consignes
Question 1. David dispose d'un capital de 15000 euros. Quel est le taux d'intérêt annuel ?
A) 7% B) 9% C) 10% D) 11% E) 13%
Question 2. Quelle est l'aire de la piscine ?
A) 16m² B) 49m² C) 81m² D) 100m² E) 121m²
-- 10 of 49 --
Page 11
HUB ECRICOME / Concours TREMPLIN 2 / Tous droits réservés
SOUS-TEST 4 : CONDITIONS MINIMALES
Durée : 20 minutes
Question 1. Jérôme a quatre fois l'âge de son fils Daniel. Quel est l'âge de Jérôme ?
(1) Dans neuf ans, l'âge de Jérôme vaudra les cinq demi de l'âge de son fils.
(2) La somme de leurs âges fait quarante-cinq.
SOUS-TEST 6 : LOGIQUE
Question 1.
A) MIF B) ABJ C) NBC D) NOG E) KDS
CORRIGÉ
CALCUL
Corrigé 1.
Réponse B
Le capital placé est de 10000 euros.
Corrigé 2.
Réponse B
L'aire vaut 49 m².
CONDITIONS MINIMALES
Corrigé 1.
Réponse D
Chaque information suffit seule.`

describe('decouperOptionsEnLigne', () => {
  // Sans ce découpage, les sous-tests de calcul et de logique étaient perdus :
  // tout atterrissait dans la proposition A.
  it('découpe cinq propositions écrites sur une seule ligne', () => {
    const o = decouperOptionsEnLigne('A) 7% B) 9% C) 10% D) 11% E) 13%')
    expect(o).toHaveLength(5)
    expect(o[0]).toEqual({ lettre: 'A', texte: '7%' })
    expect(o[4]).toEqual({ lettre: 'E', texte: '13%' })
  })

  it('ne découpe pas une ligne à une seule étiquette', () => {
    expect(decouperOptionsEnLigne('A) une proposition seule')).toEqual([])
  })

  it('refuse un texte contenant des parenthèses hors séquence', () => {
    expect(decouperOptionsEnLigne('le point A) puis le point C) ensuite')).toEqual([])
  })

  it('exige des étiquettes consécutives', () => {
    expect(decouperOptionsEnLigne('A) un B) deux D) quatre')).toEqual([])
  })
})

describe('parserPdf', () => {
  const r = parserPdf(DOCUMENT)

  it('rattache les questions à leur sous-test', () => {
    expect(r.parSection.calcul).toBe(2)
    expect(r.parSection.conditions_minimales).toBe(1)
  })

  it('apparie les bonnes réponses du corrigé et leur justification', () => {
    const q = r.questions.find((x) => x.section === 'calcul' && x.numero === 1)!
    expect(q.bonneReponse).toBe('B')
    expect(q.options).toEqual(['7%', '9%', '10%', '11%', '13%'])
    expect(q.explication).toContain('10000')
  })

  it('traite les conditions minimales par leurs deux informations', () => {
    const q = r.questions.find((x) => x.section === 'conditions_minimales')!
    expect(q.options).toEqual([])
    expect(q.info1).toContain('neuf ans')
    expect(q.info2).toContain('quarante-cinq')
    expect(q.bonneReponse).toBe('D')
  })

  // Écarter ces questions vidait le sous-test de logique. Elles sortent
  // désormais à part, pour qu'un rendu d'image leur redonne leur énoncé.
  it('remonte à part les questions dont l’énoncé est une figure', () => {
    expect(r.questions.some((q) => q.section === 'logique')).toBe(false)

    const f = r.figures.find((x) => x.section === 'logique' && x.numero === 1)!
    expect(f.enonce).toBe('')
    expect(f.options).toEqual(['MIF', 'ABJ', 'NBC', 'NOG', 'KDS'])
  })

  // Les six dernières questions de logique ont aussi leurs propositions
  // dessinées : il ne reste rien en texte. Sans ce cas, le sous-test s'arrêtait
  // à neuf questions sur quinze.
  it('remonte une question entièrement graphique si le corrigé la tranche', () => {
    const doc = `SOUS-TEST 6 : LOGIQUE
Question 10.
Question 11.
CORRIGÉ
LOGIQUE
Corrigé 10.
Réponse C
Les chiffres font la même somme.`

    const rg = parserPdf(doc)
    const q10 = rg.figures.find((x) => x.numero === 10)!
    expect(q10.bonneReponse).toBe('C')
    expect(q10.options).toEqual(['', '', '', '', ''])

    // Sans réponse au corrigé, rien ne distingue la question d'un faux en-tête.
    expect(rg.figures.some((x) => x.numero === 11)).toBe(false)
  })

  it('supprime la pagination et les mentions d’éditeur', () => {
    const texteEntier = r.questions.map((q) => `${q.enonce} ${q.options.join(' ')}`).join(' ')
    expect(texteEntier).not.toMatch(/of 49|Tous droits|Page 11/i)
  })

  it('n’invente jamais une réponse absente du corrigé', () => {
    const sansCorrige = parserPdf(DOCUMENT.slice(0, DOCUMENT.indexOf('CORRIGÉ')))
    expect(sansCorrige.questions.every((q) => q.bonneReponse === undefined)).toBe(true)
    expect(sansCorrige.sansReponse).toBe(sansCorrige.questions.length)
    expect(sansCorrige.avertissements.join(' ')).toMatch(/Aucune n’est inventée/)
  })

  // Non-régression : la détection de section du corrigé acceptait toute ligne
  // courte CONTENANT le mot. Une phrase d'explication comme « la réponse est
  // logique » basculait la section, et les corrigés suivants tombaient sous
  // une clé qu'aucune question ne portait — six réponses perdues sur le
  // document réel. Dans un autre document, elles auraient pu être attribuées
  // à de mauvaises questions.
  it('ne bascule pas de section sur une phrase contenant un nom de sous-test', () => {
    const doc = `SOUS-TEST 2 : CALCUL
Question 1. Combien font 2 + 2 ?
A) 3 B) 4 C) 5 D) 6 E) 7
Question 2. Combien font 3 + 3 ?
A) 5 B) 6 C) 7 D) 8 E) 9
CORRIGÉ
CALCUL
Corrigé 1.
Réponse B
Le raisonnement est purement logique.
Corrigé 2.
Réponse B
Une simple expression arithmétique.`

    const r = parserPdf(doc)
    expect(r.sansReponse).toBe(0)
    expect(r.questions.map((q) => q.bonneReponse)).toEqual(['B', 'B'])
    expect(r.questions.every((q) => q.section === 'calcul')).toBe(true)
  })

  it('signale un document de structure inattendue', () => {
    const r2 = parserPdf('Un document quelconque\nsans aucune question numérotée.')
    expect(r2.questions).toHaveLength(0)
    expect(r2.avertissements.join(' ')).toMatch(/structure attendue/i)
  })
})
