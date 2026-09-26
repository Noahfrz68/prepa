import { db } from './queries'

/**
 * Sélection groupée par texte, pour la compréhension.
 *
 * Au TAGE MAGE officiel, le sous-test 1 tient en TROIS textes de cinq
 * questions. Le tirage par défaut — `ORDER BY vu ASC, RANDOM()` — servait
 * quinze questions rattachées à quinze textes différents : on lisait quinze
 * passages au lieu de trois, et le temps de lecture ne s'amortissait jamais.
 * L'entraînement était donc bien plus lourd que l'épreuve, et il mesurait
 * autre chose.
 *
 * On tire donc des TEXTES, puis leurs questions.
 */

/** Format officiel du sous-test 1. */
export const QUESTIONS_PAR_TEXTE = 5

export interface GroupeTexte {
  texte: string
  itemIds: number[]
}

/**
 * Tire des textes complets jusqu'à couvrir le volume demandé.
 *
 * Deux garde-fous :
 *
 *   — on n'accepte qu'un texte portant ses cinq questions. Servir un texte
 *     pour trois questions ferait relire un passage entier pour un tiers du
 *     rendement, exactement le défaut qu'on corrige ;
 *   — la priorité va aux textes les moins vus, puis au hasard, comme le
 *     tirage ordinaire. C'est la fraîcheur qui compte, pas l'ordre de la table.
 *
 * Quand la banque n'a pas assez de textes complets, on rend ce qu'on a : c'est
 * à l'appelant de dire qu'il manque des questions, pas à la sélection de mentir
 * en complétant avec des textes tronqués.
 */
export function groupesComprehension(
  nbQuestions: number,
  examId = 'tagemage',
  /** Épreuves : les textes d'annales jamais lus passent devant. */
  prioriteAnnales = false,
): GroupeTexte[] {
  const d = db()
  const nbTextes = Math.ceil(nbQuestions / QUESTIONS_PAR_TEXTE)

  const textes = d
    .prepare(
      `SELECT i.contexte_texte AS texte,
              COUNT(*) AS questions,
              SUM((SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id)) AS vues,
              MAX(i.tags IS 'annale') AS annale
         FROM item i
        WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
          AND i.contexte_texte IS NOT NULL AND i.contexte_texte <> ''
        GROUP BY i.contexte_texte
       HAVING questions >= ?
           -- Hors épreuve, un texte d'annale jamais lu reste en réserve.
           AND (? OR NOT (annale = 1 AND vues = 0))
        ORDER BY (? AND annale = 1 AND vues = 0) DESC, vues ASC, RANDOM()
        LIMIT ?`,
    )
    .all(examId, QUESTIONS_PAR_TEXTE, prioriteAnnales ? 1 : 0, prioriteAnnales ? 1 : 0, nbTextes) as Array<{ texte: string; questions: number }>

  const questionsDuTexte = d.prepare(
    `SELECT i.id
       FROM item i
      WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
        AND i.contexte_texte = ?
      ORDER BY (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) ASC, RANDOM()
      LIMIT ?`,
  )

  return textes.map((t) => ({
    texte: t.texte,
    itemIds: (questionsDuTexte.all(examId, t.texte, QUESTIONS_PAR_TEXTE) as Array<{ id: number }>).map(
      (l) => l.id,
    ),
  }))
}

/**
 * Un texte long portant au moins `nbQuestions` questions validées — le moins
 * vu d'abord. Le diagnostic s'en sert pour aligner la compréhension sur les
 * 7 questions des autres sous-tests sans faire lire deux passages. Null quand
 * la banque n'en a pas : l'appelant retombe sur un texte de cinq.
 */
export function texteLongComprehension(nbQuestions: number, examId = 'tagemage'): number[] | null {
  const d = db()
  const texte = d
    .prepare(
      `SELECT i.contexte_texte AS texte,
              COUNT(*) AS questions,
              SUM((SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id)) AS vues
         FROM item i
        WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
          AND i.contexte_texte IS NOT NULL AND i.contexte_texte <> ''
        GROUP BY i.contexte_texte
       HAVING questions >= ?
        ORDER BY vues ASC, RANDOM()
        LIMIT 1`,
    )
    .get(examId, nbQuestions) as { texte: string } | undefined
  if (!texte) return null

  // Les questions dans l'ordre d'import : elles suivent le fil du texte.
  return (
    d
      .prepare(
        `SELECT i.id
           FROM item i
          WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
            AND i.contexte_texte = ?
          ORDER BY i.id
          LIMIT ?`,
      )
      .all(examId, texte.texte, nbQuestions) as Array<{ id: number }>
  ).map((l) => l.id)
}

