-- Une question ne se répond qu'une fois par session.

-- Rien ne l'imposait. Or les envois sont repris automatiquement en cas de
-- coupure (voir `app/_composants/reseau.ts`) : une réponse enregistrée dont
-- l'accusé de réception se perd est renvoyée, et s'inscrivait deux fois. Un
-- lot d'épreuve renvoyé après une panne pouvait doubler un sous-test entier —
-- quinze réponses comptées deux fois dans la calibration et le carnet.
--
-- Aucune session de la base ne contient de doublon à la date de cette
-- migration : l'index se crée sans rien toucher. Les insertions utilisent
-- désormais ON CONFLICT DO NOTHING, si bien qu'un renvoi est absorbé sans
-- erreur au lieu d'être refusé.

CREATE UNIQUE INDEX IF NOT EXISTS idx_attempt_session_item ON attempt (session_id, item_id);
