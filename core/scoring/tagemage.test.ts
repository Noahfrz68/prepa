import { describe, expect, it } from 'vitest'
import {
  BAREME,
  ECHELLE_MAX,
  NB_QUESTIONS,
  POINTS_BRUTS_MAX,
  HASARD,
  bruteToScaled,
  coutDesBlanches,
  esperancePoints,
  estRentableDeRepondre,
  issueDe,
  resultatSerie,
  scoreBrut,
  type Issue,
} from './tagemage'

const repeter = (issue: Issue, n: number): Issue[] => Array<Issue>(n).fill(issue)

describe('barème', () => {
  // La pénalité a été supprimée du concours : une erreur vaut 0, comme un blanc.
  it('applique +4 / 0 / 0, sans pénalité', () => {
    expect(BAREME.juste).toBe(4)
    expect(BAREME.faux).toBe(0)
    expect(BAREME.blanc).toBe(0)
  })

  it('qualifie la réponse', () => {
    expect(issueDe('C', 'C')).toBe('juste')
    expect(issueDe('A', 'C')).toBe('faux')
    expect(issueDe(null, 'C')).toBe('blanc')
    expect(issueDe('', 'C')).toBe('blanc')
  })
})

describe('scoreBrut', () => {
  it('vaut 360 pour un sans-faute', () => {
    expect(scoreBrut(repeter('juste', NB_QUESTIONS))).toBe(POINTS_BRUTS_MAX)
  })

  // Critère d'acceptation n°2 : le cas « toutes fausses » doit être borné à 0.
  it('est borné à 0 quand tout est faux', () => {
    expect(scoreBrut(repeter('faux', NB_QUESTIONS))).toBe(0)
  })

  // Critère d'acceptation n°2 : le cas « tout blanc ».
  it('vaut 0 quand tout est laissé blanc', () => {
    expect(scoreBrut(repeter('blanc', NB_QUESTIONS))).toBe(0)
  })

  it('compte 4 par juste, et rien d’autre', () => {
    const issues: Issue[] = [...repeter('juste', 10), ...repeter('faux', 6), ...repeter('blanc', 4)]
    expect(scoreBrut(issues)).toBe(10 * 4) // 40 : ni les fausses ni les blanches ne pèsent
  })

  it('gère la série vide', () => {
    expect(scoreBrut([])).toBe(0)
  })
})

describe('bruteToScaled', () => {
  it('mappe 0 sur 0 et le maximum sur 600', () => {
    expect(bruteToScaled(0)).toBe(0)
    expect(bruteToScaled(POINTS_BRUTS_MAX)).toBe(ECHELLE_MAX)
  })

  it('borne les valeurs hors domaine', () => {
    expect(bruteToScaled(-50)).toBe(0)
    expect(bruteToScaled(9999)).toBe(ECHELLE_MAX)
  })

  it('est monotone croissante', () => {
    for (let raw = 0; raw < POINTS_BRUTS_MAX; raw += 17) {
      expect(bruteToScaled(raw + 1)).toBeGreaterThanOrEqual(bruteToScaled(raw))
    }
  })
})

describe('espérance, sans pénalité', () => {
  it('répondre au pur hasard rapporte 0,8 point en moyenne', () => {
    expect(esperancePoints(HASARD)).toBeCloseTo(0.8, 10)
  })

  /**
   * La conséquence stratégique du changement de barème, verrouillée par un
   * test : il n'existe aucun niveau de doute où s'abstenir rapporte davantage
   * que répondre. Si ce test tombait, c'est que la pénalité serait revenue.
   */
  it('rend le fait de répondre toujours rentable, quel que soit le doute', () => {
    for (const p of [0, 0.05, 0.1, 0.2, 0.25, 0.5, 1]) {
      expect(estRentableDeRepondre(p), `p = ${p}`).toBe(true)
    }
  })

  it('ne retire jamais de points, même en répondant faux à tout', () => {
    expect(esperancePoints(0)).toBe(0)
    expect(scoreBrut(repeter('faux', NB_QUESTIONS))).toBe(0)
  })

  it('vaut 4 en certitude', () => {
    expect(esperancePoints(1)).toBe(BAREME.juste)
  })

  // Une case blanche n'est plus neutre : c'est une espérance qu'on jette.
  it('chiffre ce que coûtent les cases laissées vides', () => {
    expect(coutDesBlanches(0)).toBe(0)
    expect(coutDesBlanches(1)).toBeCloseTo(0.8, 10)
    expect(coutDesBlanches(10)).toBeCloseTo(8, 10)
  })

  // Deux copies au même nombre de bonnes réponses valent désormais pareil,
  // que l'une ait rempli toutes les cases et l'autre non.
  it('donne le même score à nombre égal de bonnes réponses', () => {
    const prudent: Issue[] = [...repeter('juste', 10), ...repeter('blanc', 5)]
    const audacieux: Issue[] = [...repeter('juste', 10), ...repeter('faux', 5)]
    expect(scoreBrut(prudent)).toBe(scoreBrut(audacieux))
  })
})

describe('resultatSerie', () => {
  it('décompte justes, fausses et blanches', () => {
    const r = resultatSerie([...repeter('juste', 7), ...repeter('faux', 5), ...repeter('blanc', 3)])
    expect(r.nbItems).toBe(15)
    expect(r.justes).toBe(7)
    expect(r.fausses).toBe(5)
    expect(r.blanches).toBe(3)
    expect(r.pointsBruts).toBe(7 * 4) // 28 : seules les justes comptent
    expect(r.tauxReussite).toBeCloseTo(7 / 15)
  })

  it('extrapole sur 600 au prorata de la série', () => {
    expect(resultatSerie(repeter('juste', 15)).scoreExtrapole).toBe(ECHELLE_MAX)
    expect(resultatSerie(repeter('faux', 15)).scoreExtrapole).toBe(0)
  })

  it('ne divise pas par zéro sur une série vide', () => {
    const r = resultatSerie([])
    expect(r.scoreExtrapole).toBe(0)
    expect(r.tauxReussite).toBe(0)
  })
})