/** Les identifiants à plat, dans l'ordre des groupes — texte par texte. */
export function itemsComprehensionGroupes(
  nbQuestions: number,
  examId = 'tagemage',
  prioriteAnnales = false,
): number[] {
  return groupesComprehension(nbQuestions, examId, prioriteAnnales).flatMap((g) => g.itemIds)
}

/**
 * Textes ENTIERS qui portent le plus de questions des types visés.
 *
 * Le plan nomme des types de questions dus à la révision ; servir ces seuls
 * types revenait à servir une question par texte — jusqu'à quinze passages à
 * lire pour quinze questions, exactement le défaut que le tirage par textes
 * avait corrigé. On garde donc les textes entiers, et on choisit ceux où les
 * types visés sont les plus présents : on travaille ce qui est dû sans
 * renoncer au format de l'épreuve. Aucun texte ne porte les types visés : on
 * retombe sur le tirage ordinaire.
 */
export function textesPourTypes(
  skillIds: string[],
  nbQuestions: number,
  examId = 'tagemage',
): number[] {
  if (skillIds.length === 0) return itemsComprehensionGroupes(nbQuestions, examId)
  const d = db()
  const nbTextes = Math.ceil(nbQuestions / QUESTIONS_PAR_TEXTE)
  const marques = skillIds.map(() => '?').join(',')

  const textes = d
    .prepare(
      `SELECT i.contexte_texte AS texte,
              COUNT(*) AS questions,
              SUM(i.skill_id IN (${marques})) AS visees,
              SUM((SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id)) AS vues
         FROM item i
        WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
          AND i.contexte_texte IS NOT NULL AND i.contexte_texte <> ''
        GROUP BY i.contexte_texte
       HAVING questions >= ? AND visees > 0
           AND NOT (MAX(i.tags IS 'annale') = 1 AND vues = 0)
        ORDER BY visees DESC, vues ASC, RANDOM()
        LIMIT ?`,
    )
    .all(...skillIds, examId, QUESTIONS_PAR_TEXTE, nbTextes) as Array<{ texte: string }>

  if (textes.length === 0) return itemsComprehensionGroupes(nbQuestions, examId)

  // Dans chaque texte, les questions visées d'abord, puis les moins vues.
  const questionsDuTexte = d.prepare(
    `SELECT i.id
       FROM item i
      WHERE i.exam_id = ? AND i.section = 'comprehension' AND i.statut = 'valide'
        AND i.contexte_texte = ?
      ORDER BY i.skill_id IN (${marques}) DESC,
               (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) ASC, RANDOM()
      LIMIT ?`,
  )
  return textes.flatMap((t) =>
    (questionsDuTexte.all(examId, t.texte, ...skillIds, QUESTIONS_PAR_TEXTE) as Array<{ id: number }>).map(
      (l) => l.id,
    ),
  )
}

/**
 * La réserve d'épreuve : questions d'annales valides jamais vues, par
 * sous-test (textes entiers en compréhension, comptés en questions). C'est ce
 * qui permet une épreuve entièrement « sur annales », donc comparable.
 */
export function reserveAnnales(examId = 'tagemage'): Map<string, number> {
  const lignes = db()
    .prepare(
      `SELECT i.section, COUNT(*) AS n
         FROM item i
        WHERE i.exam_id = ? AND i.statut = 'valide' AND i.tags = 'annale'
          AND NOT EXISTS (SELECT 1 FROM attempt a WHERE a.item_id = i.id)
        GROUP BY i.section`,
    )
    .all(examId) as Array<{ section: string; n: number }>
  return new Map(lignes.map((l) => [l.section, l.n]))
}

/** Questions qui attendent une relecture humaine avant d'être servies. */
export function questionsEnAttente(examId = 'tagemage'): { aRelire: number; suspectes: number } {
  const l = db()
    .prepare(
      `SELECT COALESCE(SUM(statut = 'a_relire'), 0) AS aRelire, COALESCE(SUM(statut = 'suspect'), 0) AS suspectes
         FROM item WHERE exam_id = ?`,
    )
    .get(examId) as { aRelire: number; suspectes: number }
  return l
}
