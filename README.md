# Prépa — TAGE MAGE & TOEIC

Application locale de préparation aux examens. Mono-utilisateur, sans compte, sans service
en ligne, sans coût. Toutes les données restent sur cette machine, dans `data/app.db`.

Ce n'est pas une bibliothèque d'exercices : c'est **un instrument de mesure et un coach de
stratégie de score**.

## Démarrer

```bash
npm install
npm run app
```

Puis ouvrir <http://127.0.0.1:3000>. La base est créée et la taxonomie semée au premier
lancement — rien à configurer. Le serveur n'écoute que sur cette machine (127.0.0.1) : il
n'est pas joignable depuis le réseau local.

**Au quotidien, `npm run app`** : la version de production compile une fois (une minute
environ) puis sert chaque page instantanément, sans les recompilations à la volée du mode
développement. `npm run dev` sert à modifier le code ; ses rechargements à chaud et ses
contrôles supplémentaires ralentissent un drill chronométré. Après une mise à jour du code,
relancer `npm run app` recompile.

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'application en mode développement, sur le port 3000 |
| `npm run app` | Compile puis lance la version de production — plus rapide pour l'usage quotidien |
| `npm test` | Joue la suite de tests (barèmes, parseurs, planification, sessions, couche IA, parcours de bout en bout) |
| `npm run typecheck` | Vérifie les types sans compiler |
| `npm run lint` | Lance ESLint (règles Next.js, React et TypeScript) |
| `npm run build` | Build de production seul |
| `npm run cours:export` | Exporte le cours complet en une page HTML autonome, dans `data/exports/` |
| `npm run audit:questions` | Signale les questions inrépondables ou fausses de la banque |
| `node scripts/verifier-contraintes.mjs` | Vérifie que la base refuse les tentatives incomplètes |
| `node scripts/verifier-contraintes.mjs --purge` | **Vide la banque, les sessions et les tentatives** |
| `node scripts/donnees-demo.mjs --generer` | Remplit la base de tentatives **fictives** pour explorer l'écran de stratégie |
| `node scripts/donnees-demo.mjs --purge` | Retire uniquement les données de démonstration |

> Les données de démonstration sont marquées et purgeables séparément. Purge-les avant de te
> fier à ta propre calibration : des tentatives fictives fausseraient tous les indicateurs.

## Ce que fait le lot 1

- **Accueil à deux voies** — TAGE MAGE ou TOEIC. On n'en sort que par l'accueil : les deux
  examens ont des logiques stratégiques opposées et les mélanger coûte des points.
- **Drill TAGE MAGE chronométré**, sur les 6 sous-tests, entièrement pilotable au clavier.
- **Capture de la confiance déclarée** à chaque réponse. C'est la donnée la plus précieuse
  du produit : sans elle, impossible de distinguer une lacune d'une inattention, de repérer
  les bonnes réponses obtenues par chance, ou de calculer un seuil de saut rentable.
