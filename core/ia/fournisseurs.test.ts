import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AUCUN, CHAINE_PAR_DEFAUT, etatChaine, fournisseurActif, iaDisponible } from './fournisseurs'

/**
 * Critère d'acceptation n°1 : l'application démarre et reste pleinement
 * utilisable sans aucune clé configurée. Ces tests verrouillent ce contrat.
 */

const VARIABLES = [
  'IA_CHAINE',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OLLAMA_MODELE',
  'ANTHROPIC_API_KEY',
]

let sauvegarde: Record<string, string | undefined> = {}

beforeEach(() => {
  sauvegarde = Object.fromEntries(VARIABLES.map((v) => [v, process.env[v]]))
  for (const v of VARIABLES) delete process.env[v]
})

afterEach(() => {
  for (const [v, valeur] of Object.entries(sauvegarde)) {
    if (valeur === undefined) delete process.env[v]
    else process.env[v] = valeur
  }
})

describe('sans aucune configuration', () => {
  it('ne lève pas : l’absence d’IA est un état normal, pas une erreur', () => {
    expect(() => fournisseurActif()).not.toThrow()
    expect(() => etatChaine()).not.toThrow()
  })

  it('renvoie le fournisseur « aucun »', () => {
    expect(fournisseurActif().id).toBe('aucun')
    expect(iaDisponible()).toBe(false)
  })

  it('explique pourquoi chaque fournisseur est indisponible', () => {
    const chaine = etatChaine()
    expect(chaine.length).toBeGreaterThan(0)
    for (const f of chaine) {
      expect(f.raisonIndisponibilite).toBeTruthy()
      expect(f.raisonIndisponibilite).toMatch(/\.env\.local/)
    }
  })

  it('refuse d’appeler quoi que ce soit', async () => {
    await expect(AUCUN.completer('sys', 'msg')).rejects.toThrow(/Aucun fournisseur/)
  })
})

describe('résolution de la chaîne', () => {
  it('sélectionne le premier fournisseur dont la clé est posée', () => {
    process.env.GROQ_API_KEY = 'test'
    expect(fournisseurActif().id).toBe('groq-free')
  })

  it('respecte l’ordre de la chaîne', () => {
    process.env.GEMINI_API_KEY = 'test'
    process.env.GROQ_API_KEY = 'test'
    expect(fournisseurActif().id).toBe('gemini-free')
  })

  it('honore un ordre explicite', () => {
    process.env.IA_CHAINE = 'groq-free,gemini-free'
    process.env.GEMINI_API_KEY = 'test'
    process.env.GROQ_API_KEY = 'test'
    expect(fournisseurActif().id).toBe('groq-free')
  })

  it('ignore les identifiants inconnus et retombe sur la chaîne par défaut', () => {
    process.env.IA_CHAINE = 'inexistant,autre-inconnu'
    process.env.GEMINI_API_KEY = 'test'
    expect(fournisseurActif().id).toBe(CHAINE_PAR_DEFAUT[0])
  })

  // Le budget du projet est de 0 €/mois : un fournisseur payant ne doit jamais
  // s'activer tout seul.
  it('n’active jamais Anthropic sans clé délibérément posée', () => {
    process.env.IA_CHAINE = 'anthropic'
    expect(fournisseurActif().id).toBe('aucun')

    process.env.ANTHROPIC_API_KEY = 'test'
    expect(fournisseurActif().id).toBe('anthropic')
  })

  it('laisse Ollama hors de la chaîne par défaut', () => {
    expect(CHAINE_PAR_DEFAUT).not.toContain('ollama-local')
  })
})
