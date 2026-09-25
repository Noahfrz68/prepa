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
): GroupeTexte[] {
  const d = db()
  const nbTextes = Math.ceil(nbQuestions / QUESTIONS_PAR_TEXTE)

  const textes = d
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
        LIMIT ?`,
    )
    .all(examId, QUESTIONS_PAR_TEXTE, nbTextes) as Array<{ texte: string; questions: number }>

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

/** Les identifiants à plat, dans l'ordre des groupes — texte par texte. */
export function itemsComprehensionGroupes(nbQuestions: number, examId = 'tagemage'): number[] {
  return groupesComprehension(nbQuestions, examId).flatMap((g) => g.itemIds)
}