- **Atelier d'import** — texte collé, CSV, ou fichier ouvert depuis le disque.
- **Barème officiel** +4 / 0 / 0, isolé et testé dans `core/scoring/tagemage.ts`. La pénalité
  de −1 par mauvaise réponse a été supprimée (migration 012, qui a recalculé l'historique) :
  une case vide n'est plus jamais rentable.

Le TOEIC est semé en base (taxonomie, parts, budgets de temps) mais son module arrive au
lot 5 (Reading) puis au lot 8 (Listening).

## Ce que fait le lot 2 — l'écran de stratégie de score

`/tagemage/strategie`, alimenté **uniquement par la télémétrie**, sans aucun appel de modèle.

- **Calibration** — pour chaque niveau de confiance, ta réussite réelle, celle qu'annonce ce
  niveau, et l'écart entre les deux. Sans pénalité, répondre est toujours rentable : la seule
  question qui reste est celle du temps, et un niveau où tu ne fais pas mieux que le hasard
  est signalé comme « coche et passe ». Chaque niveau sous 30 tentatives est marqué comme non
  fiable.
- **Diagnostic surconfiance / sous-confiance** — comparé séparément sur le haut (niveaux 3-4)
  et le bas (niveaux 1-2) de l'échelle. Jamais en moyenne globale : le coût est asymétrique,
  et une moyenne laisse un bas bien calibré masquer un haut catastrophique.
- **Règle d'élimination** — combien de fois tu as répondu sans rien avoir éliminé, et ce que
  ça t'a coûté en points. La moitié symétrique de la règle est déclarée non mesurable plutôt
  que présentée comme nulle.
- **Puits de temps** — sous-compétences à la fois lentes (plus de ×1,3 la médiane de leur
  sous-test) et ratées (moins de 50 %), sur au moins 20 réponses : à expédier plutôt qu'à
  travailler. Médianes calculées en SQL par fonction de fenêtrage.
- **Où tu perds tes points** — points perdus ramenés à un sous-test de 15 questions, pour que
  le volume d'entraînement ne se lise pas comme une faiblesse.

Partout dans l'application, la réussite se lit de la même façon : bonnes réponses sur
questions servies, sauts compris — sans pénalité, un saut rapporte 0 comme une erreur.

Aucune projection, aucune prédiction : le rendement de la prochaine heure investie demande
l'historique de progression du planificateur (lot 7) et n'est délibérément pas estimé ici.

## Ce que fait le lot 3 — épreuves complètes

Deux formats, lancés depuis le hub TAGE MAGE, avec le même moteur.

- **Diagnostic** — 7 questions par sous-test à la cadence réelle (80 s par question). En
  compréhension, un texte long de 7 questions quand la banque en a un de validé, sinon un
  texte entier de 5 (40 questions en tout). Les questions sont réparties entre les types de chaque
  sous-test au prorata de leur fréquence dans les annales importées (lissée : un type absent
  d'une annale garde sa chance), sans servir deux fois le même modèle. Les questions d'annales
  jamais vues passent en premier.
  Assez court pour être passé souvent, assez représentatif pour être extrapolé.
- **Blanc complet** — 90 questions, 6 × 20 minutes enchaînées, sans pause ni retour arrière
  entre sous-tests. C'est le seul format qui mesure l'endurance.

Pendant un sous-test la navigation est libre : grille de questions, retour arrière, marquage
pour révision. Entre les sous-tests, le couperet est strict. Rien n'est écrit en base avant la
clôture du sous-test, et la navigation est **verrouillée pendant la déclaration de confiance** —
c'est ce qui garantit qu'une réponse ne peut jamais être enregistrée sans elle.

Le navigateur garde l'état du sous-test en cours : après un rechargement ou un onglet fermé,
l'épreuve se reprend avec ses réponses et son temps restant (chronomètre gelé pendant la
coupure), pendant 12 heures. Fermer l'onglet en plein passage demande confirmation.

Le bilan produit :

- **Score estimé avec intervalle de Wilson à 95 %**, préféré à l'intervalle normal parce qu'il
  reste correct sur de petits échantillons. Chaque sous-test pèse 1/6, comme à l'épreuve
  réelle, quel que soit le nombre de questions servies. Une épreuve non terminée n'a pas de
  score et n'entre dans aucune comparaison.
- **Décomposition des points perdus** en fausses réponses, sauts assumés et questions non
  traitées. Les deux dernières valent 0 toutes les deux, mais ne disent pas la même chose :
  un saut est une décision, une non-traitée est un problème de rythme.
- **Courbe de fatigue** — réussite par sous-test dans l'ordre de passage, comparée à ta
  réussite habituelle dans chacun : c'est l'écart à tes habitudes, pas le taux brut, qui
  sépare la fatigue de la difficulté propre des derniers sous-tests.
- **Écart à ta cible**, en nombre de bonnes réponses à gagner par sous-test.
- **Trois leviers**, classés par points récupérables, avec l'hypothèse affichée.
- Comparaison à l'épreuve précédente du même format.

Aucune projection dans le temps : estimer où tu seras à la date de l'examen demande une pente
de progression mesurée sur plusieurs semaines, que le planificateur fournira (lot 7). Inventer
cette pente produirait un chiffre faux mais crédible.

## Objectifs

`/objectifs` — volume de travail hebdomadaire, date d'examen et score cible pour chaque
examen, avec un mode « date provisoire » si tu n'es pas encore inscrit. Ce ne sont pas des champs décoratifs : l'écart
chiffré du bilan d'épreuve et l'arbitrage entre les deux préparations en dépendent.

## Ce que fait le lot 4 — répétition espacée et plan de révision

`/tagemage/plan`. Toujours aucun appel de modèle.

**Répétition espacée SM-2** sur les sous-compétences, et pas FSRS. FSRS est meilleur *une fois
ses paramètres calibrés sur ton historique* ; ici il n'y a pas d'historique au départ, et ses
poids par défaut sont entraînés sur des paquets Anki de cartes de vocabulaire — des rappels
binaires sur des items discrets. Notre unité de révision est autre chose : un lot de questions
noté par un taux de réussite continu. Emprunter ces poids donnerait une précision que rien ne
justifie. SM-2 est entièrement spécifiable et testable ; on passera à FSRS quand il y aura de
quoi le calibrer.

Deux adaptations assumées :

- **La note vient du taux de réussite observé**, pas d'un bouton d'auto-évaluation.
- **Le calendrier se comprime avant l'examen.** Réviser pour un examen n'est pas réviser pour
  la vie : une échéance qui tomberait après la date est ramenée dans la fenêtre restante, pour
  garder une révision utile plutôt qu'aucune.

Une révision se valide toutes les 3 questions sur une même sous-compétence, **en cumulant à
travers les séances**. Une série de 15 questions se disperse sur une douzaine de compétences :
exiger le seuil à l'intérieur de chaque séance ne déclenchait presque jamais le calendrier.

`skill_state` n'est jamais maintenu par écriture incrémentale : il est **entièrement
reconstruit en rejouant l'historique** à chaque affichage. `attempt` reste la seule source de
vérité, et le calendrier ne peut pas dériver.

**Le plan hebdomadaire** (devenu transversal au lot 7) place d'abord ce qui est périssable (les révisions dues), puis ce qui
rapporte (les faiblesses), sans jamais mélanger deux sous-tests dans une même séance. Il ajoute
le premier blanc dès que la banque le permet — il sert de référence —, puis un blanc toutes les
deux semaines dans les six semaines qui précèdent l'examen, et chaque semaine le dernier mois.
Hors blancs, un diagnostic revient au moins tous les quatorze jours : sans mesure régulière, la
pente de progression n'existe pas. Chaque séance se lance en un clic et **cible
réellement les sous-compétences nommées**, pas tout le sous-test.

Le budget est **recalibré sur le volume réellement mesuré**, jamais sur le déclaratif : si
l'écart dépasse 30 %, le plan est réduit plutôt que de laisser du retard s'accumuler. Un plan
non tenu est un plan mal calibré.

## Ce que fait le lot 5 — TOEIC Reading et vocabulaire

`/toeic`. Toujours aucun appel de modèle.

**Le TOEIC est l'inverse stratégique du TAGE MAGE**, et l'architecture l'assume : aucune
pénalité pour une mauvaise réponse, donc une case vide et une erreur valent exactement zéro.
Le module ne propose **jamais** « sauter ». À la clôture d'une série, s'il reste des cases
vides, l'écran chiffre ce qu'un remplissage au hasard aurait rapporté et propose de le faire —
c'est ce qu'il faut faire à l'examen, et c'est la seule erreur totalement gratuite du TOEIC.

**Parts 5, 6 et 7**, avec navigation libre, marquage, et le **budget de temps affiché en
permanence** : Part 5 ≤ 20 min, Part 6 ≤ 10, Part 7 ≥ 45. L'erreur classique est de
surinvestir la Part 5 et de ne pas finir la Part 7, où les questions valent autant.

**Scores estimés** sur l'échelle 5-495 par section. La conversion officielle d'ETS n'est pas
publiée et change à chaque session : la table utilisée est une approximation par points
d'ancrage, et aucun score n'est affiché sans la mention « estimation ».

**Le vocabulaire s'auto-alimente.** En Part 5 et 6, la bonne réponse *est* le mot cible : sur
une erreur, la carte se crée en un clic avec la phrase d'origine comme exemple, sans qu'aucun
modèle soit nécessaire. Aucune liste générique — elle ferait réviser ce que tu sais déjà.
Révision en répétition espacée SM-2, cette fois sans adaptation : un rappel de carte est
binaire, c'est exactement le régime pour lequel SM-2 a été conçu.

L'atelier d'import bascule entre les deux examens.

## Ce que fait le lot 6 — le tuteur, en supplément

Premier lot qui appelle un modèle. Le principe qui le gouverne : **l'IA est un supplément,
jamais une dépendance.**

`/reglages` montre l'état de la chaîne de fournisseurs. Les clés se posent dans `.env.local`
(voir `.env.local.exemple`), jamais dans l'interface.

**Chaîne par défaut** : Google AI Studio (`gemini-3.8-flash`), puis Groq
(`llama-3.3-70b-versatile`) — tous deux gratuits pour le volume d'un
utilisateur unique. Ollama est implémenté mais hors de la chaîne par défaut : sur une machine
sans GPU dédié, un 7B tourne à 40-70 s par débrief avec un JSON peu fiable. Anthropic est
présent (`claude-opus-5-5`) et ne s'active qu'avec une clé délibérément posée — un fournisseur payant ne doit
jamais démarrer tout seul quand le budget est de 0 €.

**Sans aucune clé, l'application est entière.** Les écrans de résultat affichent tous leurs
chiffres ; la zone de débrief dit simplement qu'aucun fournisseur n'est configuré. Aucune
statistique ne dépend d'un appel réussi, aucun écran n'attend, aucune erreur ne bloque. Une
suite de tests verrouille ce contrat.

**Le tuteur** reçoit un contexte compact — examen, objectif, sa propre mémoire, des
statistiques fraîches sérialisées, et les tentatives de la seule série concernée — jamais
l'historique brut. Son prompt système lui interdit d'inventer un chiffre et lui rappelle que
**les deux examens s'opposent** : sauter est parfois optimal au TAGE MAGE, jamais au TOEIC.

**La mémoire du coach** est versionnée et jamais écrasée : on doit pouvoir relire ce que le
tuteur croyait il y a un mois. Elle ne contient aucune statistique — elles vivent en base et
seraient périmées.

En cas d'échec : une seule nouvelle tentative, puis abandon propre. Le job est journalisé dans
`ai_job` pour ne pas refaire deux fois le même débrief et pour garder trace de ce qui a coûté
quoi.

## Ce que fait le lot 7 — l'arbitrage entre les deux préparations

`/plan` remplace le plan mono-examen du lot 4 : **un seul budget hebdomadaire**, recalibré sur
le volume réellement effectué, puis réparti entre les deux examens, puis décliné en séances
dans chacun. L'ordre compte — on arbitre un budget réaliste, pas un budget déclaré.

**Le problème que personne ne pose.** On ne peut pas comparer « points par heure » entre le
TAGE MAGE (échelle 600) et le TOEIC (échelle 990) : 10 points n'y valent pas la même chose. Ce
qui est comparable, c'est la **fraction de l'écart restant refermée par heure** — une grandeur
sans dimension. C'est elle qui pilote la répartition.

Deux planchers passent avant ce calcul :

- **Plancher d'entretien** (1 h) — aucun examen n'est abandonné. L'anglais se dégrade vite à
  l'arrêt, et reprendre coûte plus cher que maintenir.
- **Plancher d'urgence** (40 %) — l'examen à moins de 6 semaines est servi d'abord, quelle que
  soit la rentabilité marginale. Une échéance ne se négocie pas.

Et deux plafonds, tous deux découverts en testant :

- **Plafond de besoin** — aucun examen ne reçoit plus d'heures qu'il ne lui en reste pour
  atteindre sa cible. Sans lui, un examen à 10 points du but raflait 92 % du budget, parce que
  refermer ses derniers points donne une énorme fraction d'écart par heure — alors que cinq
  heures y suffisent.
- **Plafond de capacité** — aucun examen ne reçoit plus que ce que sa banque permet de
  travailler. Sans lui, le TOEIC recevait 2 h 30 et n'en planifiait que 30 min : deux heures
  perdues pour le TAGE MAGE, dont l'examen était dans cinq semaines. Les planchers eux-mêmes
  sont bornés par cette capacité.

**La pente de progression** est mesurée sur les épreuves des 8 dernières semaines, rapportées
aux heures réellement investies. Tant qu'il n'y a pas deux épreuves passées, une pente
conventionnelle prend le relais et l'écran dit que l'estimation est grossière.

Le bandeau d'accueil porte le plan et la prochaine séance à faire, en un clic.

## Ce que fait le lot 8 — le Listening et la chaîne audio

`/toeic/listening` et `/toeic/audio`. La synthèse tourne en local avec **Piper**, gratuitement
et hors ligne : le binaire et les modèles de voix sont dans `outils/` (non versionné, ~260 Mo),
et les chemins sont dans `.env.local`.

**Ce que ce module entraîne vraiment.** En Part 3 et 4, la compétence testée n'est pas
« comprendre l'anglais » : c'est **lire les questions pendant le silence qui précède l'audio**.
Celui qui les découvre après l'écoute a déjà perdu. Le module affiche donc les questions avant
de lancer l'audio, chronomètre cette préparation, et **mesure si elle est réellement utilisée** —
un temps systématiquement nul est un diagnostic, pas un détail.

**L'audio ne se joue qu'une fois.** Aucun contrôle exposé, aucun rejeu, comme à l'examen.

**Deux accents sur quatre, et c'est dit.** Le catalogue Piper ne contient que de l'anglais
américain et britannique — il n'existe ni voix australienne ni voix canadienne. Faire passer une
voix britannique pour de l'australien serait pire que de ne rien proposer : tu te croirais faible
sur un accent que tu n'aurais jamais entendu. Le module affiche donc ce qu'il couvre et ce qu'il
ne couvre pas, et mesure la réussite par accent réel.

**Un item sans audio est écarté, jamais servi en transcript.** Lire au lieu d'écouter n'entraîne
pas la compétence testée. La série le signale plutôt que de faire semblant.

Les conversations de Part 3 sont synthétisées **voix par voix puis concaténées**, avec un silence
entre les répliques — les marqueurs `[1]` et `[2]` de l'import désignent les locuteurs. Un script
inchangé n'est jamais resynthétisé : son hash est la clé de cache et le nom du fichier.

## Ce que fait le lot 9 — l'atelier de contenu

`/atelier`. Aucun appel de modèle.

**Import PDF d'annales.** Le fichier est ouvert depuis ton disque, jamais téléchargé. Le
parseur découpe par sous-test, extrait les questions et leurs propositions, puis **apparie le
corrigé** du même document pour récupérer bonnes réponses et justifications. Il gère les trois
mises en page qui font échouer un parseur naïf : cinq propositions sur une seule ligne
(« A) 7% B) 9% … »), les conditions minimales dont les propositions sont figées et absentes du
texte, et les questions dont l'énoncé est une figure.

