-- Lot 12 — le carnet d'erreurs.

-- Jusqu'ici, une question ratée était comptée et oubliée. Les tentatives
-- gardaient tout — la réponse donnée, le temps, la confiance — mais aucune vue
-- ne les ressortait, et le tirage du drill servait en priorité les questions
-- JAMAIS vues (`ORDER BY vu ASC`). Une erreur passait donc au fond de la pile
-- au lieu de remonter au sommet : l'inverse de ce qu'il faudrait.
--
-- Cette table n'enregistre PAS les erreurs : elles sont déjà dans `attempt`, et
-- les dupliquer créerait deux vérités à tenir d'accord. Elle ne porte que ce que
-- l'utilisateur AJOUTE par-dessus — sa note, et le moment où il déclare avoir
-- compris. Le carnet lui-même se déduit d'une jointure : est dedans toute
-- question qui compte au moins un échec ou un saut.
--
-- `compris_le` est la sortie du carnet, et elle est explicite : ce n'est pas
-- parce qu'on a réussi une fois qu'on a compris, et ce n'est pas au programme
-- de décider à la place de l'élève. Une question réussie depuis reste visible,
-- signalée comme telle, jusqu'à ce qu'il la coche.

CREATE TABLE carnet_note (
  item_id    INTEGER PRIMARY KEY REFERENCES item (id) ON DELETE CASCADE,
  note       TEXT,
  compris_le TEXT,
  maj_le     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Le carnet se lit par « mes derniers ratés » : l'index sert ce tri.
CREATE INDEX idx_attempt_rate
  ON attempt (item_id, created_at)
  WHERE est_correct = 0;
