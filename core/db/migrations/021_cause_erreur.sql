-- Cause déclarée d'une erreur du carnet.
--
-- La note libre « pourquoi je me suis trompé » se relit mal en masse : deux
-- cents notes ne disent pas si l'on perd ses points à lire trop vite ou à ne
-- pas connaître la méthode. Une cause choisie parmi six permet de les
-- regrouper, et de voir laquelle domine.

ALTER TABLE carnet_note ADD COLUMN cause TEXT
  CHECK (cause IS NULL OR cause IN ('lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation'));