Ce qu'il **n'extrait pas**, et le dit : les textes support. Rien ne distingue de façon fiable,
dans un flux texte, une consigne d'épreuve d'un passage à lire ou d'un pied de page. Deux
tentatives ont produit l'une une consigne affichée comme un passage, l'autre de la prose
absorbée dans la dernière proposition d'une question — un item corrompu, pire qu'un item
incomplet. Les questions de compréhension arrivent donc sans leur texte, à coller à la main.

Rien n'est jamais **inventé** : une question dont le corrigé ne donne pas la réponse arrive
avec une réponse vide, et la file de relecture la réclame avant toute validation.

**File de relecture**, pilotable au clavier : `1`…`5` pour choisir la bonne réponse, `entrée`
pour valider, `suppr` pour supprimer. Les bloquants passent devant — un item sans réponse est
inutilisable, il vient avant les suspects, qui viennent avant le reste. Tout ce qui entre par
import automatique est en statut `à relire` : rien n'est servi sans qu'un humain l'ait vu.

**Détection d'items aberrants.** Un item que personne ne réussit après 5 tentatives est
probablement faux ou ambigu ; un item réussi à plus de 95 % n'apprend plus rien. Les deux
faussent la mesure plus qu'ils ne l'alimentent : ils passent en `suspect` et remontent en
relecture. C'est le garde-fou contre les items mal extraits, et il travaille seul sur les
données d'usage.

