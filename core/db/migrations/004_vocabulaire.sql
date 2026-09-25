-- Lot 5 — module vocabulaire TOEIC.
--
-- Les cartes ne sont pas une liste à avaler : elles naissent des erreurs
-- réellement commises. Le vocabulaire est le levier n°1 en Reading, mais une
-- liste générique fait réviser ce qu'on sait déjà.

CREATE TABLE vocab_card (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  terme              TEXT    NOT NULL,
  forme              TEXT    NOT NULL DEFAULT 'mot'
                       CHECK (forme IN ('mot', 'expression', 'collocation', 'phrasal_verb')),
  definition_en      TEXT,
  traduction_fr      TEXT,
  exemple            TEXT,                 -- la phrase de l'item d'origine
  domaine            TEXT,
  origine_item_id    INTEGER REFERENCES item (id) ON DELETE SET NULL,
  repetitions        INTEGER NOT NULL DEFAULT 0,
  facilite           REAL    NOT NULL DEFAULT 2.5,
  intervalle_jours   INTEGER NOT NULL DEFAULT 0,
  derniere_revision  TEXT,
  prochaine_revision TEXT,
  cree_le            TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Un terme ne doit pas exister en double : rater deux fois le même mot doit
-- renforcer la carte existante, pas en créer une seconde.
CREATE UNIQUE INDEX idx_vocab_terme ON vocab_card (lower(terme));

-- Journal des révisions. Même discipline que `attempt` : l'état de la carte est
-- dérivable de ce journal, jamais l'inverse.
CREATE TABLE vocab_revision (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id    INTEGER NOT NULL REFERENCES vocab_card (id) ON DELETE CASCADE,
  su         INTEGER NOT NULL CHECK (su IN (0, 1)),
  temps_ms   INTEGER NOT NULL CHECK (temps_ms >= 0),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_vocab_revision_card ON vocab_revision (card_id);
