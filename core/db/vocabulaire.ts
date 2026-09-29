import { db } from './queries'
import {
  ETAT_INITIAL,
  ajouterJours,
  joursEntre,
  reviser,
  type EtatRevision,
} from '@/core/scheduler/sm2'

/**
 * Vocabulaire TOEIC.
 *
 * Les cartes naissent des erreurs, jamais d'une liste. L'état de révision est
 * reconstruit en rejouant `vocab_revision`, exactement comme `skill_state` est
 * reconstruit depuis `attempt` : le journal est la source de vérité.
 *
 * Une révision de carte est un rappel binaire — su / pas su — ce qui est
 * précisément le régime pour lequel SM-2 a été conçu. Contrairement aux
 * sous-compétences, aucune adaptation n'est nécessaire ici : on note 5 si su,
 * 1 sinon.
 */

export const NOTE_SU = 5
export const NOTE_PAS_SU = 1

export type FormeVocab = 'mot' | 'expression' | 'collocation' | 'phrasal_verb'

export interface Carte {
  id: number
  terme: string
  forme: FormeVocab
  definitionEn: string | null
  traductionFr: string | null
  exemple: string | null
  domaine: string | null
  origineItemId: number | null
  repetitions: number
  intervalleJours: number
  prochaineRevision: string | null
  nRevisions: number
  nSues: number
}

export interface NouvelleCarte {
  terme: string
  forme?: FormeVocab
  definitionEn?: string | null
  traductionFr?: string | null
  exemple?: string | null
  domaine?: string | null
  origineItemId?: number | null
}

/**
 * Crée une carte, ou renforce celle qui existe déjà.
 *
 * Rater deux fois le même mot ne doit pas produire deux cartes : la seconde
 * rencontre complète les champs restés vides, sans écraser ce qui est saisi.
 */
export function creerOuCompleterCarte(c: NouvelleCarte): { id: number; creee: boolean } {
  const d = db()
  const terme = c.terme.trim()
  if (!terme) throw new Error('Terme vide.')

  const existante = d
    .prepare(`SELECT id FROM vocab_card WHERE lower(terme) = lower(?)`)
    .get(terme) as { id: number } | undefined

  if (existante) {
    d.prepare(
      `UPDATE vocab_card SET
         definition_en   = COALESCE(definition_en, @definitionEn),
         traduction_fr   = COALESCE(traduction_fr, @traductionFr),
         exemple         = COALESCE(exemple, @exemple),
         domaine         = COALESCE(domaine, @domaine),
         origine_item_id = COALESCE(origine_item_id, @origineItemId)
       WHERE id = @id`,
    ).run({
      id: existante.id,
      definitionEn: c.definitionEn ?? null,
      traductionFr: c.traductionFr ?? null,
      exemple: c.exemple ?? null,
      domaine: c.domaine ?? null,
      origineItemId: c.origineItemId ?? null,
    })
    return { id: existante.id, creee: false }
  }

  const info = d
    .prepare(
      `INSERT INTO vocab_card (terme, forme, definition_en, traduction_fr, exemple, domaine, origine_item_id)
       VALUES (@terme, @forme, @definitionEn, @traductionFr, @exemple, @domaine, @origineItemId)`,
    )
    .run({
      terme,
      forme: c.forme ?? 'mot',
      definitionEn: c.definitionEn ?? null,
      traductionFr: c.traductionFr ?? null,
      exemple: c.exemple ?? null,
      domaine: c.domaine ?? null,
      origineItemId: c.origineItemId ?? null,
    })

  return { id: Number(info.lastInsertRowid), creee: true }
}

export function supprimerCarte(id: number): void {
  db().prepare(`DELETE FROM vocab_card WHERE id = ?`).run(id)
}

export function completerCarte(
  id: number,
  champs: { definitionEn?: string | null; traductionFr?: string | null; forme?: FormeVocab },
): void {
  db()
    .prepare(
      `UPDATE vocab_card SET
         definition_en = COALESCE(@definitionEn, definition_en),
         traduction_fr = COALESCE(@traductionFr, traduction_fr),
         forme         = COALESCE(@forme, forme)
       WHERE id = @id`,
    )
    .run({
      id,
      definitionEn: champs.definitionEn ?? null,
      traductionFr: champs.traductionFr ?? null,
      forme: champs.forme ?? null,
    })
}

/* ------------------------------------------------------------ révision -- */

export function enregistrerRevision(cardId: number, su: boolean, tempsMs: number): void {
  const d = db()
  d.prepare(`INSERT INTO vocab_revision (card_id, su, temps_ms) VALUES (?, ?, ?)`).run(
    cardId,
    su ? 1 : 0,
    Math.max(0, Math.round(tempsMs)),
  )
  reconstruireCarte(cardId)
}

