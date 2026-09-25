-- Lot 6 — couche IA dégradable et mémoire du tuteur.
--
-- Principe P5 : l'IA est un supplément, jamais une dépendance. Ces deux tables
-- n'existent que pour enrichir ce que l'application sait déjà calculer seule.

-- Profil apprenant en langage naturel. Versionné, jamais écrasé : on doit
-- pouvoir relire ce que le tuteur croyait il y a un mois.
--
-- Aucune statistique ici. Elles vivent dans `attempt` et seraient périmées.
CREATE TABLE coach_memory (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id          TEXT,                  -- NULL = transversal
  version          INTEGER NOT NULL,
  contenu_markdown TEXT    NOT NULL,
  genere_le        TEXT    NOT NULL DEFAULT (datetime('now')),
  declencheur      TEXT    NOT NULL,      -- 'debrief_serie' | 'bilan_blanc' | 'manuel'
  modele_utilise   TEXT,                  -- NULL quand l'utilisateur l'écrit lui-même
  fournisseur      TEXT
);
CREATE INDEX idx_coach_memory_exam ON coach_memory (exam_id, version DESC);

-- Journal des tâches IA. Ce n'est pas une file distribuée : sur une app locale
-- mono-utilisateur, la tâche est traitée dans la requête qui la crée. La table
-- sert à trois choses : ne pas refaire deux fois le même débrief, afficher un
-- état honnête quand ça a échoué, et garder une trace de ce qui a coûté quoi.
CREATE TABLE ai_job (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  type           TEXT    NOT NULL,        -- 'debrief_serie' | 'bilan_blanc' | 'memoire'
  cle            TEXT    NOT NULL,        -- identifie la cible, ex. 'session:42'
  statut         TEXT    NOT NULL DEFAULT 'en_attente'
                   CHECK (statut IN ('en_attente', 'en_cours', 'fait', 'echoue', 'abandonne')),
  fournisseur    TEXT,
  modele         TEXT,
  tentatives     INTEGER NOT NULL DEFAULT 0,
  texte          TEXT,                    -- le débrief adressé à l'étudiant
  donnees        TEXT,                    -- le JSON structuré, s'il est exploitable
  erreur         TEXT,
  jetons_entree  INTEGER,
  jetons_sortie  INTEGER,
  cree_le        TEXT    NOT NULL DEFAULT (datetime('now')),
  traite_le      TEXT
);
CREATE UNIQUE INDEX idx_ai_job_cle ON ai_job (type, cle);