Supprimer un item supprime aussi ses tentatives — c'est le seul endroit du produit où des
tentatives disparaissent, et c'est assumé : celles portant sur un item faux ne mesurent rien.

## Ce que fait le lot 10 — TOEIC Writing

`/toeic/writing`.

**Cadrage d'abord.** Le TOEIC Speaking & Writing est un examen distinct du Listening & Reading :
autre inscription, autre session, et la majorité des écoles françaises n'exigent que le L&R.
C'est pour ça qu'il arrive en dernier, et l'écran le rappelle.

**Les tâches 6 à 8** — deux réponses à courriel professionnel et un essai d'opinion — sont
purement textuelles, portent l'essentiel du barème, et fonctionnent immédiatement. Quatre
sujets originaux sont fournis, au format ETS sans reprendre aucun sujet officiel.

**Les tâches 1 à 5** demandent une photographie et deux mots imposés. Rien dans ce projet ne
produit d'images : elles sont déclarées comme telles plutôt que simulées.

**La notation est portée par des critères**, jamais par une impression globale : chaque critère
reçoit une note et une justification qui doit citer un passage de la production. C'est ce qui
permet de dire *où* les points sont perdus. Le modèle note les critères ; le total est recalculé
en TypeScript — et chaque note est bornée au barème à l'ingestion, pour que l'affiché
corresponde au compté.

