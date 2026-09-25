-- Lot 11 — Questions engendrées par le programme.

-- Une question fabriquée par le programme n'est ni importée, ni saisie, ni
-- écrite par une IA : le générateur pose les paramètres et CALCULE la réponse.
-- C'est une provenance à part, et elle doit le rester — une question engendrée
-- n'est pas une vraie question d'annale, et la calibration doit pouvoir faire
-- la différence.
--
-- SQLite ne sait pas modifier une contrainte CHECK : on reconstruit la table.
-- L'ordre des colonnes et les valeurs sont conservés à l'identique.
--
-- `attempt` référence `item` : le DELETE implicite du DROP violerait la clé
-- étrangère de toutes les tentatives déjà enregistrées. `defer_foreign_keys`
-- ne couvre pas ce cas — SQLite impose de couper `foreign_keys`, ce qui est
-- sans effet dans une transaction. Le marqueur ci-dessous demande au migrateur
-- de les désactiver autour, puis de repasser `foreign_key_check` : les
-- identifiants étant réinsérés à l'identique, rien ne doit être orphelin.

-- @sans-cles-etrangeres

CREATE TABLE item_nouveau (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id               TEXT    NOT NULL,
  section               TEXT    NOT NULL,
  part                  TEXT,
  skill_id              TEXT    REFERENCES skill (id),
  type_item             TEXT    NOT NULL DEFAULT 'qcm'
                          CHECK (type_item IN ('qcm', 'conditions_minimales')),
  enonce                TEXT    NOT NULL,
  contexte_texte        TEXT,
  info_1                TEXT,
  info_2                TEXT,
  options               TEXT,
  bonne_reponse         TEXT    NOT NULL,
  difficulte_estimee    INTEGER CHECK (difficulte_estimee BETWEEN 1 AND 5),
  explication_reference TEXT,
  source                TEXT    NOT NULL DEFAULT 'saisi'
                          CHECK (source IN ('importe', 'saisi', 'genere', 'genere_ia')),
  statut                TEXT    NOT NULL DEFAULT 'valide'
                          CHECK (statut IN ('valide', 'a_relire', 'suspect')),
  tags                  TEXT,
  cree_le               TEXT    NOT NULL DEFAULT (datetime('now')),
  media_id              INTEGER REFERENCES media (id) ON DELETE SET NULL
);

INSERT INTO item_nouveau
  (id, exam_id, section, part, skill_id, type_item, enonce, contexte_texte,
   info_1, info_2, options, bonne_reponse, difficulte_estimee,
   explication_reference, source, statut, tags, cree_le, media_id)
SELECT
   id, exam_id, section, part, skill_id, type_item, enonce, contexte_texte,
   info_1, info_2, options, bonne_reponse, difficulte_estimee,
   explication_reference, source, statut, tags, cree_le, media_id
  FROM item;

DROP TABLE item;
ALTER TABLE item_nouveau RENAME TO item;

CREATE INDEX idx_item_exam_section ON item (exam_id, section, statut);
CREATE INDEX idx_item_skill        ON item (skill_id);
CREATE INDEX idx_item_media        ON item (media_id);

-- Deux questions engendrées ne doivent jamais avoir le même énoncé : c'est la
-- seule chose qui empêche un générateur de servir cent fois la même question.
CREATE UNIQUE INDEX idx_item_enonce_unique
  ON item (exam_id, section, enonce)
  WHERE source = 'genere';
