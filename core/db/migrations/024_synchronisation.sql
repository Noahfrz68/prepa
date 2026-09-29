-- Synchronisation PC ↔ iPhone, par fichier.
--
-- Chaque appareil garde sa base ; un fichier exporté par l'un est FUSIONNÉ dans
-- l'autre (core/sync/fusion.ts). Trois choses manquaient pour fusionner sans
-- rien perdre ni doubler :
--
--   1. une identité commune aux deux appareils. Les `id` sont attribués par
--      chaque base de son côté : la séance 12 du PC n'est pas la séance 12 de
--      l'iPhone. Les lignes créées au fil de l'usage reçoivent donc un `uid`
--      aléatoire, posé à l'insertion par un déclencheur — le code n'a rien à
--      changer. Les autres tables ont déjà une clé naturelle (media.hash_script,
--      skill_id, exam_id, semaine_du…) ;
--
--   2. la date de la dernière modification (`maj_le`), pour trancher quand la
--      même ligne a changé des deux côtés : la plus récente l'emporte. Posée par
--      un déclencheur à chaque UPDATE, sauf pendant une fusion (`sync_verrou`),
--      qui recopie celle de l'autre appareil. NULL tant que la ligne n'a jamais
--      été modifiée : elle perd alors contre toute modification ;
--
--   3. la trace des suppressions (`suppression`) : sans elle, une question
--      supprimée sur un appareil reviendrait à chaque synchronisation.

CREATE TABLE sync_verrou (present INTEGER);

CREATE TABLE suppression (
  nom_table   TEXT NOT NULL,
  cle         TEXT NOT NULL,
  supprime_le TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (nom_table, cle)
);

-- Propre à chaque appareil, jamais fusionné : les fichiers (figures, audios)
-- que l'autre appareil a déclarés posséder à la dernière synchronisation, pour
-- ne pas les lui renvoyer ; et le journal des synchronisations.
CREATE TABLE fichier_distant (chemin TEXT PRIMARY KEY);

CREATE TABLE synchronisation (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  le       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  sens     TEXT NOT NULL CHECK (sens IN ('export', 'import')),
  appareil TEXT,
  bilan    TEXT
);

-- ------------------------------------------------------------------ uid --

ALTER TABLE item ADD COLUMN uid TEXT;
ALTER TABLE exam_session ADD COLUMN uid TEXT;
ALTER TABLE vocab_card ADD COLUMN uid TEXT;
ALTER TABLE vocab_revision ADD COLUMN uid TEXT;
ALTER TABLE lecon_session ADD COLUMN uid TEXT;
ALTER TABLE production ADD COLUMN uid TEXT;
ALTER TABLE coach_memory ADD COLUMN uid TEXT;

UPDATE item SET uid = lower(hex(randomblob(16)));
UPDATE exam_session SET uid = lower(hex(randomblob(16)));
UPDATE vocab_card SET uid = lower(hex(randomblob(16)));
UPDATE vocab_revision SET uid = lower(hex(randomblob(16)));
UPDATE lecon_session SET uid = lower(hex(randomblob(16)));
UPDATE production SET uid = lower(hex(randomblob(16)));
UPDATE coach_memory SET uid = lower(hex(randomblob(16)));

CREATE UNIQUE INDEX idx_item_uid ON item (uid);
CREATE UNIQUE INDEX idx_exam_session_uid ON exam_session (uid);
CREATE UNIQUE INDEX idx_vocab_card_uid ON vocab_card (uid);
CREATE UNIQUE INDEX idx_vocab_revision_uid ON vocab_revision (uid);
CREATE UNIQUE INDEX idx_lecon_session_uid ON lecon_session (uid);
CREATE UNIQUE INDEX idx_production_uid ON production (uid);
CREATE UNIQUE INDEX idx_coach_memory_uid ON coach_memory (uid);

CREATE TRIGGER item_uid AFTER INSERT ON item WHEN NEW.uid IS NULL
BEGIN UPDATE item SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER exam_session_uid AFTER INSERT ON exam_session WHEN NEW.uid IS NULL
BEGIN UPDATE exam_session SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER vocab_card_uid AFTER INSERT ON vocab_card WHEN NEW.uid IS NULL
BEGIN UPDATE vocab_card SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER vocab_revision_uid AFTER INSERT ON vocab_revision WHEN NEW.uid IS NULL
BEGIN UPDATE vocab_revision SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER lecon_session_uid AFTER INSERT ON lecon_session WHEN NEW.uid IS NULL
BEGIN UPDATE lecon_session SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER production_uid AFTER INSERT ON production WHEN NEW.uid IS NULL
BEGIN UPDATE production SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;
CREATE TRIGGER coach_memory_uid AFTER INSERT ON coach_memory WHEN NEW.uid IS NULL
BEGIN UPDATE coach_memory SET uid = lower(hex(randomblob(16))) WHERE id = NEW.id; END;

