-- Correction de l'index d'unicité posé par 008.

-- Il ne portait que sur l'énoncé. Or l'énoncé seul ne distingue pas deux
-- questions fabriquées : toutes les conditions minimales d'un même moule
-- partagent le leur (« Quelle est l'aire d'un rectangle ? »), et un intrus a
-- toujours le même. L'index rejetait donc en silence presque tout un lot —
-- 14 questions insérées sur 185 en conditions minimales.
--
-- Ce qui fait qu'une question est la même, c'est son contenu entier : l'énoncé,
-- les deux informations, et les propositions.

DROP INDEX IF EXISTS idx_item_enonce_unique;

CREATE UNIQUE INDEX idx_item_genere_unique
  ON item (
    exam_id,
    section,
    enonce,
    IFNULL(info_1, ''),
    IFNULL(info_2, ''),
    IFNULL(options, ''),
    bonne_reponse
  )
  WHERE source = 'genere';
