import { db } from './queries'
import type { ItemDrill } from './queries'
import { PARTS, type PartSpec } from '@/exams/toeic'
import { PARTS_READING, retardSurBudget } from '@/exams/toeic/epreuve'
import { intervalleWilson } from '@/core/stats/diagnostic'
import {
  BAREME_TOEIC,
  estimerSection,
  gainEspereRemplissage,
  type EstimationToeic,
} from '@/core/scoring/toeic'

const EXAM = 'toeic_lr'

/* ------------------------------------------------------------- accueil -- */

export interface EtatPart extends PartSpec {
  nbItems: number
  nbTentatives: number
  tauxReussite: number | null
  disponible: boolean
}

export function etatParts(): EtatPart[] {
  const d = db()

  const comptes = new Map(
    (
      d
        .prepare(
          `SELECT i.section                     AS part,
                  COUNT(DISTINCT i.id)          AS nbItems,
                  COUNT(a.id)                   AS nbTentatives,
                  AVG(a.est_correct)            AS taux
             FROM item i
             LEFT JOIN attempt a ON a.item_id = i.id
            WHERE i.exam_id = ? AND i.statut = 'valide'
            GROUP BY i.section`,
        )
        .all(EXAM) as Array<{ part: string; nbItems: number; nbTentatives: number; taux: number | null }>
    ).map((r) => [r.part, r]),
  )

  return PARTS.map((p) => {
    const c = comptes.get(p.id)
    return {
      ...p,
      nbItems: c?.nbItems ?? 0,
      nbTentatives: c?.nbTentatives ?? 0,
      tauxReussite: c?.taux ?? null,
      // Le Listening arrive au lot 8 : sa chaîne audio n'existe pas encore.
      disponible: p.section === 'reading',
    }
  })
}

export function estimationReading(): EstimationToeic {
  const r = db()
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(a.est_correct), 0) AS justes
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND i.section IN ('p5','p6','p7')`,
    )
    .get(EXAM) as { n: number; justes: number }

  return estimerSection('reading', r.justes, r.n, intervalleWilson)
}

/* --------------------------------------------------------------- série -- */

export interface SerieReading {
  sessionId: number
  part: string
  libelle: string
  budgetMinutes: number
  items: ItemDrill[]
  manquantes: number
}

/**
 * Démarre une série Reading. Comme partout, `bonne_reponse` ne quitte pas le
 * serveur avant que les tentatives soient enregistrées.
 */
export function demarrerSerieReading(part: string, taille: number): SerieReading {
  const d = db()
  const spec = PARTS_READING.find((p) => p.id === part)
  if (!spec) throw new Error(`Part « ${part} » inconnue ou hors Reading.`)

  const lignes = d
    .prepare(
      `SELECT i.id, i.type_item, i.enonce, i.contexte_texte, i.info_1, i.info_2, i.options,
              (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) AS vu
         FROM item i
        WHERE i.exam_id = ? AND i.section = ? AND i.statut = 'valide'
        ORDER BY vu ASC, RANDOM()
        LIMIT ?`,
    )
    .all(EXAM, part, taille) as Array<Record<string, unknown>>

  if (lignes.length === 0) {
    throw new Error(`Aucune question en banque pour la ${spec.libelle} (Part ${spec.numero}).`)
  }

  const info = d
    .prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES (?, 'drill', ?)`)
    .run(EXAM, JSON.stringify([part]))

  return {
    sessionId: Number(info.lastInsertRowid),
    part,
    libelle: spec.libelle,
    budgetMinutes: Math.round((taille / spec.questions) * (spec.id === 'p5' ? 20 : spec.id === 'p6' ? 10 : 45)),
    items: lignes.map((l) => ({
      id: l.id as number,
      typeItem: l.type_item as 'qcm' | 'conditions_minimales',
      enonce: l.enonce as string,
      contexteTexte: (l.contexte_texte as string) ?? null,
      info1: (l.info_1 as string) ?? null,
      info2: (l.info_2 as string) ?? null,
      options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
      // Le Reading TOEIC n'a pas d'énoncé graphique ; les visuels de la Part 1
      // passent par le média de l'item, pas par l'énoncé.
      imageHash: null,
      // Le TOEIC n'a pas de question graphique : aucune disposition à dessiner.
      figure: null,
      optionsFigure: null,
    })),
    manquantes: Math.max(0, taille - lignes.length),
  }
}

export interface TentativeReading {
  itemId: number
  reponse: string | null
  /** Vrai uniquement si le temps a manqué : au TOEIC on ne saute jamais volontairement. */
  nonTraitee: boolean
  tempsMs: number
  confiance: number
}

/**
 * Enregistre un lot Reading.
 *
 * Barème TOEIC : juste = 1, faux = 0, non traitée = 0. Une mauvaise réponse
 * ne coûte rien, donc `a_saute` ne signifie ici que « le temps a manqué »,
 * jamais un arbitrage. C'est pour ça que le motif est toujours `non_traite`.
 */
