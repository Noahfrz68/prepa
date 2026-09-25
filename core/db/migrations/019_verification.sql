-- Date à laquelle une question signalée comme douteuse a été relue et jugée
-- juste. Elle ne remonte plus dans « Questions à vérifier », sauf si de
-- nouvelles réponses arrivent après cette date et redonnent un signal.

ALTER TABLE item ADD COLUMN verifie_le TEXT;
