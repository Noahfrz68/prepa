-- Rétablit le drapeau « conditions réelles » des diagnostics marqués à tort.

-- Une épreuve est marquée incomplète quand la banque manque de questions pour
-- un sous-test. Le calcul était « questions demandées − questions servies » :
-- or la compréhension demandait 7 questions et en servait 10 (deux textes de
-- cinq), ce qui donnait −3 « manquantes » — différent de zéro, donc épreuve
-- déclarée incomplète. Le code borne désormais ce nombre à zéro.
--
-- On rétablit ici les diagnostics terminés dont les six sous-tests ont bien
-- été servis (au moins cinq questions chacun). Aucune réponse n'est touchée.

UPDATE exam_session
   SET conditions_reelles = 1
 WHERE type = 'diagnostic'
   AND fin IS NOT NULL
   AND conditions_reelles = 0
   AND (
     SELECT COUNT(*) FROM (
       SELECT i.section
         FROM attempt a JOIN item i ON i.id = a.item_id
        WHERE a.session_id = exam_session.id
        GROUP BY i.section
       HAVING COUNT(*) >= 5
     )
   ) = 6;