**Sans fournisseur d'IA, la production est conservée et relisible**, seule la note manque.
L'entraînement ne dépend pas de la disponibilité d'un modèle.

**Le Speaking n'est pas construit**, et l'écran dit pourquoi : il demanderait une transcription
locale — un second téléchargement et un traitement lourd — mais surtout deux de ses onze tâches
portent sur la prononciation et l'intonation, qu'aucun modèle ne peut juger depuis une
transcription. Livrer une note sur ces critères serait livrer un chiffre inventé.

## Ce qui s'est ajouté ensuite — mesure, plan, entraînement

**Mesure**

- **Courbe du score** sur l'accueil et le hub, chaque épreuve avec son intervalle à 95 % et la
  cible en pointillé. Seules les épreuves terminées y figurent.
- **Nature d'une épreuve** — une épreuve mesurée au moins pour moitié sur des annales réelles
  (étiquette `annale`, posée automatiquement à l'import PDF) ne se compare qu'aux épreuves de
  même nature, et inversement : écart à la précédente, ligne de la courbe (points pleins sur
  annales, creux sinon) et pente de progression. Les questions générées sont nettement mieux
  réussies que les annales ; mélanger les deux faisait lire un progrès là où la banque avait
  changé. Le bilan affiche la composition et, le cas échéant, l'écart de réussite mesuré.
- **Réserve d'annales** — une question d'annale jamais vue ne sert pas à l'entraînement : séries,
  revanches et textes de compréhension la laissent aux épreuves, qui la servent en premier. Le hub
  affiche la réserve par sous-test et dit quand un diagnostic peut être entièrement sur annales.
- **Réussite à froid** — dans la stratégie, la réussite à la première rencontre d'un scénario (un
  texte en compréhension), à côté de la réussite une fois le scénario vu plusieurs fois. C'est la
  première qui prédit l'épreuve ; un écart de plus de 15 points signale une réussite d'habitude.
