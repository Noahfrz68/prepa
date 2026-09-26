-- Ce que chaque mesure vaut vraiment.
--
-- 1. Une réponse saisie sur papier sans confiance recevait « 3 » par défaut :
--    quatre-vingt-dix réponses « assez sûr » fictives dans la calibration.
--    `confiance_declaree` = 0 marque une confiance que personne n'a donnée ;
--    la colonne `confiance` garde une valeur (contrainte NOT NULL) mais n'est
--    plus lue par la calibration.
ALTER TABLE attempt ADD COLUMN confiance_declaree INTEGER NOT NULL DEFAULT 1
  CHECK (confiance_declaree IN (0, 1));

-- 2. Le temps d'une épreuve papier est un total déclaré, réparti également
--    entre les questions : il ne dit rien du temps passé sur chacune. Les
--    statistiques de temps (médianes, puits de temps, rythme) l'ignorent.
ALTER TABLE attempt ADD COLUMN temps_mesure INTEGER NOT NULL DEFAULT 1
  CHECK (temps_mesure IN (0, 1));

-- 3. Une épreuve sur papier se distingue désormais d'une épreuve à l'écran.
ALTER TABLE exam_session ADD COLUMN papier INTEGER NOT NULL DEFAULT 0
  CHECK (papier IN (0, 1));

-- 4. Temps cumulé des coupures d'une épreuve reprise (onglet fermé, page
--    rechargée). Au-delà de quelques minutes, l'épreuve n'est plus passée en
--    conditions réelles : on a pu réfléchir chronomètre arrêté.
ALTER TABLE exam_session ADD COLUMN coupure_ms INTEGER NOT NULL DEFAULT 0
  CHECK (coupure_ms >= 0);

-- 5. L'annale importée le 2 septembre : seules ses 15 questions de logique
--    portaient l'étiquette « annale », pas les 75 autres du même sujet. Or
--    c'est cette étiquette qui distingue désormais une épreuve mesurée sur
--    des annales d'une épreuve mesurée sur des questions générées.
--    Identifiants exacts, et gardes sur la source et la date d'import : sur
--    une autre base, la requête ne touche rien.
UPDATE item SET tags = 'annale'
 WHERE tags IS NULL
   AND source = 'importe'
   AND cree_le = '2026-09-02 05:41:22'
   AND id IN (
     1130, 1131, 1132, 1133, 1134, 1135, 1136, 1137, 1138, 1139, 1140, 1141, 1142, 1143, 1144,
     1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1159,
     1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169, 1170, 1171, 1172, 1173, 1174,
     1175, 1176, 1177, 1178, 1179, 1180, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1188, 1189,
     1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199, 1200, 1201, 1202, 1203, 1204
   );
