import { describe, expect, it } from 'vitest'
import {
  MINUTES_BLANC,
  composerSemaine,
  projeterCalendrier,
  calibrerBudget,
  garantirPlusFaible,
  desequilibre,
  semainesLisibles,
  type BesoinSection,
  type ParametresSemaine,
} from './semaine'

const section = (id: string, taux = 0.6): BesoinSection => ({
  section: id,
  libelle: id,
  taux,
  skillIdsDus: [],
  questionsEnBanque: 200,
})

const base: ParametresSemaine = {
  semaineDu: '2026-09-21',
  budgetMinutes: 600,
  joursRestants: 59,
  lecons: [],
  sections: ['comprehension', 'calcul', 'raisonnement', 'conditions_minimales', 'expression', 'logique'].map(
    (s) => section(s),
  ),
  semainesDepuisDernierBlanc: null,
  joursDepuisDerniereEpreuve: 4,
  aDejaPasseUneEpreuve: true,
  banqueSuffisantePourBlanc: true,
}

const blanc = (p: ReturnType<typeof composerSemaine>) => p.taches.find((t) => t.type === 'blanc')

describe('composerSemaine — blancs', () => {
  it('programme un premier blanc dès maintenant quand aucun n’a jamais été passé', () => {
    const p = composerSemaine(base)
    expect(blanc(p)?.minutes).toBe(MINUTES_BLANC)
    expect(blanc(p)?.raison).toMatch(/Aucun blanc passé/)
  })

  it('attend ensuite la fenêtre des six semaines', () => {
    const p = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3 })
    expect(blanc(p)).toBeUndefined()
  })

  it('en reprogramme un toutes les deux semaines dans la fenêtre', () => {
    expect(blanc(composerSemaine({ ...base, joursRestants: 35, semainesDepuisDernierBlanc: 2 }))).toBeDefined()
    expect(blanc(composerSemaine({ ...base, joursRestants: 35, semainesDepuisDernierBlanc: 1 }))).toBeUndefined()
  })

  it('ne raccourcit jamais un blanc pour le faire tenir dans le budget, et le dit', () => {
    const p = composerSemaine({ ...base, budgetMinutes: 90 })
    expect(blanc(p)).toBeUndefined()
    expect(p.notes.join(' ')).toMatch(/deux heures d’affilée/)
  })

  it('annonce l’échéance et la fenêtre avec des nombres qui tombent juste', () => {
    // 59 jours : 8 semaines avant l'examen, la fenêtre (6 semaines) dans 2.
    const note = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3 }).notes.join(' ')
    expect(note).toMatch(/l’examen est dans 8 semaines/)
    expect(note).toMatch(/soit dans 2 semaines/)
    // Le mot « reste » laissait croire à 8 blancs à passer.
    expect(note).not.toMatch(/il en reste/)
  })
})

describe('semainesLisibles', () => {
  it('parle en jours sous une semaine, en semaines arrondies au-delà', () => {
    expect(semainesLisibles(5)).toBe('5 jours')
    expect(semainesLisibles(7)).toBe('1 semaine')
    expect(semainesLisibles(59)).toBe('8 semaines')
  })
})

describe('composerSemaine — diagnostics réguliers', () => {
  const diagnostic = (p: ReturnType<typeof composerSemaine>) =>
    p.taches.find((t) => t.type === 'diagnostic')

  it('programme un diagnostic quand la dernière mesure date de deux semaines', () => {
    const p = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3, joursDepuisDerniereEpreuve: 16 })
    expect(diagnostic(p)?.raison).toMatch(/il y a 16 jours/)
  })

  it('n’en programme pas si la dernière mesure est récente', () => {
    const p = composerSemaine({ ...base, semainesDepuisDernierBlanc: 3, joursDepuisDerniereEpreuve: 5 })
    expect(diagnostic(p)).toBeUndefined()
  })

  it('ne double pas un blanc déjà prévu la même semaine', () => {
    const p = composerSemaine({ ...base, semainesDepuisDernierBlanc: null, joursDepuisDerniereEpreuve: 30 })
    expect(p.taches.filter((t) => t.type === 'blanc' || t.type === 'diagnostic')).toHaveLength(1)
  })
})