- **Ce qui n'est pas mesuré ne compte pas comme mesuré** — une confiance laissée vide sur une
  feuille papier est enregistrée comme non déclarée et exclue de la calibration ; le temps d'une
  épreuve papier, déclaré par sous-test, compte dans le volume de travail mais dans aucune
  statistique de temps ; une épreuve reprise après plus de 5 minutes de coupure (chronomètre
  arrêté) perd son statut de conditions réelles.
- **Difficulté observée** de chaque question, tirée des réponses réelles avec un a priori
  bayésien (une question vue deux fois ne passe pas pour « très difficile ») ; affichée comme
  fiable à partir de 5 réponses.
- **Questions douteuses** — ratée avec une confiance maximale, la même mauvaise lettre
  répétée, ou jamais réussie en 3 essais : l'énoncé ou le corrigé est peut-être faux. La
  question est signalée dans l'atelier et reste en service tant que tu ne l'envoies pas en
  relecture.
- **Réponses équilibrées** — les propositions sont permutées à l'import pour répartir les
  bonnes réponses sur A à E ; un test alerte si une lettre dépasse 35 %.

**Plan**

- Le « fait » se **mesure** : séries closes d'au moins 10 réponses, cours étudiés, épreuves
  terminées. Le temps de lecture des corrections compte dans le volume réalisé.
- Le plan de la semaine est **figé le lundi**. Les séries non faites la semaine précédente sont
  reportées, au plus la moitié, et le plan le dit.
