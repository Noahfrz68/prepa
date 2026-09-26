import { describe, expect, it } from 'vitest'
import {
  ECART_TOLERE,
  MINUTES_PAR_SEANCE,
  SKILLS_PAR_SEANCE,
  ajusterBudget,
  composerSemaine,
  lundiDeLaSemaine,
  type EntreeCompetence,
  type ParametresPlan,
} from './plan'

const comp = (
  skillId: string,
  section: string,
  extra: Partial<EntreeCompetence> = {},
): EntreeCompetence => ({
  skillId,
  libelle: skillId,
  section,
  sectionLibelle: section,
  n: 10,
  tauxReussite: 0.4,
  joursDeRetard: 3,
  jamaisVue: false,
  ...extra,
})

const base: ParametresPlan = {
  budgetMinutes: 300,
  dues: [],
  faibles: [],
  joursRestants: 90,
  semainesDepuisDernierBlanc: 1,
  banqueSuffisantePourBlanc: true,
  aDejaPasseUneEpreuve: true,
  epreuvesDisponibles: true,
}

describe('composerSemaine — épreuves', () => {
  it('impose un diagnostic tant qu’aucune épreuve n’a été passée', () => {
    const p = composerSemaine({ ...base, aDejaPasseUneEpreuve: false })
    expect(p.seances[0].type).toBe('diagnostic')
  })

  it('programme un blanc à l’approche de l’examen', () => {
    const p = composerSemaine({ ...base, joursRestants: 28, semainesDepuisDernierBlanc: 3 })
    expect(p.seances.some((s) => s.type === 'blanc')).toBe(true)
  })

  it('n’en programme pas deux semaines de suite', () => {
    const p = composerSemaine({ ...base, joursRestants: 28, semainesDepuisDernierBlanc: 1 })
    expect(p.seances.some((s) => s.type === 'blanc')).toBe(false)
  })

  it('n’en programme pas quand l’examen est encore loin', () => {
    const p = composerSemaine({ ...base, joursRestants: 200, semainesDepuisDernierBlanc: 10 })
    expect(p.seances.some((s) => s.type === 'blanc')).toBe(false)
  })

  it('renonce au blanc si la banque ne suffit pas, et le dit', () => {
    const p = composerSemaine({
      ...base,
      joursRestants: 28,
      semainesDepuisDernierBlanc: 3,
      banqueSuffisantePourBlanc: false,
    })
    expect(p.seances.some((s) => s.type === 'blanc')).toBe(false)
    expect(p.notes.join(' ')).toMatch(/banque/i)
  })

  it('ne programme pas un blanc qui ne tient pas dans le budget', () => {
    const p = composerSemaine({
      ...base,
      budgetMinutes: 40,
      joursRestants: 28,
      semainesDepuisDernierBlanc: 3,
    })
    const blanc = p.seances.find((s) => s.type === 'blanc')
    expect(blanc?.minutes ?? 0).toBeLessThanOrEqual(40)
    expect(p.minutesPlanifiees).toBeLessThanOrEqual(40)
  })
})

describe('composerSemaine — épreuves indisponibles', () => {
  // Non-régression : sans ce garde-fou, le plan TOEIC proposait une séance
  // « diagnostic » dont le lien menait au diagnostic TAGE MAGE.
  it('ne propose aucune épreuve à un examen qui n’en a pas', () => {
    const p = composerSemaine({
      ...base,
      epreuvesDisponibles: false,
      aDejaPasseUneEpreuve: false,
      joursRestants: 28,
      semainesDepuisDernierBlanc: 5,
      dues: [comp('a', 'p5')],
    })
    expect(p.seances.some((s) => s.type === 'diagnostic' || s.type === 'blanc')).toBe(false)
    expect(p.seances.some((s) => s.type === 'revision')).toBe(true)
  })

  it('ne signale pas une banque insuffisante pour un blanc qui n’existe pas', () => {
    const p = composerSemaine({
      ...base,
      epreuvesDisponibles: false,
      banqueSuffisantePourBlanc: false,
      dues: [comp('a', 'p5')],
    })
    expect(p.notes.join(' ')).not.toMatch(/blanc complet/i)
  })
})

