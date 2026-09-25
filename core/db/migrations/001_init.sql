-- Lot 1 — schéma initial.
-- Règles structurantes (voir spécification §5) :
--   * `attempt` est immuable et exhaustive : aucune agrégation n'est stockée
--     sans être recalculable depuis elle. `skill_state` n'est qu'un cache.
--   * `temps_ms` et `confiance` sont NOT NULL et contraints ici, au niveau de la
--     base, et pas seulement dans le formulaire (critère d'acceptation n°4).

CREATE TABLE user_profile (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  langue_explications TEXT    NOT NULL DEFAULT 'fr',
  contraintes_libres  TEXT,
  cree_le             TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE exam_goal (
  exam_id              TEXT    PRIMARY KEY,          -- 'tagemage' | 'toeic_lr'
  date_examen          TEXT,                         -- ISO, NULL tant qu'inconnue
  date_provisoire      INTEGER NOT NULL DEFAULT 1,
  score_cible          INTEGER,
  score_estime_courant INTEGER,
  motif                TEXT,
  actif                INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE skill (
  id           TEXT    PRIMARY KEY,                  -- ex. 'tm.calcul.pourcentages'
  exam_id      TEXT    NOT NULL,
  section      TEXT    NOT NULL,
  libelle      TEXT    NOT NULL,
  poids_examen REAL    NOT NULL DEFAULT 1,
  ordre        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_skill_exam_section ON skill (exam_id, section);

CREATE TABLE item (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id               TEXT    NOT NULL,
  section               TEXT    NOT NULL,
  part                  TEXT,
  skill_id              TEXT    REFERENCES skill (id),
  type_item             TEXT    NOT NULL DEFAULT 'qcm'
                          CHECK (type_item IN ('qcm', 'conditions_minimales')),
  enonce                TEXT    NOT NULL,
  contexte_texte        TEXT,                        -- texte support partagé
  info_1                TEXT,                        -- conditions minimales
  info_2                TEXT,                        -- conditions minimales
  options               TEXT,                        -- JSON ["...", "..."], NULL en CM
  bonne_reponse         TEXT    NOT NULL,            -- 'A'..'E'
  difficulte_estimee    INTEGER CHECK (difficulte_estimee BETWEEN 1 AND 5),
  explication_reference TEXT,
  source                TEXT    NOT NULL DEFAULT 'saisi'
                          CHECK (source IN ('importe', 'saisi', 'genere_ia')),
  statut                TEXT    NOT NULL DEFAULT 'valide'
                          CHECK (statut IN ('valide', 'a_relire', 'suspect')),
  tags                  TEXT,
  cree_le               TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_item_exam_section ON item (exam_id, section, statut);
CREATE INDEX idx_item_skill        ON item (skill_id);

CREATE TABLE exam_session (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id            TEXT    NOT NULL,
  type               TEXT    NOT NULL
                       CHECK (type IN ('diagnostic', 'drill', 'blanc', 'revision', 'vocabulaire')),
  sections           TEXT,                           -- JSON
  debut              TEXT    NOT NULL DEFAULT (datetime('now')),
  fin                TEXT,
  score_brut         INTEGER,
  score_echelle      INTEGER,
  conditions_reelles INTEGER NOT NULL DEFAULT 0,
  interrompue        INTEGER NOT NULL DEFAULT 0
);

-- IMMUABLE : jamais d'UPDATE, jamais de DELETE hors purge explicite.
CREATE TABLE attempt (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     INTEGER NOT NULL REFERENCES exam_session (id) ON DELETE CASCADE,
  item_id        INTEGER NOT NULL REFERENCES item (id),
  reponse_donnee TEXT,                               -- NULL = non répondu
  est_correct    INTEGER NOT NULL,
  a_saute        INTEGER NOT NULL DEFAULT 0,
  temps_ms       INTEGER NOT NULL CHECK (temps_ms >= 0),
  confiance      INTEGER NOT NULL CHECK (confiance BETWEEN 1 AND 4),
  points_gagnes  INTEGER NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_attempt_session ON attempt (session_id);
CREATE INDEX idx_attempt_item    ON attempt (item_id);

-- Cache dérivé, reconstructible intégralement depuis `attempt`.
CREATE TABLE skill_state (
  skill_id           TEXT    PRIMARY KEY REFERENCES skill (id),
  maitrise           REAL,
  n_tentatives       INTEGER NOT NULL DEFAULT 0,
  n_justes           INTEGER NOT NULL DEFAULT 0,
  temps_median_ms    INTEGER,
  taux_calibration   REAL,
  stabilite          REAL,
  difficulte         REAL,
  prochaine_revision TEXT
);
