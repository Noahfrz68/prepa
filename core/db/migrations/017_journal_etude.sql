-- Journal des sessions d'étude des leçons.

-- `lecon_etude` ne garde qu'un cumul par leçon : impossible d'y lire ce qui a
-- été étudié CETTE semaine, donc impossible de mesurer l'avancement d'une
-- tâche « Cours » du plan autrement qu'en la cochant à la main. Chaque
-- marquage laisse désormais une ligne ici, datée et chronométrée.
--
-- Les études antérieures sont reprises depuis `lecon_etude`, datées de leur
-- dernier passage : c'est la meilleure trace disponible.

CREATE TABLE IF NOT EXISTS lecon_session (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id  TEXT    NOT NULL,
  le        TEXT    NOT NULL DEFAULT (datetime('now')),
  minutes   REAL    NOT NULL DEFAULT 0 CHECK (minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lecon_session_le ON lecon_session (le);

INSERT INTO lecon_session (skill_id, le, minutes)
SELECT skill_id, COALESCE(revue_le, etudiee_le), minutes
  FROM lecon_etude
 WHERE COALESCE(revue_le, etudiee_le) IS NOT NULL;