describe('composerSemaine — dernier mois', () => {
  it('programme un blanc chaque semaine dans le dernier mois', () => {
    const p = composerSemaine({ ...base, joursRestants: 21, semainesDepuisDernierBlanc: 1.1 })
    expect(p.taches.some((t) => t.type === 'blanc')).toBe(true)
  })

  it('garde deux semaines d’écart entre six et quatre semaines de l’échéance', () => {
    const p = composerSemaine({ ...base, joursRestants: 38, semainesDepuisDernierBlanc: 1.1 })
    expect(p.taches.some((t) => t.type === 'blanc')).toBe(false)
  })
})

describe('composerSemaine — report', () => {
  const series = (p: ReturnType<typeof composerSemaine>, section: string) =>
    p.taches.find((t) => t.type === 'entrainement' && t.section === section)

  it('reporte les séries non faites en tête, et le dit', () => {
    const p = composerSemaine({
      ...base,
      semainesDepuisDernierBlanc: 3,
      reports: [{ section: 'logique', series: 2 }],
    })
    expect(series(p, 'logique')?.raison).toMatch(/Dont 2 reportées/)
    expect(p.notes.join(' ')).toMatch(/reportées/)
  })

  it('ne consacre jamais plus de la moitié des séries au report', () => {
    const p = composerSemaine({
      ...base,
      budgetMinutes: 100,
      semainesDepuisDernierBlanc: 3,
      reports: [{ section: 'logique', series: 9 }],
    })
    const total = p.taches.filter((t) => t.type === 'entrainement').reduce((a, t) => a + t.quantite, 0)
    expect(series(p, 'logique')!.raison).toMatch(new RegExp(`Dont ${Math.floor(total / 2)} report`))
  })
})

describe('projeterCalendrier', () => {
  const cal = projeterCalendrier({
    semaineDu: '2026-09-21',
    joursRestants: 59,
    budgetMinutes: 600,
    leconsRestantes: 21,
    semainesDepuisDernierBlanc: null,
    joursDepuisDerniereEpreuve: 4,
  })

  it('va jusqu’à la semaine de l’examen', () => {
    expect(cal[cal.length - 1].examen).toBe(true)
    expect(cal.filter((s) => s.examen)).toHaveLength(1)
  })

  it('place un premier blanc tout de suite, puis suit les règles du plan', () => {
    expect(cal[0].epreuve).toBe('blanc')
    // Dans le dernier mois (moins de 28 jours au lundi), un blanc par semaine.
    const dernierMois = cal.filter((_, i) => 59 - i * 7 <= 28 && 59 - i * 7 >= 7)
    expect(dernierMois.every((s) => s.epreuve === 'blanc')).toBe(true)
  })

  it('épuise le cours et ne remonte jamais', () => {
    const lecons = cal.map((s) => s.leconsRestantes)
    expect(lecons.every((n, i) => i === 0 || n <= lecons[i - 1])).toBe(true)
    expect(lecons[lecons.length - 1]).toBe(0)
  })
})

describe('projeterCalendrier — semaine figée et rythme mesuré', () => {
  const base = {
    semaineDu: '2026-09-21',
    joursRestants: 59,
    budgetMinutes: 600,
    leconsRestantes: 42,
    semainesDepuisDernierBlanc: null,
    joursDepuisDerniereEpreuve: 4,
  }

  it('reprend la semaine en cours telle que le plan figé la prévoit', () => {
    const cal = projeterCalendrier({ ...base, semaineEnCours: { epreuve: null, leconsRestantesFin: 38 } })
    // Le plan de lundi n'avait pas de blanc : le calendrier ne l'invente pas.
    expect(cal[0].epreuve).toBeNull()
    expect(cal[0].leconsRestantes).toBe(38)
    // Le premier blanc, dû, tombe la semaine suivante.
    expect(cal[1].epreuve).toBe('blanc')
  })

  it('épuise le cours au rythme réellement mesuré, pas au plafond du plan', () => {
    const plafond = projeterCalendrier({ ...base, semaineEnCours: { epreuve: null, leconsRestantesFin: 38 } })
    const mesure = projeterCalendrier({
      ...base,
      semaineEnCours: { epreuve: null, leconsRestantesFin: 38 },
      leconsParSemaine: 10,
    })
    expect(mesure[1].leconsRestantes).toBe(28)
    expect(mesure[2].leconsRestantes).toBe(18)
    expect(plafond[1].leconsRestantes).toBeLessThan(mesure[1].leconsRestantes)
  })
})

