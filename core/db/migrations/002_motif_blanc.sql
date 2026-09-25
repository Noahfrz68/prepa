-- Lot 3 — distinguer les deux façons de ne pas répondre.
--
-- Pour le score elles valent 0 toutes les deux, mais elles ne disent pas la
-- même chose : sauter est une décision stratégique, ne pas traiter est un
-- manque de temps. Le bilan de blanc doit pouvoir les séparer, sinon on
-- confond un bon arbitrage avec un problème de rythme.
--
-- NULL = la question a été traitée (répondue).

ALTER TABLE attempt ADD COLUMN motif_blanc TEXT
  CHECK (motif_blanc IS NULL OR motif_blanc IN ('saute', 'non_traite'));

-- Les tentatives déjà enregistrées viennent du drill, où tout saut est délibéré.
UPDATE attempt SET motif_blanc = 'saute' WHERE a_saute = 1;