export function enregistrerLotReading(sessionId: number, tentatives: TentativeReading[]): number {
  const d = db()

  const lireItem = d.prepare(`SELECT bonne_reponse FROM item WHERE id = ?`)
  const inserer = d.prepare(
    `INSERT INTO attempt
       (session_id, item_id, reponse_donnee, est_correct, a_saute, motif_blanc,
        temps_ms, confiance, points_gagnes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const tout = d.transaction((liste: TentativeReading[]) => {
    for (const t of liste) {
      const item = lireItem.get(t.itemId) as { bonne_reponse: string } | undefined
      if (!item) throw new Error(`Item ${t.itemId} introuvable.`)

      const repondue = !t.nonTraitee && t.reponse !== null
      const juste = repondue && t.reponse === item.bonne_reponse

      inserer.run(
        sessionId,
        t.itemId,
        repondue ? t.reponse : null,
        juste ? 1 : 0,
        repondue ? 0 : 1,
        repondue ? null : 'non_traite',
        Math.max(0, Math.round(t.tempsMs)),
        Math.min(4, Math.max(1, Math.round(t.confiance))),
        juste ? BAREME_TOEIC.juste : BAREME_TOEIC.faux,
      )
    }
  })

  tout(tentatives)

  d.prepare(`UPDATE exam_session SET fin = datetime('now') WHERE id = ?`).run(sessionId)
  return tentatives.length
}

/* --------------------------------------------------------------- recap -- */

export interface CorrectionReading {
  itemId: number
  enonce: string
  contexteTexte: string | null
  options: string[]
  bonneReponse: string
  reponseDonnee: string | null
  nonTraitee: boolean
  estCorrect: boolean
  tempsMs: number
  confiance: number
  explication: string | null
  /** Terme cible proposé pour une carte de vocabulaire, sur une erreur. */
  termeCandidat: string | null
  dejaEnVocabulaire: boolean
}

export interface RecapReading {
  sessionId: number
  part: string
  libelle: string
  numero: number
  totaux: { n: number; justes: number; fausses: number; nonTraitees: number }
  tauxReussite: number
  tempsTotalMs: number
  budgetMinutes: number
  retardMinutes: number
  gainRemplissage: number
  estimation: EstimationToeic
  corrections: CorrectionReading[]
}

export function recapReading(sessionId: number): RecapReading {
  const d = db()

  const session = d
    .prepare(`SELECT sections FROM exam_session WHERE id = ?`)
    .get(sessionId) as { sections: string } | undefined
  if (!session) throw new Error(`Série ${sessionId} introuvable.`)

  const part = (JSON.parse(session.sections) as string[])[0]
  const spec = PARTS_READING.find((p) => p.id === part)!

  const lignes = d
    .prepare(
      `SELECT a.item_id, a.reponse_donnee, a.est_correct, a.a_saute, a.motif_blanc,
              a.temps_ms, a.confiance,
              i.enonce, i.contexte_texte, i.options, i.bonne_reponse, i.explication_reference
         FROM attempt a
         JOIN item i ON i.id = a.item_id
        WHERE a.session_id = ?
        ORDER BY a.id`,
    )
    .all(sessionId) as Array<Record<string, unknown>>

  const termesConnus = new Set(
    (db().prepare(`SELECT lower(terme) AS t FROM vocab_card`).all() as Array<{ t: string }>).map(
      (r) => r.t,
    ),
  )

  const corrections: CorrectionReading[] = lignes.map((l) => {
    const options = l.options ? (JSON.parse(l.options as string) as string[]) : []
    const iBonne = ['A', 'B', 'C', 'D', 'E'].indexOf(l.bonne_reponse as string)
    const estCorrect = Boolean(l.est_correct)

    // En Part 5 et 6, la bonne réponse EST le mot cible : sur une erreur, elle
    // fait une carte de vocabulaire sans qu'aucun modèle soit nécessaire.
    const termeCandidat =
      !estCorrect && (part === 'p5' || part === 'p6') && options[iBonne]
        ? options[iBonne].trim()
        : null

    return {
      itemId: l.item_id as number,
      enonce: l.enonce as string,
      contexteTexte: (l.contexte_texte as string) ?? null,
      options,
      bonneReponse: l.bonne_reponse as string,
      reponseDonnee: (l.reponse_donnee as string) ?? null,
      nonTraitee: l.motif_blanc === 'non_traite',
      estCorrect,
      tempsMs: l.temps_ms as number,
      confiance: l.confiance as number,
      explication: (l.explication_reference as string) ?? null,
      termeCandidat,
      dejaEnVocabulaire: termeCandidat ? termesConnus.has(termeCandidat.toLowerCase()) : false,
    }
  })

  const totaux = {
    n: corrections.length,
    justes: corrections.filter((c) => c.estCorrect).length,
    fausses: corrections.filter((c) => !c.estCorrect && !c.nonTraitee).length,
    nonTraitees: corrections.filter((c) => c.nonTraitee).length,
  }

  const tempsTotalMs = corrections.reduce((acc, c) => acc + c.tempsMs, 0)
  const budgetMinutes = Math.round((totaux.n / spec.questions) * (spec.id === 'p5' ? 20 : spec.id === 'p6' ? 10 : 45))

  return {
    sessionId,
    part,
    libelle: spec.libelle,
    numero: spec.numero,
    totaux,
    tauxReussite: totaux.n === 0 ? 0 : totaux.justes / totaux.n,
    tempsTotalMs,
    budgetMinutes,
    retardMinutes: Math.round(tempsTotalMs / 60_000 - budgetMinutes),
    gainRemplissage: gainEspereRemplissage(totaux.nonTraitees),
    estimation: estimerSection('reading', totaux.justes, totaux.n, intervalleWilson),
    corrections,
  }
}

export { retardSurBudget }
