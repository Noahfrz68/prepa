-- Temps passé à lire les corrections d'une séance, après sa clôture.
--
-- Le volume travaillé comptait la durée des séances jusqu'à leur dernière
-- réponse : la lecture des corrections, qui vient après, n'apparaissait nulle
-- part. C'est pourtant là que se fait une bonne part de l'apprentissage. La
-- page de correction envoie ce temps en partant (voir TempsCorrection).

ALTER TABLE exam_session ADD COLUMN correction_ms INTEGER NOT NULL DEFAULT 0;
