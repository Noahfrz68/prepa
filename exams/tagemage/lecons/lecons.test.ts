import { describe, expect, it } from 'vitest'
import { LECONS, PARCOURS, TABLES, leconsDeSection } from './index'
import { skillsTageMage, SECTIONS } from '../index'

describe('leçons — couverture', () => {
  /**
   * Le contrat de la page : une leçon par sous-compétence, sans trou.
   *
   * C'est ce qui permet à un taux faible de renvoyer vers une page précise.
   * Ajouter une sous-compétence sans sa leçon laisserait un type de question
   * mesuré mais non expliqué — exactement le défaut qu'on cherchait à corriger.
   */
  it('couvre chaque sous-compétence, une fois et une seule', () => {
    const skills = skillsTageMage().map((s) => s.id)
    const couvertes = LECONS.map((l) => l.skillId)

    expect([...couvertes].sort()).toEqual([...skills].sort())
    expect(new Set(couvertes).size).toBe(couvertes.length)
  })

  it('rattache chaque leçon à la section de sa sous-compétence', () => {
    const parSkill = new Map(skillsTageMage().map((s) => [s.id, s.section]))
    for (const l of LECONS) {
      expect(l.section, l.titre).toBe(parSkill.get(l.skillId))
    }
  })

  it('donne des leçons à tous les sous-tests', () => {
    for (const s of SECTIONS) {
      expect(leconsDeSection(s.id).length, s.libelle).toBeGreaterThan(0)
    }
  })
})

describe('leçons — forme', () => {
  it('porte partout une règle, un exemple déroulé et un piège', () => {
    for (const l of LECONS) {
      expect(l.regles.length, l.titre).toBeGreaterThanOrEqual(3)
      expect(l.quoi.trim().length, l.titre).toBeGreaterThan(20)
      expect(l.piege.trim().length, l.titre).toBeGreaterThan(30)
      expect(l.exemple.enonce.trim().length, l.titre).toBeGreaterThan(20)
      expect(l.exemple.etapes.length, l.titre).toBeGreaterThanOrEqual(2)
      expect(l.exemple.reponse.trim().length, l.titre).toBeGreaterThan(5)
      for (const r of l.regles) {
        expect(r.titre.trim(), l.titre).toBeTruthy()
        expect(r.texte.trim().length, `${l.titre} — ${r.titre}`).toBeGreaterThan(40)
      }
    }
  })

  /**
   * Un caractère de contrôle s'est déjà glissé dans ce dépôt, par un script
   * d'édition qui a transformé « \b » en 0x08. Il n'était visible nulle part et
   * cassait silencieusement le classement. On ne le laisse plus passer.
   */
  it('ne contient aucun caractère de contrôle', () => {
    const tout = JSON.stringify(LECONS) + JSON.stringify(TABLES)
    // Écrit en échappement : poser le motif avec des caractères littéraux
    // reproduirait dans ce fichier même le défaut qu'il traque.
    const controle = new RegExp('[\u0000-\u0008\u000B-\u001F\u007F]', 'g')
    expect([...tout.matchAll(controle)].map((m) => m[0].charCodeAt(0))).toEqual([])
  })

  it('donne à chaque table de la boîte à outils une raison d’exister', () => {
    expect(TABLES.length).toBeGreaterThan(4)
    for (const t of TABLES) {
      expect(t.lignes.length, t.titre).toBeGreaterThan(0)
      expect(t.pourquoi.trim().length, t.titre).toBeGreaterThan(40)
    }
  })
})

describe('leçons — pédagogie', () => {
  // Un cours qu'on relit sans jamais rien ressortir donne le sentiment de le
  // savoir sans le savoir. Chaque leçon doit demander un effort de mémoire.
  it('demande partout de retrouver trois choses de mémoire', () => {
    for (const l of LECONS) {
      expect(l.retrouver.length, l.titre).toBeGreaterThanOrEqual(3)
      for (const r of l.retrouver) {
        expect(r.q.trim().length, l.titre).toBeGreaterThan(15)
        expect(r.r.trim().length, l.titre).toBeGreaterThan(10)
        expect(r.q.trim(), l.titre).not.toBe(r.r.trim())
      }
    }
  })

  // L'estompage : entièrement résolu, puis à faire seul avec un indice.
  it('propose partout un second exercice à faire seul', () => {
    for (const l of LECONS) {
      expect(l.aToi.enonce.trim().length, l.titre).toBeGreaterThan(30)
      expect(l.aToi.indice.trim().length, l.titre).toBeGreaterThan(20)
      expect(l.aToi.reponse.trim().length, l.titre).toBeGreaterThan(30)
      // L'indice doit aider sans livrer : s'il est aussi long que la réponse,
      // il n'estompe rien.
      expect(l.aToi.indice.length, l.titre).toBeLessThan(l.aToi.reponse.length)
      expect(l.aToi.enonce.trim(), l.titre).not.toBe(l.exemple.enonce.trim())
    }
  })

  it('place chaque leçon dans le parcours, une fois et une seule', () => {
    const places = PARCOURS.flatMap((e) => e.skillIds)
    expect([...places].sort()).toEqual(LECONS.map((l) => l.skillId).sort())
    expect(new Set(places).size).toBe(places.length)
    for (const e of PARCOURS) {
      expect(e.pourquoi.trim().length, e.titre).toBeGreaterThan(80)
      expect(e.duree.trim(), e.titre).toBeTruthy()
      expect(e.skillIds.length, e.titre).toBeGreaterThan(0)
    }
  })

  // Les deux sous-tests verbaux étaient les plus minces alors qu'ils sont les
  // seuls à demander du savoir brut. On empêche la rechute.
  it('ne laisse pas les sous-tests verbaux plus maigres que les autres', () => {
    const mots = (l: (typeof LECONS)[number]) =>
      l.regles.reduce((a, r) => a + r.texte.split(/s+/).length, 0)
    const moyenne = (section: string) => {
      const liste = LECONS.filter((l) => l.section === section)
      return liste.reduce((a, l) => a + mots(l), 0) / liste.length
    }
    const reference = moyenne('calcul')
    expect(moyenne('expression')).toBeGreaterThan(reference)
    expect(moyenne('comprehension')).toBeGreaterThan(reference * 0.85)
  })
})
