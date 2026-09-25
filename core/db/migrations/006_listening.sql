-- Lot 8 — TOEIC Listening et chaîne audio locale.

-- Un média = un enregistrement, son script, et l'accent qu'il porte.
--
-- Le transcript est TOUJOURS présent, le fichier est une optimisation : sans
-- moteur de synthèse installé, le navigateur peut lire le script lui-même.
-- Mais lire un transcript à l'écran plutôt que l'écouter n'entraîne pas la
-- compétence testée — c'est pourquoi un item sans audio jouable est exclu des
-- séries plutôt que présenté en silence.
CREATE TABLE media (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  type           TEXT    NOT NULL DEFAULT 'audio' CHECK (type IN ('audio', 'image')),
  chemin_fichier TEXT,                  -- relatif à data/, NULL si pas encore synthétisé
  transcript     TEXT    NOT NULL,
  -- Segments JSON [{locuteur, texte}] pour les conversations à plusieurs voix.
  segments       TEXT,
  accent         TEXT    CHECK (accent IS NULL OR accent IN ('US', 'UK', 'AU', 'CA')),
  voix           TEXT,
  duree_ms       INTEGER,
  moteur_tts     TEXT,
  -- Clé de cache : un script inchangé n'est jamais resynthétisé.
  hash_script    TEXT    NOT NULL,
  cree_le        TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_media_hash ON media (hash_script);
CREATE INDEX idx_media_accent ON media (accent);

-- Un même audio sert plusieurs questions en Part 3 et 4 (une conversation,
-- trois questions).
ALTER TABLE item ADD COLUMN media_id INTEGER REFERENCES media (id) ON DELETE SET NULL;
CREATE INDEX idx_item_media ON item (media_id);

-- Temps passé à lire les questions avant le lancement de l'audio.
--
-- Ce n'est pas un détail de mesure : la compétence réellement testée en Part 3
-- et 4 n'est pas « comprendre l'anglais » mais « lire les questions pendant le
-- silence qui précède l'audio ». Sans cette colonne, on ne peut pas savoir si
-- l'utilisateur acquiert ce geste.
ALTER TABLE attempt ADD COLUMN temps_preparation_ms INTEGER;