- **Jusqu'à l'examen** — `/plan` projette semaine par semaine les blancs, les diagnostics et
  les cours restants.
- Un **bandeau de reprise** apparaît sur l'accueil après 2 jours sans activité.

**Entraînement**

- **Rythme en direct** — pendant une série, l'avance ou le retard sur 80 s par question.
- **Sprint** — 15 questions sous un seul chronomètre de 20 minutes, comme un sous-test. À la
  fin du temps, ce qui reste compte comme non traité. Quitter la page en plein sprint demande
  confirmation.
- **Revanche** — après une erreur, 3 questions du même modèle, tout de suite.
- **Arbre de décision** — en conditions minimales, répondre par les questions « (1) seule
  suffit ? (2) seule ? ensemble ? » plutôt que par la lettre.
- **Carnet d'erreurs** — chaque erreur revient à 1, 3 puis 7 jours (filtre « À rejouer
  aujourd'hui ») ; une cause se déclare en un clic (lecture, calcul, méthode, piège, temps,
  hésitation) et la cause dominante vient avec son remède.
- **Épreuve sur papier** — `/tagemage/papier` compose un blanc ou un diagnostic à imprimer avec
  sa feuille de réponses, sans ouvrir de séance ; la saisie se fait ensuite, le jour même ou
  le lendemain. Le sujet et la saisie en cours sont gardés dans le navigateur.
- **Banque enrichie** — cinq modèles de calcul de plus (probabilités, disque, volumes, suites
  géométriques), 24 argumentaires de raisonnement de plus (129 distincts), et un générateur de
  paradoxes : « résoudre un paradoxe » avait zéro question.
- **Séries variées** — les séries passent par le même tirage que les épreuves : les modèles les
  moins vus d'abord, et en calcul comme en raisonnement, pas plus de deux questions d'un même
  modèle par série (le reste vient du sous-test). Une série de compréhension ciblée sur des types
  de questions sert des textes entiers, ceux qui portent le plus de questions de ces types. Le
  plan ne vise plus un type qui compte moins de 5 questions en banque.
- **Fiches imprimables** — une par sous-test, depuis `/tagemage/cours`.

**Interface**

- **Mode clair** — le thème suit celui du système ; `/reglages` permet de forcer clair ou
  sombre (choix gardé dans le navigateur).
- **J−X partout** — le compte à rebours jusqu'à l'examen, en haut de chaque page TAGE MAGE.
- **Prochaine séance** — la même sur l'accueil et sur le hub TAGE MAGE : la première tâche
  non faite du plan.
- **Case vide = manque à gagner** — les bilans chiffrent ce que les cases vides ont laissé
  sur la table (0,8 point brut chacune en moyenne).

Les textes de compréhension originaux de ce dépôt sont dans `contenu/comprehension/`, au
format Markdown de l'import (`## TEXTE`, questions, `# CORRIGÉ`). Ils entrent en `à relire`
comme tout import.

## Raccourcis clavier du drill

`?` (ou le petit bouton en bas à droite) affiche, sur n'importe quelle page, les raccourcis qui y
sont actifs.

| Touche | Action |
|---|---|
| `1` … `5` ou `A` … `E` | Répondre |
| `espace` | Sauter la question |
| `1` … `4` | Déclarer sa confiance, après avoir répondu |
| `échap` | Revenir à la question |

En épreuve s'ajoutent `←` `→` pour naviguer dans le sous-test et `M` pour marquer une question.

La correction n'apparaît **qu'en fin de série**, jamais entre deux questions : casser le
rythme détruit la valeur d'entraînement.

## Importer des questions

Format « texte collé » reconnu :

```
1. Un train parcourt 240 km en 3 h. Quelle est sa vitesse moyenne ?
A) 60 km/h
B) 70 km/h
C) 80 km/h
Réponse : C
Explication : 240 / 3 = 80
```

Pour les **conditions minimales**, les deux informations suffisent à déclencher le format
(les cinq propositions A-E étant invariables, elles ne sont pas à saisir) :

```
Quelle est la valeur de x ?
(1) x est un entier pair compris entre 3 et 7.
(2) x est un multiple de 3.
Réponse : A
```

Format CSV : colonnes `enonce` et `bonne_reponse` obligatoires, `option_a` à `option_e`,
`explication`, `contexte`, `info_1`, `info_2`, `difficulte` facultatives. Virgule ou
point-virgule, détecté automatiquement.

