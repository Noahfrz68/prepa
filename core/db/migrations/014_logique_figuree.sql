-- Lot 14 — La logique reprend sa mise en page, et sa taxonomie s'affine.
--
-- Deux changements, liés.
--
-- 1. Une question de logique n'est presque jamais une phrase : c'est une
--    disposition. `figure` porte la disposition de l'énoncé, `options_figure`
--    les cinq propositions dessinées. Les deux sont du JSON décrivant une
--    STRUCTURE, pas un rendu : la même donnée se dessine à l'écran, à
--    l'impression et dans le fichier hors ligne, sans image bitmap.
--
-- 2. Six sous-compétences pour tout le sous-test ne disaient rien d'utile :
--    « intrus » mélangeait des nombres et des figures, qui ne se travaillent
--    pas du tout pareil, et « dominos et cartes » deux systèmes différents.
--    On passe à seize, une par archétype réel. Les questions déjà en banque
--    sont réattribuées d'après leur énoncé, donc les tentatives déjà
--    enregistrées restent comptées au bon endroit.

ALTER TABLE item ADD COLUMN figure         TEXT;
ALTER TABLE item ADD COLUMN options_figure TEXT;

-- Les seize sous-compétences. Insérées ici plutôt que laissées au seed :
-- les réattributions qui suivent ont besoin qu'elles existent déjà.
INSERT OR IGNORE INTO skill (id, exam_id, section, libelle, poids_examen, ordre) VALUES
  ('tm.logique.suites_numeriques',      'tagemage', 'logique', 'suites numériques',      1,  0),
  ('tm.logique.suites_de_lettres',      'tagemage', 'logique', 'suites de lettres',      1,  1),
  ('tm.logique.croix_de_nombres',       'tagemage', 'logique', 'croix de nombres',       1,  2),
  ('tm.logique.croix_de_lettres',       'tagemage', 'logique', 'croix de lettres',       1,  3),
  ('tm.logique.cases_barrees',          'tagemage', 'logique', 'cases barrées',          1,  4),
  ('tm.logique.operations_codees',      'tagemage', 'logique', 'opérations codées',      1,  5),
  ('tm.logique.matrices_de_figures',    'tagemage', 'logique', 'matrices de figures',    1,  6),
  ('tm.logique.suites_de_figures',      'tagemage', 'logique', 'suites de figures',      1,  7),
  ('tm.logique.rotations_et_symetries', 'tagemage', 'logique', 'rotations et symétries', 1,  8),
  ('tm.logique.intrus_numerique',       'tagemage', 'logique', 'intrus numérique',       1,  9),
  ('tm.logique.intrus_alphabetique',    'tagemage', 'logique', 'intrus alphabétique',    1, 10),
  ('tm.logique.intrus_figure',          'tagemage', 'logique', 'intrus figuré',          1, 11),
  ('tm.logique.analogies_de_lettres',   'tagemage', 'logique', 'analogies de lettres',   1, 12),
  ('tm.logique.analogies_de_figures',   'tagemage', 'logique', 'analogies de figures',   1, 13),
  ('tm.logique.dominos',                'tagemage', 'logique', 'dominos',                1, 14),
  ('tm.logique.cartes',                 'tagemage', 'logique', 'cartes',                 1, 15);

-- --------------------------------------------------------- réattribution --
-- L'énoncé suffit à trancher : chaque famille du générateur a sa phrase
-- d'ouverture, et elle n'est partagée avec aucune autre.

-- Les quatre figures d'annale dont on connaît la disposition exacte.
UPDATE item SET skill_id = 'tm.logique.croix_de_lettres'
 WHERE exam_id = 'tagemage' AND enonce = 'Figure — Logique, question 1';
UPDATE item SET skill_id = 'tm.logique.croix_de_nombres'
 WHERE exam_id = 'tagemage' AND enonce = 'Figure — Logique, question 5';
UPDATE item SET skill_id = 'tm.logique.cases_barrees'
 WHERE exam_id = 'tagemage' AND enonce = 'Figure — Logique, question 10';

-- Les croix engendrées, avant les suites : leur énoncé commence pareil dans
-- les deux familles numériques, c'est la phrase d'ouverture qui les sépare.
UPDATE item SET skill_id = 'tm.logique.croix_de_lettres'
 WHERE section = 'logique' AND skill_id = 'tm.logique.suites_alphanumeriques'
   AND enonce LIKE 'Deux séries se croisent%';
UPDATE item SET skill_id = 'tm.logique.croix_de_nombres'
 WHERE section = 'logique' AND skill_id = 'tm.logique.suites_numeriques'
   AND enonce LIKE 'Deux séries se croisent%';

UPDATE item SET skill_id = 'tm.logique.suites_de_lettres'
 WHERE section = 'logique' AND skill_id = 'tm.logique.suites_alphanumeriques';

UPDATE item SET skill_id = 'tm.logique.intrus_numerique'
 WHERE section = 'logique' AND skill_id = 'tm.logique.intrus'
   AND enonce LIKE 'Parmi ces nombres%';
UPDATE item SET skill_id = 'tm.logique.intrus_alphabetique'
 WHERE section = 'logique' AND skill_id = 'tm.logique.intrus';

UPDATE item SET skill_id = 'tm.logique.analogies_de_lettres'
 WHERE section = 'logique' AND skill_id = 'tm.logique.analogies';

UPDATE item SET skill_id = 'tm.logique.dominos'
 WHERE section = 'logique' AND skill_id = 'tm.logique.dominos_et_cartes';

-- Une question tirée d'une annale se signale : sa correction est celle du
-- corrigé officiel, elle n'a pas de diagnostic par proposition, et son énoncé
-- est une image. C'est une information utile en correction, et elle ne se
-- devine pas depuis `source = 'importe'`, que partagent toutes les sections.
UPDATE item SET tags = 'annale'
 WHERE section = 'logique' AND source = 'importe' AND tags IS NULL;

-- ------------------------------------------------- les anciennes s'en vont --
-- `skill_state` et `lecon_etude` sont des caches de suivi, reconstructibles ;
-- `item` vient d'être entièrement réattribué. Plus rien ne pointe vers elles.
DELETE FROM skill_state WHERE skill_id IN (
  'tm.logique.suites_alphanumeriques', 'tm.logique.intrus',
  'tm.logique.analogies', 'tm.logique.dominos_et_cartes');
DELETE FROM lecon_etude WHERE skill_id IN (
  'tm.logique.suites_alphanumeriques', 'tm.logique.intrus',
  'tm.logique.analogies', 'tm.logique.dominos_et_cartes');
DELETE FROM skill WHERE id IN (
  'tm.logique.suites_alphanumeriques', 'tm.logique.intrus',
  'tm.logique.analogies', 'tm.logique.dominos_et_cartes');
