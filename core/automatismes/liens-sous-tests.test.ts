import { describe, expect, it } from 'vitest'
import { skillsTageMage } from '@/exams/tagemage'
import { jeu } from './index'
import { JEUX_PAR_SOUS_TEST, SOUS_TESTS_DE_METHODE } from './liens-sous-tests'

describe('sous-tests → automatismes', () => {
  // Un sous-test renommé dans la taxonomie casserait le lien en silence :
  // ses erreurs ne désigneraient plus aucun jeu.
  it('ne cite que des sous-tests qui existent', () => {
    const ids = new Set(skillsTageMage().map((s) => s.id))
    for (const id of Object.keys(JEUX_PAR_SOUS_TEST)) expect(ids.has(id), id).toBe(true)
  })

  it('désigne des jeux qui existent', () => {
    for (const [id, jeux] of Object.entries(JEUX_PAR_SOUS_TEST)) {
      expect(jeux.length, id).toBeGreaterThan(0)
      for (const j of jeux) expect(jeu(j), `${id} → ${j}`).toBeDefined()
    }
  })

  it('couvre tous les sous-tests de calcul', () => {
    const calcul = skillsTageMage().filter((s) => s.section === 'calcul')
    for (const s of calcul) expect(JEUX_PAR_SOUS_TEST[s.id], s.id).toBeDefined()
  })
})

describe('sous-tests de méthode', () => {
  it('sont tous reliés à un automatisme', () => {
    for (const id of SOUS_TESTS_DE_METHODE) expect(JEUX_PAR_SOUS_TEST[id], id).toBeDefined()
  })
})