Les blocs mal formés ne sont **jamais** importés en silence : ils sont listés avec la raison.

L'application n'ouvre que les fichiers que tu lui donnes explicitement. Elle ne télécharge
rien depuis Internet.

## Architecture

```
core/       agnostique de l'examen — base, barème, import
  db/       client SQLite, migrations, seed, requêtes
  scoring/  barèmes TAGE MAGE et TOEIC, conversions — testés unitairement
  stats/    calibration, puits de temps, leviers, estimation de score — calculs purs testés
  scheduler/ répétition espacée SM-2, composition du plan et arbitrage — calculs purs testés
  import/   parseurs texte, CSV, PDF et scripts Listening — testés unitairement
  ia/       fournisseurs interchangeables, prompt du tuteur, orchestration
  audio/    moteurs de synthèse, cache et concaténation WAV
exams/      structures et taxonomies par examen
  tagemage/ 6 sous-tests, 58 sous-compétences
  toeic/    7 parts, budgets Reading, accents Listening, grilles Writing
app/        routes Next.js
proxy.ts    garde d'accès : cette machine seulement, écritures depuis l'app seulement
data/       base SQLite, sauvegardes, exports et audio synthétisé — jamais versionné
outils/     binaires téléchargés (Piper, voix) — jamais versionné
scripts/    vérifications, données de démonstration, exports, corrections ponctuelles
```

Trois règles tenues dans tout le code :

1. **`attempt` est immuable et exhaustive.** Aucune agrégation n'est stockée sans être
   recalculable depuis elle. Une question ne s'y inscrit qu'une fois par séance (index
   unique) : un envoi rejoué après une coupure est absorbé, pas doublé.
2. **`temps_ms` et `confiance` sont contraints au niveau de la base**, pas seulement dans le
   formulaire. `node scripts/verifier-contraintes.mjs` le vérifie. Le temps d'une réponse est
   plafonné à 30 minutes.
3. **Une erreur de requête (4xx) se lit telle quelle, une erreur serveur (5xx) se rejoue.**
   Les routes passent toutes par `app/api/erreurs.ts` ; aucun message brut de SQLite
   n'arrive à l'écran.

`core/db/parcours.test.ts` joue les vraies routes de l'API de bout en bout — une série avec
renvoi après coupure, un diagnostic à l'écran, un diagnostic sur papier, un export — sur une
base jetable désignée par `PREPA_DB`. La vraie base n'est jamais ouverte par les tests.

## Données et sécurité

- **Sauvegardes** — une copie de la base par jour dans `data/sauvegardes/app-AAAA-MM-JJ.db`,
  faite par l'application elle-même ; les 14 plus récentes sont conservées. Les copies
  nommées autrement ne sont jamais supprimées. Pour restaurer : arrêter l'application,
  remplacer `data/app.db` par la copie, supprimer `app.db-wal` et `app.db-shm`.
- **Copie hors de ce disque** — `PREPA_SAUVEGARDES_EXTERNES` dans `.env.local` (un dossier
  OneDrive, une clé USB) : chaque sauvegarde quotidienne y est recopiée, les 14 dernières
  gardées. Désactivé par défaut. Les Réglages listent les sauvegardes et rangent, après
  confirmation, les copies nommées « avant-… » de plus de 7 jours.
- **Exporter** — `/reglages` télécharge la base entière (`.db`, restaurable telle quelle) ou
  un JSON lisible table par table (sans les images).
- **Séances abandonnées** — une séance non close après 12 heures est rangée : supprimée si
  elle est vide, marquée interrompue sinon. Ses réponses restent comptées dans la stratégie
  et le carnet, mais elle ne compte comme aucune épreuve passée.
- **Accès** — le serveur écoute sur 127.0.0.1, et `proxy.ts` refuse toute requête dont l'hôte
  n'est pas local ainsi que toute écriture venue d'un autre site (Origin, Sec-Fetch-Site) :
  une page web ouverte dans ton navigateur ne peut pas appeler les API de l'application.
- **IA** — seule fonction qui sort de la machine, et seulement si une clé est posée dans
  `.env.local` : le débrief envoie le bilan d'une série au fournisseur configuré.
