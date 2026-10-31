import { describe, expect, it } from 'vitest'
import { aleaDepuis, capitaliserPhrases } from './alea'
import { genererLot } from '.'
import { CONNECTEURS, LEXIQUE, PHRASES } from './corpus-expression'
import { FAILLES, SCENARIOS } from './corpus-raisonnement'
import { FAMILLES_EXPRESSION } from './expression'
import { FAMILLES_RAISONNEMENT, JUMELLES } from './raisonnement'

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
  const relation = (c: string) => Object.entries(CONNECTEURS).find(([, l]) => l.includes(c))![0]

  it('ne donne jamais « bien que » comme bonne réponse entre deux propositions juxtaposées', () => {
    for (const q of qs) expect(q.options['ABCDE'.indexOf(q.bonneReponse)]).not.toBe('bien que')
  })

  it('ne met jamais face à face opposition et concession', () => {
    for (const q of qs) {
      const r = relation(q.options['ABCDE'.indexOf(q.bonneReponse)])
      const rs = q.options.map(relation)
      if (r === 'opposition') expect(rs).not.toContain('concession')
      if (r === 'concession') expect(rs).not.toContain('opposition')
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
