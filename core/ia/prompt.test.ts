import { describe, expect, it } from 'vitest'
import { PROMPT_TUTEUR, decouperReponse } from './prompt'

describe('PROMPT_TUTEUR', () => {
  /**
   * Conseiller de laisser une case vide est désormais l'erreur la plus
   * coûteuse que le tuteur puisse commettre, sur l'un comme sur l'autre
   * examen : aucun des deux ne pénalise plus l'erreur. Le prompt doit
   * l'interdire nommément, et ne plus présenter les barèmes comme opposés.
   */
  it('interdit de conseiller une case vide, sur les deux examens', () => {
    expect(PROMPT_TUTEUR).toMatch(/NE JAMAIS CONSEILLER DE LAISSER UNE CASE VIDE/)
    expect(PROMPT_TUTEUR).toMatch(/JAMAIS à un candidat de laisser une case vide/)
    expect(PROMPT_TUTEUR).toMatch(/TAGE MAGE[\s\S]*supprimée/)
    expect(PROMPT_TUTEUR).not.toMatch(/mauvaise réponse = −1/)
  })

  it('interdit d’inventer des chiffres', () => {
    expect(PROMPT_TUTEUR).toMatch(/tu ne les inventes jamais/)
  })

  it('reste compact — les paliers gratuits ont des quotas serrés', () => {
    expect(PROMPT_TUTEUR.length).toBeLessThan(6000)
  })
})

describe('decouperReponse', () => {
  const texte = 'Tu es à 41 % en conditions minimales. Travaille le format A-E.'

  it('sépare le texte du bloc JSON', () => {
    const brut = `${texte}\n\n\`\`\`json\n{"categorie_dominante":"methode","action_prioritaire":"Refais 15 conditions minimales"}\n\`\`\``
    const r = decouperReponse(brut)
    expect(r.texte).toBe(texte)
    expect(r.donnees?.categorieDominante).toBe('methode')
    expect(r.donnees?.actionPrioritaire).toBe('Refais 15 conditions minimales')
  })

  it('accepte un bloc de code sans étiquette de langage', () => {
    const brut = `${texte}\n\n\`\`\`\n{"alerte_calibration":"surconfiance"}\n\`\`\``
    expect(decouperReponse(brut).donnees?.alerteCalibration).toBe('surconfiance')
  })

  // Un JSON cassé ne doit jamais faire perdre le texte : c'est la partie utile.
  it('conserve le texte quand le JSON est invalide', () => {
    const brut = `${texte}\n\n\`\`\`json\n{ceci n'est pas du JSON\n\`\`\``
    const r = decouperReponse(brut)
    expect(r.texte).toBe(texte)
    expect(r.donnees).toBeNull()
  })

  it('renvoie le texte seul quand il n’y a aucun bloc', () => {
    const r = decouperReponse(texte)
    expect(r.texte).toBe(texte)
    expect(r.donnees).toBeNull()
  })

  it('ignore les champs improvisés et les types inattendus', () => {
    const brut = `${texte}\n\n\`\`\`json\n{"categorie_dominante":42,"champ_invente":"x","skills_ciblees":["pourcentages",7]}\n\`\`\``
    const r = decouperReponse(brut)
    expect(r.donnees?.categorieDominante).toBeUndefined()
    expect(r.donnees?.skillsCiblees).toEqual(['pourcentages'])
    expect(r.donnees).not.toHaveProperty('champ_invente')
  })

  it('traite une chaîne vide comme une absence de valeur', () => {
    const brut = `${texte}\n\n\`\`\`json\n{"action_prioritaire":"   ","memoire":""}\n\`\`\``
    const r = decouperReponse(brut)
    expect(r.donnees?.actionPrioritaire).toBeUndefined()
    expect(r.donnees?.memoire).toBeNull()
  })

  it('extrait la mémoire quand elle est renseignée', () => {
    const brut = `${texte}\n\n\`\`\`json\n{"memoire":"Profil : vise 450."}\n\`\`\``
    expect(decouperReponse(brut).donnees?.memoire).toBe('Profil : vise 450.')
  })
})
