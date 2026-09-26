-- @sans-cles-etrangeres
--
-- Causes d'erreur adaptées au sous-test.
--
-- Les six causes de la migration 021 étaient proposées partout : « erreur de
-- calcul » sur une question d'orthographe, et rien pour dire « je ne
-- connaissais pas la règle » ou « je ne connaissais pas le sens du mot », les
-- deux causes les plus fréquentes en expression et en compréhension. On
-- ajoute ces deux-là ; l'écran ne propose, pour chaque sous-test, que celles
-- qui y ont un sens (core/stats/causes.ts).
--
-- SQLite ne sait pas modifier une contrainte CHECK : la table est recréée à
-- l'identique, contrainte élargie, puis ses lignes recopiées.

CREATE TABLE carnet_note_nouvelle (
  item_id    INTEGER PRIMARY KEY REFERENCES item (id) ON DELETE CASCADE,
  note       TEXT,
  compris_le TEXT,
  maj_le     TEXT NOT NULL DEFAULT (datetime('now')),
  cause      TEXT CHECK (cause IS NULL OR cause IN (
               'lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation', 'regle', 'vocabulaire'))
);

INSERT INTO carnet_note_nouvelle (item_id, note, compris_le, maj_le, cause)
  SELECT item_id, note, compris_le, maj_le, cause FROM carnet_note;

DROP TABLE carnet_note;
ALTER TABLE carnet_note_nouvelle RENAME TO carnet_note;
