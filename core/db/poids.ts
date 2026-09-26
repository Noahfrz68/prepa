import type Database from 'better-sqlite3'
import { db } from './queries'

/**
 * Poids de chaque type de question dans un sous-test, mesuré sur les annales.
 *
 * `skill.poids_examen` vaut 1 partout : les six sous-tests pèsent autant dans
 * le score, mais rien n'en disait autant des types À L'INTÉRIEUR d'un
 * sous-test. La répartition « au prorata du poids à l'examen » annoncée par
 * le diagnostic et le plan était donc, en fait, uniforme.
 *
 * Le poids vient maintenant des annales réelles importées : 1 + le nombre de
 * questions du type dans les annales. Le « + 1 » (lissage de Laplace) garde
 * une chance aux types absents d'une annale — une seule annale de quinze
 * questions par sous-test n'en couvre pas tous les types. Chaque annale
 * importée affine la répartition, sans rien à régler à la main.
 */
export function poidsDesTypes(examId = 'tagemage', d: Database.Database = db()): Map<string, number> {
  const lignes = d
    .prepare(
      `SELECT s.id,
              1 + (SELECT COUNT(*) FROM item i WHERE i.skill_id = s.id AND i.tags = 'annale') AS poids
         FROM skill s
        WHERE s.exam_id = ?`,
    )
    .all(examId) as Array<{ id: string; poids: number }>
  return new Map(lignes.map((l) => [l.id, l.poids]))
}
