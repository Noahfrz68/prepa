import { describe, expect, it } from 'vitest'
import { aleaDepuis, capitaliserPhrases } from './alea'
import { genererLot } from '.'
import { CONNECTEURS, LEXIQUE, PAIRES, PHRASES } from './corpus-expression'
import { FAILLES, SCENARIOS } from './corpus-raisonnement'
import { FAMILLES_EXPRESSION } from './expression'
import { FAMILLES_RAISONNEMENT, JUMELLES } from './raisonnement'
import { FAMILLES_CONDITIONS } from './conditions'

/**
 * Les défauts trouvés en relisant la banque question par question
 * (audit du 2026-10-21). Chacun avait produit des questions à deux bonnes
 * réponses ou des phrases fautives en base ; ces tests empêchent leur retour.
 */

describe('raisonnement — argumentation', () => {
  const lot = FAMILLES_RAISONNEMENT.filter((f) => ['affaiblir', 'renforcer', 'hypothèse implicite', 'sophisme'].includes(f.nom)).flatMap((f) => {
    const a = aleaDepuis(3)
    return Array.from({ length: 300 }, () => f.produire(a))
  })

  it('ne propose jamais le remède de la faille jumelle, qui vaudrait aussi', () => {
    const parId = new Map(FAILLES.map((f) => [f.id, f]))
    for (const q of lot) {
      const sc = SCENARIOS.find((s) => q.enonce.split('\n')[0] === capitaliserPhrases(s.texte(s.contexte)))
      expect(sc, q.enonce).toBeDefined()
      if (!sc || !JUMELLES[sc.faille]) continue
      const j = parId.get(JUMELLES[sc.faille])!
      const interdits = [j.affaiblit(sc.contexte), j.renforce(sc.contexte), j.presuppose(sc.contexte), j.nom].map((t) => t.toLowerCase())
      for (const o of q.options) expect(interdits, `${q.enonce}\n→ ${o}`).not.toContain(o.toLowerCase())
    }
  })

  // Audit du 2026-10-31 : ces remèdes s'appliquaient à n'importe quel argument
  // et donnaient une seconde bonne réponse aux questions d'une autre faille.
  it('ne propose aucun remède passe-partout', () => {
    const PASSE_PARTOUT = [
      'toutes les autres possibilités envisageables ont été testées puis écartées.',
      'une troisième solution, ignorée par l’argument, obtient de meilleurs résultats.',
      'les travaux publiés sur la question aboutissent tous à la même conclusion.',
    ]
    for (const q of lot) for (const o of q.options) expect(PASSE_PARTOUT, `${q.enonce}\n→ ${o}`).not.toContain(o.toLowerCase())
  })

  it('ne fait pas affirmer une cause à un argument de moyenne', () => {
    for (const s of SCENARIOS.filter((s) => s.faille === 'moyenne')) expect(s.texte(s.contexte)).not.toMatch(/bénéficié/)
  })

  it('contracte « de le » et « de les »', () => {
    for (const q of lot) for (const t of [q.enonce, q.explication, ...q.options]) expect(t).not.toMatch(/\bde les? /)
  })
})

