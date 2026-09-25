import { describe, expect, it } from 'vitest'
import { aleaDepuis, fraction, lettre, nombre, rang } from './alea'
import { genererLot, SECTIONS_GENERABLES } from './index'
import { anomalies, signature } from './verifier'
import { OPTIONS_CONDITIONS_MINIMALES } from '@/exams/tagemage'

describe('alea', () => {
  it('rejoue la même suite pour la même graine', () => {
    const a = aleaDepuis(42)
    const b = aleaDepuis(42)
    const tirageA = Array.from({ length: 20 }, () => a.entier(0, 1000))
    const tirageB = Array.from({ length: 20 }, () => b.entier(0, 1000))
    expect(tirageA).toEqual(tirageB)
  })

  it('donne des suites différentes pour des graines différentes', () => {
    const a = Array.from({ length: 20 }, (_, i) => aleaDepuis(i).entier(0, 1_000_000))
    expect(new Set(a).size).toBeGreaterThan(15)
  })

  it('replie les rangs de lettres au-delà de Z', () => {
    expect(lettre(1)).toBe('A')
    expect(lettre(26)).toBe('Z')
    expect(lettre(27)).toBe('A')
    expect(lettre(0)).toBe('Z')
    expect(rang('C')).toBe(3)
  })

  it('met les nombres en forme française', () => {
    expect(nombre(1234567)).toBe('1 234 567')
    expect(nombre(12.5, 1)).toBe('12,5')
    expect(fraction(6, 8)).toBe('3/4')
    expect(fraction(4, 2)).toBe('2')
  })
})

/**
 * Le vrai contrôle : on fabrique un lot complet de chaque sous-test et on
 * vérifie chaque question. Un générateur ne se teste pas sur un exemple —
 * c'est précisément la question sur deux cents qui casse.
 */
describe.each(SECTIONS_GENERABLES)('génération — %s', (section) => {
  const lot = genererLot(section, 200, 20260902)

  it('produit les 200 questions demandées', () => {
    expect(lot.questions).toHaveLength(200)
    expect(lot.rejets).toEqual([])
  })

  it('ne produit aucune question mal formée', () => {
    const fautives = lot.questions
      .map((q, i) => ({ i, maux: anomalies(q) }))
      .filter((x) => x.maux.length > 0)
    expect(fautives).toEqual([])
  })

  // Le reproche d'origine : « les questions sont toujours les mêmes ». Deux
  // questions qui posent la même chose et attendent la même réponse sont le
  // même exercice, quels que soient les leurres autour.
  it('ne pose jamais deux fois le même exercice', () => {
    const cles = lot.questions.map(signature)
    expect(new Set(cles).size).toBe(cles.length)
  })

  it('répartit le tirage entre toutes les familles', () => {
    const comptes = Object.values(lot.parFamille)

    // Les familles sont parcourues en rotation, mais elles n'ont pas la même
    // capacité : en expression, « phrase correcte » est bornée par le nombre de
    // phrases du corpus, et les autres absorbent le reste une fois qu'elle est
    // épuisée. Le déséquilibre est donc normal ; ce qui ne le serait pas, c'est
    // qu'une famille soit absente, ou qu'une seule porte le tiers du lot.
    expect(Math.min(...comptes)).toBeGreaterThan(0)
    expect(Math.max(...comptes)).toBeLessThan(lot.questions.length / 3)
  })

  it('rattache chaque question à une sous-compétence du sous-test', () => {
    for (const q of lot.questions) {
      expect(q.skillId.startsWith(`tm.${section}.`)).toBe(true)
    }
  })

  it('rejoue le même lot pour la même graine', () => {
    const bis = genererLot(section, 30, 20260902)
    expect(bis.questions.map((q) => q.enonce)).toEqual(
      lot.questions.slice(0, 30).map((q) => q.enonce),
    )
  })
})

describe('génération — calcul', () => {
  const lot = genererLot('calcul', 200, 7)

  it('donne cinq propositions distinctes et une réponse qui en désigne une', () => {
    for (const q of lot.questions) {
      expect(q.options).toHaveLength(5)
      expect(new Set(q.options).size).toBe(5)
      expect(q.options[['A', 'B', 'C', 'D', 'E'].indexOf(q.bonneReponse)]).toBeTruthy()
    }
  })

  it('ne place pas la bonne réponse toujours au même rang', () => {
    const rangs = new Set(lot.questions.map((q) => q.bonneReponse))
    expect(rangs.size).toBe(5)
  })
})

// Le sous-test de logique a son propre fichier : core/generation/logique/logique.test.ts