/** Rejoue le journal d'une carte pour recalculer son calendrier. */
export function reconstruireCarte(cardId: number, aujourdhui = new Date().toISOString().slice(0, 10)): void {
  const d = db()

  const journal = d
    .prepare(
      // Par date, pas par id : après une synchronisation, une révision faite
      // plus tôt sur l'autre appareil peut avoir reçu un id plus grand ici.
      `SELECT su, date(created_at) AS jour FROM vocab_revision
        WHERE card_id = ? ORDER BY created_at, id`,
    )
    .all(cardId) as Array<{ su: number; jour: string }>

  let etat: EtatRevision = ETAT_INITIAL
  for (const r of journal) {
    etat = reviser(etat, r.su ? NOTE_SU : NOTE_PAS_SU, r.jour)
  }

  d.prepare(
    `UPDATE vocab_card SET
       repetitions        = @repetitions,
       facilite           = @facilite,
       intervalle_jours   = @intervalle,
       derniere_revision  = @derniere,
       prochaine_revision = @prochaine
     WHERE id = @id`,
  ).run({
    id: cardId,
    repetitions: etat.repetitions,
    facilite: etat.facilite,
    intervalle: etat.intervalleJours,
    derniere: etat.derniereRevision,
    prochaine: etat.prochaineRevision,
  })

  void aujourdhui
}

function ligneVersCarte(l: Record<string, unknown>): Carte {
  return {
    id: l.id as number,
    terme: l.terme as string,
    forme: l.forme as FormeVocab,
    definitionEn: (l.definition_en as string) ?? null,
    traductionFr: (l.traduction_fr as string) ?? null,
    exemple: (l.exemple as string) ?? null,
    domaine: (l.domaine as string) ?? null,
    origineItemId: (l.origine_item_id as number) ?? null,
    repetitions: l.repetitions as number,
    intervalleJours: (l.intervalle_jours as number) ?? 0,
    prochaineRevision: (l.prochaine_revision as string) ?? null,
    nRevisions: (l.n_revisions as number) ?? 0,
    nSues: (l.n_sues as number) ?? 0,
  }
}

const SELECT_CARTE = `
  SELECT c.*,
         (SELECT COUNT(*) FROM vocab_revision v WHERE v.card_id = c.id)                AS n_revisions,
         (SELECT COUNT(*) FROM vocab_revision v WHERE v.card_id = c.id AND v.su = 1)   AS n_sues
    FROM vocab_card c
`

/** Cartes dues aujourd'hui, jamais révisées en premier. */
export function cartesDues(aujourdhui = new Date().toISOString().slice(0, 10), limite = 20): Carte[] {
  return (
    db()
      .prepare(
        `${SELECT_CARTE}
          WHERE c.prochaine_revision IS NULL OR date(c.prochaine_revision) <= date(?)
          ORDER BY c.prochaine_revision IS NULL DESC, c.prochaine_revision ASC
          LIMIT ?`,
      )
      .all(aujourdhui, limite) as Array<Record<string, unknown>>
  ).map(ligneVersCarte)
}

export function toutesLesCartes(limite = 200): Carte[] {
  return (
    db()
      .prepare(`${SELECT_CARTE} ORDER BY c.cree_le DESC LIMIT ?`).all(limite) as Array<
      Record<string, unknown>
    >
  ).map(ligneVersCarte)
}

export interface EtatVocabulaire {
  total: number
  dues: number
  jamaisRevisees: number
  aVenir: Array<{ terme: string; prochaineRevision: string; dansJours: number }>
  incompletes: number
}

export function etatVocabulaire(aujourdhui = new Date().toISOString().slice(0, 10)): EtatVocabulaire {
  const d = db()

  const total = (d.prepare(`SELECT COUNT(*) AS n FROM vocab_card`).get() as { n: number }).n
  const dues = cartesDues(aujourdhui, 1000).length
  const jamaisRevisees = (
    d.prepare(`SELECT COUNT(*) AS n FROM vocab_card WHERE prochaine_revision IS NULL`).get() as {
      n: number
    }
  ).n

  const incompletes = (
    d
      .prepare(
        `SELECT COUNT(*) AS n FROM vocab_card
          WHERE (definition_en IS NULL OR definition_en = '')
            AND (traduction_fr IS NULL OR traduction_fr = '')`,
      )
      .get() as { n: number }
  ).n

  const aVenir = (
    d
      .prepare(
        `SELECT terme, prochaine_revision FROM vocab_card
          WHERE prochaine_revision IS NOT NULL AND date(prochaine_revision) > date(?)
          ORDER BY prochaine_revision LIMIT 10`,
      )
      .all(aujourdhui) as Array<{ terme: string; prochaine_revision: string }>
  ).map((r) => ({
    terme: r.terme,
    prochaineRevision: r.prochaine_revision,
    dansJours: joursEntre(aujourdhui, r.prochaine_revision),
  }))

  return { total, dues, jamaisRevisees, aVenir, incompletes }
}

export { ajouterJours }