describe('desequilibre', () => {
  const serie = (section: string, faits: number, sur: number, taux: number) => ({
    type: 'entrainement' as const,
    section,
    mesure: { faits, sur },
    fait: faits >= sur,
    tauxActuel: taux,
  })

  it('signale un sous-test fort surentraîné pendant qu’un plus faible est en retard', () => {
    const d = desequilibre([serie('calcul', 9, 1, 0.79), serie('comprehension', 0, 2, 0.62), serie('logique', 3, 3, 0.75)])
    expect(d?.surplus.section).toBe('calcul')
    expect(d?.retards.map((r) => r.section)).toEqual(['comprehension'])
  })

  it('ne dit rien d’un surplus sur sa faiblesse', () => {
    expect(desequilibre([serie('expression', 5, 2, 0.51), serie('calcul', 0, 1, 0.79)])).toBeNull()
  })

  it('ne dit rien sans retard ailleurs', () => {
    expect(desequilibre([serie('calcul', 9, 1, 0.79), serie('logique', 3, 3, 0.75)])).toBeNull()
  })
})

describe('calibrerBudget', () => {
  it('garde le déclaré sans mesure, ou dans la tolérance', () => {
    expect(calibrerBudget(600, [])).toEqual({ budgetMinutes: 600, note: null })
    expect(calibrerBudget(600, [540])).toEqual({ budgetMinutes: 600, note: null })
  })
  it('descend vers le temps réellement passé, avec 10 % de marge', () => {
    const r = calibrerBudget(600, [420, 380])
    expect(r.budgetMinutes).toBe(462)
    expect(r.note).toContain('recalibré')
  })
  it('monte au rythme réel, sans dépasser une fois et demie le déclaré', () => {
    expect(calibrerBudget(600, [800]).budgetMinutes).toBe(800)
    expect(calibrerBudget(600, [1200]).budgetMinutes).toBe(900)
  })
})

describe('garantirPlusFaible', () => {
  const s = (section: string, taux: number) => ({ section, libelle: section, taux, skillIdsDus: [], questionsEnBanque: 100 })
  it('donne deux séries au sous-test le plus faible, prises au mieux doté', () => {
    const series = new Map([['comprehension', 4], ['expression', 1], ['calcul', 1]])
    garantirPlusFaible(series, [s('comprehension', 0.62), s('expression', 0.51), s('calcul', 0.79)])
    expect(series.get('expression')).toBe(2)
    expect(series.get('comprehension')).toBe(3)
    expect(series.get('calcul')).toBe(1)
  })
  it('laisse intacte une semaine trop courte', () => {
    const series = new Map([['comprehension', 2], ['expression', 1], ['calcul', 1]])
    garantirPlusFaible(series, [s('comprehension', 0.62), s('expression', 0.51), s('calcul', 0.79)])
    expect(series.get('expression')).toBe(1)
  })

  it('ne retire jamais un sous-test du plan', () => {
    const series = new Map([['expression', 1], ['calcul', 1], ['logique', 1], ['raisonnement', 1], ['comprehension', 1], ['conditions_minimales', 1]])
    garantirPlusFaible(series, [s('expression', 0.51), s('calcul', 0.79)])
    expect(series.get('calcul')).toBe(1)
    expect(series.get('expression')).toBe(1)
  })
})