-- --------------------------------------------------------------- maj_le --

ALTER TABLE item ADD COLUMN maj_le TEXT;
ALTER TABLE exam_session ADD COLUMN maj_le TEXT;
ALTER TABLE vocab_card ADD COLUMN maj_le TEXT;
ALTER TABLE production ADD COLUMN maj_le TEXT;
ALTER TABLE exam_goal ADD COLUMN maj_le TEXT;
ALTER TABLE user_profile ADD COLUMN maj_le TEXT;

-- Les objectifs et le profil existants ont été réglés à la main : ils doivent
-- l'emporter sur les valeurs par défaut d'un appareil neuf, dont le `maj_le`
-- reste NULL.
UPDATE exam_goal SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
UPDATE user_profile SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

-- `OLD.uid IS NOT NULL` : l'UPDATE qui pose l'uid juste après l'insertion
-- n'est pas une modification.
CREATE TRIGGER item_maj_le AFTER UPDATE ON item
WHEN NEW.maj_le IS OLD.maj_le AND OLD.uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE item SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id; END;
CREATE TRIGGER exam_session_maj_le AFTER UPDATE ON exam_session
WHEN NEW.maj_le IS OLD.maj_le AND OLD.uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE exam_session SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id; END;
CREATE TRIGGER vocab_card_maj_le AFTER UPDATE ON vocab_card
WHEN NEW.maj_le IS OLD.maj_le AND OLD.uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE vocab_card SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id; END;
CREATE TRIGGER production_maj_le AFTER UPDATE ON production
WHEN NEW.maj_le IS OLD.maj_le AND OLD.uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE production SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id; END;
CREATE TRIGGER exam_goal_maj_le AFTER UPDATE ON exam_goal
WHEN NEW.maj_le IS OLD.maj_le AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE exam_goal SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE exam_id = NEW.exam_id; END;
CREATE TRIGGER user_profile_maj_le AFTER UPDATE ON user_profile
WHEN NEW.maj_le IS OLD.maj_le AND NOT EXISTS (SELECT 1 FROM sync_verrou)
BEGIN UPDATE user_profile SET maj_le = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id; END;

-- ---------------------------------------------------------- suppressions --

CREATE TRIGGER item_suppression AFTER DELETE ON item WHEN OLD.uid IS NOT NULL
BEGIN INSERT OR IGNORE INTO suppression (nom_table, cle) VALUES ('item', OLD.uid); END;
CREATE TRIGGER exam_session_suppression AFTER DELETE ON exam_session WHEN OLD.uid IS NOT NULL
BEGIN INSERT OR IGNORE INTO suppression (nom_table, cle) VALUES ('exam_session', OLD.uid); END;
CREATE TRIGGER vocab_card_suppression AFTER DELETE ON vocab_card WHEN OLD.uid IS NOT NULL
BEGIN INSERT OR IGNORE INTO suppression (nom_table, cle) VALUES ('vocab_card', OLD.uid); END;
CREATE TRIGGER lecon_session_suppression AFTER DELETE ON lecon_session WHEN OLD.uid IS NOT NULL
BEGIN INSERT OR IGNORE INTO suppression (nom_table, cle) VALUES ('lecon_session', OLD.uid); END;
CREATE TRIGGER lecon_etude_suppression AFTER DELETE ON lecon_etude
BEGIN INSERT OR IGNORE INTO suppression (nom_table, cle) VALUES ('lecon_etude', OLD.skill_id); END;
-- La note du carnet se désigne par sa question : si la question disparaît en
-- même temps, sa propre trace suffit.
CREATE TRIGGER carnet_note_suppression AFTER DELETE ON carnet_note
BEGIN
  INSERT OR IGNORE INTO suppression (nom_table, cle)
  SELECT 'carnet_note', uid FROM item WHERE id = OLD.item_id AND uid IS NOT NULL;
END;
