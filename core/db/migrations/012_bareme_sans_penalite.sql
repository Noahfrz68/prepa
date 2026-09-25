-- Lot 13 — recalcul de l'historique après la suppression de la pénalité.

-- Le barème du TAGE MAGE ne retire plus de point pour une mauvaise réponse :
-- +4 pour une juste, 0 pour tout le reste. Le code a été corrigé, mais les
-- tentatives déjà enregistrées portent des points calculés à l'ancien barème —
-- 68 d'entre elles sont négatives.
--
-- Les laisser en l'état ferait cohabiter deux échelles dans la même courbe de
-- progression : le prochain score paraîtrait bondir alors que seul le barème
-- aurait changé. C'est exactement le genre de faux signal qu'un instrument de
-- mesure ne doit pas produire.
--
-- Rien n'est perdu à ce recalcul : `points_gagnes` se déduit entièrement de
-- `est_correct`, qui n'est pas touché. Aucune réponse, aucun temps, aucune
-- confiance n'est modifié — seule leur conversion en points l'est.

UPDATE attempt
   SET points_gagnes = CASE WHEN est_correct = 1 THEN 4 ELSE 0 END;

-- Les scores des séries closes se recalculent à partir des tentatives.
-- `score_echelle` reprend la formule d'extrapolation : brut ÷ (n × 4) × 600.
UPDATE exam_session
   SET score_brut = (
         SELECT COALESCE(SUM(a.points_gagnes), 0)
           FROM attempt a WHERE a.session_id = exam_session.id
       ),
       score_echelle = (
         SELECT CASE
                  WHEN COUNT(*) = 0 THEN 0
                  ELSE CAST(ROUND(COALESCE(SUM(a.points_gagnes), 0) * 600.0 / (COUNT(*) * 4)) AS INTEGER)
                END
           FROM attempt a WHERE a.session_id = exam_session.id
       )
 WHERE score_brut IS NOT NULL;
