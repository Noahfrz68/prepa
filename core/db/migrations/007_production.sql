-- Lot 10 — TOEIC Writing (et Speaking, désactivé).
--
-- Les épreuves de production libre n'ont pas de bonne réponse : `attempt` ne
-- sait pas les représenter. D'où des tables séparées, avec la même discipline :
-- `production` est immuable et exhaustive, la note en est dérivée.

-- Consignes d'une tâche de production.
CREATE TABLE prompt_task (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id         TEXT    NOT NULL DEFAULT 'toeic_sw',
  section         TEXT    NOT NULL CHECK (section IN ('writing', 'speaking')),
  type_tache      TEXT    NOT NULL,
  numero          INTEGER NOT NULL,
  consigne        TEXT    NOT NULL,
  -- Mots imposés (tâches 1-5 du Writing), JSON.
  mots_imposes    TEXT,
  media_id        INTEGER REFERENCES media (id) ON DELETE SET NULL,
  duree_prep_s    INTEGER NOT NULL DEFAULT 0,
  duree_reponse_s INTEGER NOT NULL,
  rubric_id       INTEGER,
  source          TEXT    NOT NULL DEFAULT 'importe',
  statut          TEXT    NOT NULL DEFAULT 'valide' CHECK (statut IN ('valide', 'a_relire')),
  cree_le         TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_prompt_task_section ON prompt_task (section, type_tache);

-- Grilles de notation, par type de tâche.
--
-- La note est portée par des critères, jamais par une impression globale :
-- c'est ce qui permet de dire à l'étudiant OÙ il perd des points.
CREATE TABLE rubric (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type_tache  TEXT    NOT NULL UNIQUE,
  criteres    TEXT    NOT NULL,   -- JSON [{id, libelle, description, noteMax, fiable}]
  note_max    INTEGER NOT NULL
);

-- Une production. IMMUABLE.
CREATE TABLE production (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     INTEGER NOT NULL REFERENCES exam_session (id) ON DELETE CASCADE,
  prompt_task_id INTEGER NOT NULL REFERENCES prompt_task (id),
  modalite       TEXT    NOT NULL CHECK (modalite IN ('texte', 'audio')),
  contenu_texte  TEXT,
  chemin_audio   TEXT,
  transcript_auto TEXT,
  temps_ms       INTEGER NOT NULL CHECK (temps_ms >= 0),
  -- Notation par critère, JSON. NULL tant qu'aucun modèle n'a été disponible.
  notes_rubrique TEXT,
  note_globale   REAL,
  feedback_ia    TEXT,
  fournisseur    TEXT,
  modele         TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_production_session ON production (session_id);
CREATE INDEX idx_production_tache   ON production (prompt_task_id);