describe('génération — conditions minimales', () => {
  const lot = genererLot('conditions_minimales', 200, 13)

  it('laisse les propositions au format fixe A–E', () => {
    expect(OPTIONS_CONDITIONS_MINIMALES).toHaveLength(5)
    for (const q of lot.questions) {
      expect(q.typeItem).toBe('conditions_minimales')
      expect(q.options).toEqual([])
      expect(q.info1).toBeTruthy()
      expect(q.info2).toBeTruthy()
      expect(q.info1).not.toBe(q.info2)
    }
  })

  // Un générateur qui pencherait vers une lettre apprendrait à cocher cette
  // lettre, pas à juger la suffisance.
  it('couvre les cinq réponses sans en privilégier une', () => {
    const comptes: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    for (const q of lot.questions) comptes[q.bonneReponse]++

    for (const lettre of ['A', 'B', 'C', 'D', 'E']) {
      expect(comptes[lettre]).toBeGreaterThan(20)
    }
    expect(Math.max(...Object.values(comptes))).toBeLessThan(60)
  })

  it('justifie la lettre par le statut réel des deux informations', () => {
    for (const q of lot.questions) {
      // La démarche examine (1) puis (2) puis leur réunion, et ne conclut
      // qu'ensuite : la ligne de verdict est au milieu, pas en tête.
      expect(q.explication).toContain(`Réponse ${q.bonneReponse} :`)

      // Le verdict énoncé sur chaque information doit correspondre à la lettre.
      // Sans ce contrôle, on pourrait servir « (1) SUFFIT » sous une réponse E.
      const suffit = [...q.explication.matchAll(/elle (SUFFIT|NE SUFFIT PAS)/g)].map((m) => m[1])
      const attendu: Record<string, string[]> = {
        A: ['SUFFIT', 'NE SUFFIT PAS'],
        B: ['NE SUFFIT PAS', 'SUFFIT'],
        C: ['NE SUFFIT PAS', 'NE SUFFIT PAS'],
        D: ['SUFFIT', 'SUFFIT'],
        E: ['NE SUFFIT PAS', 'NE SUFFIT PAS'],
      }
      expect(suffit, q.explication).toEqual(attendu[q.bonneReponse])
    }
  })

  // Une correction servie à l'identique qu'on ait trouvé ou non ne sert bien
  // ni l'un ni l'autre cas : trop longue quand on a juste, trop courte quand
  // on s'est trompé.
  it('porte les deux niveaux de correction', () => {
    for (const q of lot.questions) {
      expect(q.rappel, q.enonce).toBeTruthy()
      expect(q.rappel!.length).toBeLessThan(q.explication.length)
    }
  })
})

describe('génération — domaines de valeurs', () => {
  const lot = genererLot('calcul', 400, 4242)

  /**
   * Le défaut trouvé en série réelle : « combien d'entiers divisibles par 3
   * mais pas par 2 » proposait −72. Un effectif négatif s'élimine sans
   * réfléchir, et la question se joue alors à quatre propositions au lieu de
   * cinq — elle devient plus facile qu'elle n'en a l'air, ce qui fausse la
   * calibration autant qu'une erreur de réponse.
   */
  it('ne propose jamais un effectif ou une durée négatifs', () => {
    const negatives = lot.questions
      .filter((q) => /combien|durée|en combien de temps|km\/h|cm|€|commissions|podiums/i.test(q.enonce))
      .flatMap((q) => q.options.filter((o) => o.trim().startsWith('−') || o.trim().startsWith('-')).map((o) => `${o} — ${q.enonce.slice(0, 60)}`))

    expect(negatives).toEqual([])
  })

  // « x² + 0x − 49 = 0 » : un coefficient nul écrit noir sur blanc fait douter
  // de l'énoncé au lieu de faire réfléchir.
  it('n’écrit jamais un coefficient nul dans une équation', () => {
    const fautives = lot.questions
      .map((q) => q.enonce)
      .filter((e) => /[+−-] 0x|[+−-] 0 =/.test(e))
    expect(fautives).toEqual([])
  })

  it('laisse les valeurs négatives là où elles ont un sens', () => {
    // Une variation en pourcentage ou une racine peuvent être négatives : le
    // leurre de signe y est l'un des plus utiles du sous-test, et la borne ne
    // doit surtout pas s'y appliquer.
    const avecNegatif = lot.questions.filter((q) =>
      q.options.some((o) => o.trim().startsWith('−')),
    )
    expect(avecNegatif.length).toBeGreaterThan(0)
    for (const q of avecNegatif) {
      expect(/variation globale|solution|nombre/i.test(q.enonce), q.enonce.slice(0, 70)).toBe(true)
    }
  })
})

/**
 * La correction à deux niveaux.
 *
 * Le réglage vaut pour les cinq sous-tests, pas seulement pour le calcul : une
 * question de logique ratée mérite sa démarche autant qu'une question de
 * pourcentages. Et un diagnostic posé sur la BONNE proposition dirait à
 * l'élève qu'il s'est trompé alors qu'il a trouvé — c'est le seul défaut de ce
 * dispositif qui abîmerait l'entraînement, on le vérifie donc partout.
 */
describe('génération — correction à deux niveaux', () => {
  for (const section of SECTIONS_GENERABLES) {
    const lot = genererLot(section, 120, 909)

    it(`${section} : chaque question porte une démarche et un rappel plus court`, () => {
      for (const q of lot.questions) {
        expect(q.explication.trim().length, q.enonce.slice(0, 60)).toBeGreaterThan(80)
        expect(q.rappel?.trim(), q.enonce.slice(0, 60)).toBeTruthy()
        expect(q.rappel!.length, q.enonce.slice(0, 60)).toBeLessThan(q.explication.length)
      }
    })

    it(`${section} : aucun diagnostic ne porte sur la bonne réponse`, () => {
      for (const q of lot.questions) {
        const lettres = Object.keys(q.diagnostics ?? {})
        expect(lettres, q.enonce.slice(0, 60)).not.toContain(q.bonneReponse)
        for (const l of lettres) expect(['A', 'B', 'C', 'D', 'E']).toContain(l)
      }
    })
  }

  // Un diagnostic vide ou recopié d'une proposition à l'autre ne dit rien.
  it('nomme des erreurs distinctes sur les questions de calcul', () => {
    const lot = genererLot('calcul', 200, 77)
    const avecDiagnostics = lot.questions.filter((q) => Object.keys(q.diagnostics ?? {}).length >= 2)
    expect(avecDiagnostics.length).toBeGreaterThan(150)

    for (const q of avecDiagnostics) {
      const motifs = Object.values(q.diagnostics!)
      expect(new Set(motifs).size, q.enonce.slice(0, 60)).toBe(motifs.length)
    }
  })
})