describe('expression — connecteurs et lexique', () => {
  const famille = FAMILLES_EXPRESSION.find((f) => f.nom === 'connecteur logique')!
  const a = aleaDepuis(9)
  const qs = Array.from({ length: 500 }, () => famille.produire(a))
  // Chaque proposition est une phrase « gauche, connecteur droite. » : on
  // retrouve sa paire du corpus et la relation du connecteur employé.
  const lire = (o: string) => {
    const p = PAIRES.find((x) => o.startsWith(`${x.gauche}, `))!
    const milieu = o.slice(p.gauche.length + 2)
    const c = Object.values(CONNECTEURS).flat().find((x) => milieu.startsWith(`${x} `) || milieu.startsWith(x.replace(/que$/, 'qu’')))!
    const r = Object.entries(CONNECTEURS).find(([, l]) => l.includes(c))![0]
    return { paire: p.relation, connecteur: c, relation: r }
  }

  it('ne donne jamais « bien que » comme bonne réponse entre deux propositions juxtaposées', () => {
    for (const q of qs) expect(lire(q.options['ABCDE'.indexOf(q.bonneReponse)]).connecteur).not.toBe('bien que')
  })

  it('n’a qu’une phrase juste : les leurres ne portent ni la relation de leur paire, ni une relation qui pourrait s’y lire', () => {
    // Opposition et concession se lisent l'une dans l'autre ; « de plus » colle à
    // presque tout ; une conséquence se lit souvent dans une opposition ou une addition.
    const LISIBLE: Record<string, string[]> = {
      opposition: ['concession', 'addition', 'consequence'],
      concession: ['opposition', 'addition'],
      addition: ['cause', 'consequence'],
      condition: ['cause', 'addition', 'concession'],
    }
    for (const q of qs) {
      const juste = lire(q.options['ABCDE'.indexOf(q.bonneReponse)])
      expect(juste.relation).toBe(juste.paire)
      for (const o of q.options.filter((_, i) => 'ABCDE'[i] !== q.bonneReponse)) {
        const l = lire(o)
        expect(l.relation, o).not.toBe(l.paire)
        expect(l.relation, o).not.toBe('addition')
        expect(LISIBLE[l.paire] ?? [], o).not.toContain(l.relation)
      }
    }
  })

  it('n’offre pas de leurre de lexique qui serait un quasi-synonyme ou un quasi-contraire', () => {
    const SUSPECTS: Record<string, string> = {
      ostensible: 'ostentatoire', idoine: 'idéale', occulter: 'éclairer', ténu: 'certain',
      velléitaire: 'volontaire', corroborer: 'contester', proscrire: 'promouvoir', entériner: 'enterrer',
    }
    for (const e of LEXIQUE) if (SUSPECTS[e.mot]) expect(e.leurres, e.mot).not.toContain(SUSPECTS[e.mot])
  })

  it('ne garde aucune variante fautive qui serait en réalité correcte', () => {
    const textes = PHRASES.flatMap((p) => p.variantes.map((v) => v.texte))
    expect(textes).not.toContain('Vous seriez surpris de constater à quel point ses résultats varient.')
    expect(textes).not.toContain('Nous avons discuté davantage de la méthode que de résultats.')
  })
})

describe('calcul — écriture des nombres', () => {
  const { questions } = genererLot('calcul', 400, 11)

  it('n’écrit pas « 1x » ni « ÷ 1 »', () => {
    for (const q of questions) expect(`${q.explication} ${q.rappel}`).not.toMatch(/(?<![\d,])1x\b|÷ 1 =/)
  })

  it('n’affiche pas de décimales nulles quand toutes les propositions sont rondes', () => {
    for (const q of questions) expect(q.options.every((o) => /,00\b/.test(o)), q.options.join(' / ')).toBe(false)
  })
})

/**
 * Relevé le 2026-11-05 : « Que vaut x + y ? (1) x + y = 30. (2) x = 16 et
 * y = 14. » Réponse D sans rien lire. Une information suffisante ne doit
 * jamais réciter la réponse ; elle doit suffire APRÈS un raisonnement.
 */
describe('conditions minimales — informations suffisantes', () => {
  // [question visée, information qui y répondrait sans raisonner]. La même
  // phrase peut être légitime ailleurs : « x + y = 36 » est un piège quand on
  // demande x, une récitation quand on demande x + y.
  const RECITEES: Array<[RegExp, RegExp]> = [
    [/que vaut x \+ y/, /^x \+ y = [\d  ]+\.$/],
    [/que vaut x \+ y|que vaut le produit xy/, /^x = \d+ et y = \d/],
    [/que vaut le produit xy/, /^xy = [\d  ]+\.$/],
    [/femmes/, /dont [\d  ]+ femmes/],
    [/périmètre d'un carré/, /^Son côté mesure \d/],
    [/aire d'un rectangle/, /^Sa longueur mesure .* et sa largeur/],
    [/médiane/, /^Rangées dans l'ordre|^Deux élèves ont moins de/],
    [/coûte un cahier/, /^\d+ cahiers coûtent/],
    [/nouveau prix/, /^Il coûtait .* et a augmenté/],
  ]
  const lot = FAMILLES_CONDITIONS.flatMap((f) => {
    const a = aleaDepuis(11)
    return Array.from({ length: 60 }, () => f.produire(a))
  })

  it('ne récitent jamais la réponse', () => {
    for (const q of lot) {
      for (const info of [q.info1, q.info2]) {
        for (const [question, motif] of RECITEES) {
          if (question.test(q.enonce)) expect(info, `${q.enonce} → ${info}`).not.toMatch(motif)
        }
      }
    }
  })
})
