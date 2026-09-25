-- Lot 14 — le plan de la semaine, figé le lundi.

-- Le planificateur recomposait son plan à chaque affichage et n'écrivait rien :
-- la table `study_plan` existait depuis le lot 3 et n'a jamais reçu une ligne.
-- Un plan qui bouge à chaque série ne permet ni de cocher ce qui est fait, ni
-- de savoir si l'on est en avance ou en retard. On le fige donc au lundi.
--
-- Deux manques comblés en même temps :
--
--   1. Le cours n'entrait dans aucun calcul. Les 48 leçons existaient, le plan
--      ne prescrivait que de l'entraînement — comme si lire ne prenait pas de
--      temps. `plan_tache` porte désormais des tâches de type 'cours'.
--   2. Rien ne savait ce qui avait été étudié. Sans cette trace, le plan
--      represcrit indéfiniment les mêmes leçons. `lecon_etude` la garde.

CREATE TABLE plan_tache (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  semaine_du TEXT    NOT NULL,          -- lundi ISO, comme study_plan
  ordre      INTEGER NOT NULL,
  type       TEXT    NOT NULL
               CHECK (type IN ('cours', 'entrainement', 'blanc', 'diagnostic')),
  section    TEXT,                       -- NULL pour une épreuve complète
  skill_ids  TEXT,                       -- JSON, pour cibler le drill ou les leçons
  libelle    TEXT    NOT NULL,
  minutes    INTEGER NOT NULL,
  -- Nombre de leçons, de séries ou d'épreuves. C'est ce que l'utilisateur
  -- compte, là où `minutes` est ce que le budget consomme.
  quantite   INTEGER NOT NULL DEFAULT 1,
  raison     TEXT,
  fait_le    TEXT
);

CREATE INDEX idx_plan_tache_semaine ON plan_tache (semaine_du, ordre);

-- Ce qui a été étudié, et combien de temps.
--
-- `minutes` s'accumule : relire une leçon ajoute au compteur plutôt que de
-- l'écraser. `etudiee_le` est la première fois — c'est elle qui fait sortir la
-- leçon de la file « jamais vue ».
CREATE TABLE lecon_etude (
  skill_id    TEXT    PRIMARY KEY REFERENCES skill (id),
  etudiee_le  TEXT,
  revue_le    TEXT,
  minutes     INTEGER NOT NULL DEFAULT 0,
  maj_le      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Le budget et les notes de la semaine, à côté de ses tâches.
ALTER TABLE study_plan ADD COLUMN budget_minutes INTEGER;
ALTER TABLE study_plan ADD COLUMN notes TEXT;
