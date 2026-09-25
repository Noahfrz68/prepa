-- Recalcul des scores d'épreuve : chaque sous-test pèse autant.

-- Le score d'une épreuve était extrapolé sur l'ensemble de ses questions, si
-- bien qu'un sous-test servi avec plus de questions pesait plus lourd. Le
-- diagnostic du 21 septembre comptait 10 questions de compréhension contre 7
-- ailleurs. Le code calcule désormais la moyenne des taux de réussite par
-- sous-test (voir `estimerScoreParSousTest`) ; les scores déjà enregistrés
-- sont recalculés de la même façon, pour que la courbe de progression ne
-- mélange pas deux méthodes.
--
-- Rien d'autre ne change : les tentatives restent intactes, et `score_brut`
-- (la somme des points) n'est pas concerné.

UPDATE exam_session
   SET score_echelle = (
         SELECT CAST(ROUND(600.0 * AVG(taux)) AS INTEGER)
           FROM (
             SELECT AVG(a.est_correct) AS taux
               FROM attempt a
               JOIN item i ON i.id = a.item_id
              WHERE a.session_id = exam_session.id
              GROUP BY i.section
           )
       )
 WHERE type IN ('diagnostic', 'blanc')
   AND fin IS NOT NULL
   AND EXISTS (SELECT 1 FROM attempt a WHERE a.session_id = exam_session.id);
