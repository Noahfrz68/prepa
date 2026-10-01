-- Automatismes : les mini-jeux de calcul mental du TAGE MAGE.
--
-- Leurs questions ne passent ni par `item` ni par `attempt` : tirées à la
-- volée et jamais revues telles quelles, elles fausseraient les taux par
-- sous-test, la réussite « à froid » et la calibration du score. On garde la
-- partie, et pour chaque réponse le FAIT travaillé (`cle` : « carre:17 »,
-- « rang:P ») — c'est sur lui que porteront la répétition et les records.
--
-- Deux tables en ajout seul : une partie ne se modifie pas après coup. Les
-- records, les faits à revoir et la série du défi se recalculent depuis
-- elles ; la synchronisation n'aura qu'à ajouter les lignes absentes.

CREATE TABLE automatisme_partie (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Posé par le navigateur avant l'envoi : un envoi rejoué après une coupure
  -- retrouve la même partie au lieu d'en créer une seconde.
  uid      TEXT    NOT NULL UNIQUE,
  -- Un jeu (core/automatismes), ou « melange ».
  jeu      TEXT    NOT NULL,
  format   TEXT    NOT NULL CHECK (format IN ('chrono', 'serie', 'defi')),
  -- Le jour du défi (AAAA-MM-JJ), pour les seules parties de défi.
  defi_du  TEXT    CHECK ((format = 'defi') = (defi_du IS NOT NULL)),
  le       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Temps de jeu effectif : le chronomètre s'arrête pendant les corrections.
  duree_ms INTEGER NOT NULL CHECK (duree_ms >= 0),
  nb       INTEGER NOT NULL CHECK (nb >= 0),
  justes   INTEGER NOT NULL CHECK (justes >= 0 AND justes <= nb)
);

CREATE INDEX idx_automatisme_partie_jeu ON automatisme_partie (jeu, format);

CREATE TABLE automatisme_reponse (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  partie_uid TEXT    NOT NULL REFERENCES automatisme_partie (uid) ON DELETE CASCADE,
  ordre      INTEGER NOT NULL CHECK (ordre >= 0),
  -- Le jeu de la question : dans un mélange, il diffère de celui de la partie.
  jeu        TEXT    NOT NULL,
  cle        TEXT    NOT NULL,
  reponse    TEXT,
  juste      INTEGER NOT NULL CHECK (juste IN (0, 1)),
  temps_ms   INTEGER NOT NULL CHECK (temps_ms >= 0),
  -- Juste, mais au-delà du seuil de la question : le fait est à revoir.
  lent       INTEGER NOT NULL CHECK (lent IN (0, 1)),
  UNIQUE (partie_uid, ordre)
);

CREATE INDEX idx_automatisme_reponse_cle ON automatisme_reponse (cle);
