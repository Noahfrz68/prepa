-- Lot 11 — une correction qui s'adapte à ce qui s'est passé.

-- Jusqu'ici une question portait un seul texte de correction, servi à
-- l'identique qu'on ait trouvé la réponse ou non. C'est le mauvais réglage dans
-- les deux sens : trop long quand on a juste — on relit trois phrases pour
-- confirmer ce qu'on savait déjà —, trop court quand on s'est trompé — on
-- apprend le bon résultat sans voir où le raisonnement a dévié.
--
-- Trois textes remplacent l'unique :
--
--   explication_reference  la démarche complète, étape par étape. Servie quand
--                          la question est fausse ou sautée.
--   rappel                 une ligne, le réflexe à retenir. Servi quand la
--                          question est juste.
--   diagnostics            JSON { "C": "c'est la plus petite racine" } — ce que
--                          signifie CHAQUE mauvaise proposition. Le générateur
--                          le sait : ses leurres sont des erreurs de méthode
--                          nommées, pas du bruit numérique. Il n'y avait aucune
--                          raison de jeter cette information à l'écriture.
--
-- Les deux colonnes sont nulles pour tout ce qui vient d'une annale : un
-- corrigé de PDF n'a qu'un texte, et l'affichage retombe alors sur lui.

ALTER TABLE item ADD COLUMN rappel TEXT;
ALTER TABLE item ADD COLUMN diagnostics TEXT;