describe('composerSemaine — priorités', () => {
  it('place les révisions dues avant les faiblesses', () => {
    const p = composerSemaine({
      ...base,
      budgetMinutes: MINUTES_PAR_SEANCE,
      dues: [comp('due', 'calcul')],
      faibles: [comp('faible', 'logique')],
    })
    expect(p.seances[0].type).toBe('revision')
    expect(p.seances.some((s) => s.type === 'renforcement')).toBe(false)
  })

  it('ne replace pas en renforcement une compétence déjà révisée', () => {
    const partagee = comp('meme', 'calcul')
    const p = composerSemaine({ ...base, dues: [partagee], faibles: [partagee] })
    const occurrences = p.seances.filter((s) => s.skills.includes('meme'))
    expect(occurrences).toHaveLength(1)
  })

  it('ne mélange jamais deux sous-tests dans une séance', () => {
    const p = composerSemaine({
      ...base,
      dues: [comp('a', 'calcul'), comp('b', 'logique'), comp('c', 'calcul')],
    })
    for (const s of p.seances.filter((x) => x.section !== null)) {
      expect(new Set([s.section])).toHaveProperty('size', 1)
    }
    const sections = p.seances.filter((s) => s.type === 'revision').map((s) => s.section)
    expect(new Set(sections).size).toBe(2)
  })

  it('regroupe au plus trois compétences par séance', () => {
    const dues = Array.from({ length: 7 }, (_, i) => comp(`s${i}`, 'calcul'))
    const p = composerSemaine({ ...base, dues })
    for (const s of p.seances) expect(s.skills.length).toBeLessThanOrEqual(SKILLS_PAR_SEANCE)
  })
})

describe('composerSemaine — budget', () => {
  it('ne dépasse jamais le budget alloué', () => {
    const dues = Array.from({ length: 30 }, (_, i) => comp(`s${i}`, i % 2 ? 'calcul' : 'logique'))
    const p = composerSemaine({ ...base, budgetMinutes: 100, dues })
    expect(p.minutesPlanifiees).toBeLessThanOrEqual(100)
  })

  it('ne compose rien avec un budget dérisoire, et le dit', () => {
    const p = composerSemaine({ ...base, budgetMinutes: 5, dues: [comp('a', 'calcul')] })
    expect(p.seances).toHaveLength(0)
    expect(p.notes.join(' ')).toMatch(/trop court/i)
  })

  it('signale un budget non consommé plutôt que de le remplir de redites', () => {
    const p = composerSemaine({ ...base, budgetMinutes: 300, dues: [comp('a', 'calcul')] })
    expect(p.notes.join(' ')).toMatch(/non attribuées/i)
  })

  it('signale l’absence de matière à planifier', () => {
    const p = composerSemaine({ ...base, dues: [], faibles: [] })
    expect(p.notes.join(' ')).toMatch(/Rien à programmer|non attribuées/i)
  })

  it('avertit quand l’examen est imminent', () => {
    const p = composerSemaine({ ...base, joursRestants: 10, semainesDepuisDernierBlanc: 5 })
    expect(p.notes.join(' ')).toMatch(/stratégie et du rythme/i)
  })
})

describe('ajusterBudget', () => {
  it('conserve le budget déclaré la première semaine', () => {
    const a = ajusterBudget(300, null)
    expect(a.verdict).toBe('premiere_semaine')
    expect(a.budgetMinutes).toBe(300)
  })

  it('réduit le plan quand le volume réel décroche', () => {
    const a = ajusterBudget(300, 100)
    expect(a.verdict).toBe('reduit')
    expect(a.budgetMinutes).toBeLessThan(300)
    expect(a.budgetMinutes).toBeGreaterThanOrEqual(100)
    expect(a.message).toMatch(/mal calibré/)
  })

  it('relève le plan quand le volume réel dépasse durablement', () => {
    const a = ajusterBudget(120, 300)
    expect(a.verdict).toBe('augmente')
    expect(a.budgetMinutes).toBe(300)
  })

  it('ne bouge pas dans la tolérance', () => {
    expect(ajusterBudget(300, 300 * (1 - ECART_TOLERE + 0.01)).verdict).toBe('tenu')
    expect(ajusterBudget(300, 300 * (1 + ECART_TOLERE - 0.01)).verdict).toBe('tenu')
  })

  it('ne descend pas sous une séance exploitable', () => {
    expect(ajusterBudget(300, 0).budgetMinutes).toBeGreaterThanOrEqual(10)
  })
})

describe('lundiDeLaSemaine', () => {
  it('renvoie le lundi, y compris depuis un dimanche', () => {
    expect(lundiDeLaSemaine('2026-09-01')).toBe('2026-08-31') // mardi → lundi
    expect(lundiDeLaSemaine('2026-09-06')).toBe('2026-08-31') // dimanche → lundi
    expect(lundiDeLaSemaine('2026-08-31')).toBe('2026-08-31') // lundi
  })
})
