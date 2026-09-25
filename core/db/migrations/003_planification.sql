-- Lot 4 — répétition espacée et plan de révision.

-- Volume de travail réellement disponible, saisi par l'utilisateur. Le plan
-- s'y adosse, puis le corrige avec le volume effectivement mesuré.
ALTER TABLE user_profile ADD COLUMN heures_dispo_semaine REAL;

-- `stabilite` et `difficulte` avaient été réservées pour FSRS. Le lot 4 retient
-- SM-2 (voir core/scheduler/sm2.ts pour la justification) : on retire les
-- colonnes mortes plutôt que de laisser croire qu'elles portent quelque chose.
ALTER TABLE skill_state DROP COLUMN stabilite;
ALTER TABLE skill_state DROP COLUMN difficulte;

ALTER TABLE skill_state ADD COLUMN repetitions       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE skill_state ADD COLUMN facilite          REAL;    -- facteur de facilité SM-2
ALTER TABLE skill_state ADD COLUMN intervalle_jours  INTEGER;
ALTER TABLE skill_state ADD COLUMN derniere_revision TEXT;

-- Plan hebdomadaire. Conservé pour pouvoir confronter le prévu au réalisé :
-- c'est cette comparaison qui recalibre le budget, pas une déclaration.
CREATE TABLE study_plan (
  semaine_du        TEXT PRIMARY KEY,     -- lundi de la semaine, ISO
  allocation        TEXT,                 -- JSON { examen: minutes }
  objectifs         TEXT,                 -- JSON des séances composées
  volume_prevu_min  INTEGER,
  volume_realise    TEXT,                 -- JSON { examen: minutes }
  ajustements_texte TEXT,
  cree_le           TEXT NOT NULL DEFAULT (datetime('now'))
);
