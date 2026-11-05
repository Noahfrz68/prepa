/**
 * L'astuce de chaque famille : la méthode qui fait gagner du temps à l'épreuve.
 *
 * La démarche dit comment résoudre ; l'astuce dit comment résoudre VITE — le
 * raccourci, l'élimination, le repère à connaître par cœur. Elle s'affiche
 * sous chaque question corrigée, que la réponse soit juste ou fausse : une
 * bonne réponse trouvée en deux minutes est encore à améliorer.
 *
 * Une astuce par famille, rattachée par son nom au tirage (core/generation/index.ts).
 * Un test vérifie que chaque famille en a une.
 */

import type { SectionGenerable } from '.'

export const ASTUCES: Record<SectionGenerable, Record<string, string>> = {
  calcul: {
    // calcul.ts
    'variations successives':
      'Transforme chaque taux en coefficient (+25 % → ×1,25 ; −20 % → ×0,8) et multiplie. À retenir : +25 % puis −20 % font exactement ×1, et une hausse de x % se compense par une baisse plus faible.',
    'variation globale':
      'Multiplie les coefficients, puis retire 1. Contrôle express : une hausse suivie d’une baisse du même taux donne toujours une baisse, égale à (taux)² / 100.',
    'partage selon un rapport':
      'Raisonne en « parts » : un rapport de 3 pour 5 fait 8 parts au total et 2 parts d’écart. Trouve la valeur d’UNE part, puis multiplie par ce qu’on demande.',
    'nombre inconnu':
      'Les années s’ajoutent aux deux âges. Plutôt que de poser l’équation, teste les propositions : multiplie la réponse proposée et vérifie l’autre phrase en dix secondes.',
    'somme et produit des racines':
      'Pour x² + bx + c = 0, la somme des racines vaut −b et leur produit c : aucune racine à calculer. Si on demande une racine, cherche deux nombres de somme −b et de produit c.',
    'deux achats, deux inconnues':
      'Soustrais les deux équations quand un même nombre d’articles apparaît des deux côtés : une inconnue disparaît d’un coup. Sinon, teste les propositions dans la première équation.',
    'comptage de multiples':
      'Le nombre de multiples de k jusqu’à N, c’est la partie entière de N ÷ k. Pour « divisible par p mais pas par q », retire les multiples du PPCM, pas ceux de q.',
    'PGCD et PPCM':
      '« Le plus grand possible, sans reste » → PGCD ; « de nouveau ensemble » → PPCM. Factorise en faisant sortir le facteur commun : 60 = 12 × 5 et 72 = 12 × 6 donnent PGCD 12 et PPCM 12 × 5 × 6.',
    'triangle rectangle':
      'Reconnais le triplet avant de calculer : 3-4-5, 5-12-13, 8-15-17, 7-24-25 et leurs multiples. Une hypoténuse de 15 avec un côté de 9 ? C’est 3-4-5 × 3, l’autre côté vaut 12.',
    'rectangle à périmètre donné':
      'Le demi-périmètre donne longueur + largeur. Avec le rapport, découpe ce demi-périmètre en parts : L = 3l et L + l = 12 donnent 4 parts de 3.',
    'note manquante':
      'Raisonne en total de points, jamais en moyennes : nouveau total − ancien total = la note cherchée. Ou plus vite : moyenne visée + (nombre de devoirs précédents × hausse de la moyenne).',
    'tirage sans remise':
      'Traduis d’abord la phrase : « simultanément », « d’un coup », « mise de côté » = sans remise ; « remise », « replacée » = avec remise. Puis multiplie les probabilités de chaque tirage.',
    'comité et podium':
      'Une seule question : changer l’ordre change-t-il le résultat ? Podium, bureau, classement → ordre (n × (n−1) × …). Commission, groupe, équipe → pas d’ordre, divise par k!.',
    'vitesse moyenne aller-retour':
      'Sur des distances égales, la vitesse moyenne vaut 2 v₁ v₂ / (v₁ + v₂), toujours sous la moyenne des deux vitesses. Si une proposition vaut (v₁ + v₂) / 2, c’est le piège.',
    'travail conjoint':
      'Additionne les débits, jamais les durées : 1/3 + 1/6 = 1/2 de bassin par heure, donc 2 heures. Pour deux durées a et b, le temps ensemble vaut a × b / (a + b).',
    'progression arithmétique':
      'Écart entre deux rangs = (différence des rangs) × pas. Pour une somme : (premier + dernier) × nombre de termes ÷ 2. Écris les trois premiers termes pour ne pas te tromper de rang.',
    'au moins un succès, par l’événement contraire':
      'Dès que tu lis « au moins un », calcule « aucun » et retranche de 1 : une multiplication au lieu de plusieurs cas à additionner.',
    'somme de deux dés':
      'Le nombre de façons d’obtenir une somme S avec deux dés vaut 6 − |S − 7|, sur 36 issues. Le 7 est le plus fréquent (6/36), le 2 et le 12 les plus rares (1/36).',
    'périmètre et aire du disque':
      'Garde tout en « π » : compare les coefficients sans remplacer π par 3,14. Repasse toujours par le rayon : un périmètre de 18π donne r = 9, une aire de 64π donne r = 8.',
    'volume d’un pavé, en litres':
      'Convertis d’abord toutes les longueurs en décimètres : 1 dm³ = 1 litre, et il n’y a plus aucune conversion à la fin.',
    'progression géométrique':
      'Écris les termes à la main jusqu’au rang ou au seuil demandé : six multiplications prennent moins de temps qu’une puissance mal comptée. Le rang dépasse toujours d’une unité le nombre de multiplications.',
    // calcul-problemes.ts
    'capital placé pour partie':
      'Isole d’abord les intérêts (somme finale − somme de départ), puis la partie placée. Taux = intérêts ÷ (partie placée × nombre d’années).',
    'clôture autour d’un carré':
      'La racine de l’aire extérieure donne le côté de la clôture ; retire deux fois l’écart (un de chaque côté) pour retrouver le côté de la piscine.',
    'cadeau commun':
      'Le prix ne change pas : nombre de personnes × part = même total. Teste les propositions : le total doit être divisible par les deux parts.',
    'plots et intervalles':
      'Dessine trois intervalles pour te convaincre : sur une ligne ouverte, il y a un plot de plus que d’intervalles ; sur une boucle, autant.',
    'entiers consécutifs':
      'Appelle n le terme du milieu : la somme de 5 consécutifs vaut 5n. Avec un nombre pair de termes, pars du plus petit et écris k × n + le talon (0 + 1 + 2 + …).',
    'fractions et reste':
      'Additionne les fractions sur un dénominateur commun, la part restante est le complément à 1. Le total vaut reste ÷ (part restante). Contrôle : le total doit être divisible par chaque dénominateur.',
    'multiples dans un intervalle':
      'Compte les multiples jusqu’à la borne haute, retire ceux sous la borne basse : ⌊haut ÷ k⌋ − ⌊(bas − 1) ÷ k⌋. Avec des négatifs, compte les deux côtés de 0 et n’oublie pas 0 lui-même.',
    'croissance par phases':
      'Compte le nombre d’années de chaque phase (année d’arrivée − année de départ), puis applique les coefficients : ×2 sur 3 ans = ×8.',
    'moyenne d’un groupe manquant':
      'Ramène la classe à une maquette minimale : « deux fois plus de garçons » = 1 fille et 2 garçons. Total de la classe − total des filles = total des garçons.',
    rattrapage:
      'Calcule l’avance du premier (vitesse × temps d’avance), puis divise par la différence des vitesses : c’est le temps de rattrapage, compté depuis le départ du second.',
    'prix avant deux variations':
      'Remonte à l’envers : divise par chaque coefficient au lieu de multiplier. +10 % puis −10 % ne ramènent jamais au départ : ×1,1 × 0,9 = ×0,99.',
    'travail commencé seul':
      'Raisonne en fractions du travail : ce qui est fait seul, ce qui reste, puis le reste divisé par la somme des débits.',
    // calcul-idees.ts
    'probabilité conditionnelle':
      'Liste les cas possibles (MM, MF, FM, FF), raye ceux que la condition exclut, compte ce qui reste. « L’un des deux, sans savoir lequel » ≠ « celui-ci » : 1/3 contre 1/2.',
    'deux vitesses, deux heures d’arrivée':
      'Passe par la distance : l’écart d’arrivée est l’écart des durées. Jamais de règle de trois entre vitesse et heure : la durée varie comme 1 / vitesse.',
    'grille à sommes égales':
      'Commence par les sommes, qui se déduisent du total (1 + … + 8 = 36 → colonnes de 9, lignes de 18). Les colonnes se complètent toutes seules ; la ligne départage la dernière.',
    'nombres selon leurs chiffres':
      'Une case par chiffre, un nombre de choix par case, puis multiplie. Vérifie la borne en écrivant le premier et le dernier nombre qui conviennent.',
    'offre par lots':
      'Ramène tout à un lot : « 5 achetés, 1 offert » = 6 articles pour le prix de 5. Divise par la taille du lot emporté, pas par le nombre d’articles payés.',
    'seul total compatible':
      'Ne résous rien : teste chaque proposition contre chaque fraction ou pourcentage. 20 % impose un multiple de 5, un septième un multiple de 7 : une seule passe les deux.',
    'restes compatibles':
      'Teste les propositions une par une : reste par le premier nombre, puis par le second. C’est trois fois plus rapide que de chercher le nombre.',
    'somme de consécutifs possible':
      'k consécutifs à partir de n font k × n + (0 + 1 + … + (k−1)). Retire ce talon et vérifie la divisibilité par k. Avec un nombre impair de termes, « multiple de k » suffit.',
  },

  logique: {
    'croix de lettres':
      'Résous la série la plus simple des deux (souvent la verticale) et teste les propositions dans l’autre : une seule passe les deux.',
    'croix de nombres':
      'Résous d’abord la série la plus lisible, puis contrôle la proposition retenue dans la seconde. Écris les écarts sous chaque série.',
    'analogie alphabétique':
      'Convertis en rangs (E = 5, J = 10, O = 15, T = 20, Y = 25) et lis le déplacement lettre par lettre. Le même déplacement s’applique au troisième groupe.',
    'suite numérique':
      'Écris les écarts sous la suite, puis les écarts des écarts. Ordre de test : écart constant → écart qui progresse → rapport → alternance → somme des deux précédents → carrés et cubes.',
    'suite de lettres':
      'Convertis en rangs avec les repères E = 5, J = 10, O = 15, T = 20, Y = 25. Dans un groupe de deux lettres, chaque position suit sa propre règle.',
    'intrus numérique':
      'Cherche la règle que partagent QUATRE nombres, pas l’anomalie d’un seul. Connais les carrés jusqu’à 25² et les faux premiers : 91 = 7 × 13, 119 = 7 × 17, 143 = 11 × 13.',
    'intrus alphabétique':
      'Convertis chaque groupe en rangs, puis teste : écart constant dans le groupe ? lettres symétriques (rangs de somme 27) ? Quatre groupes partagent la règle, un seul y échappe.',
    'opération codée':
      'Teste les opérations simples sur la première ligne (somme, produit, différence, somme + 1), puis confirme sur la deuxième avant de calculer la dernière.',
    'case barrée':
      'Teste les relations entre quartiers dans l’ordre : haut + bas, gauche × droite, différence… La règle doit tenir sur les trois cases du haut.',
    'matrice de figures':
      'Lis la matrice par lignes puis par colonnes : en général un attribut suit la ligne (forme), un autre la colonne (nombre de points). La case manquante croise les deux.',
    'suite de figures':
      'Isole un attribut à la fois (forme, rotation, nombre, position) et suis son évolution d’une case à l’autre.',
    'rotation de figure':
      'Repère un détail asymétrique (une pastille, un trait) et suis-le : il dit le sens et l’angle de rotation mieux que la forme entière.',
    'intrus figuré':
      'Écarte d’abord l’attribut qui varie sur les cinq figures (il ne peut pas être la règle). Ce qui reste commun à quatre figures désigne l’intrus.',
    'analogie figurée':
      'Décris la transformation A → B en une phrase (« tourne d’un quart de tour et perd un point »), puis applique exactement la même à C.',
    'suite de dominos':
      'Traite le haut et le bas des dominos comme deux suites séparées ; après 6, on revient à 0.',
    'suite de cartes':
      'Sépare la valeur et l’enseigne : chacune suit sa propre règle (valeur qui monte, enseigne qui tourne).',
    'croix — propriétés des chiffres':
      'Chaque série partage une propriété (somme des chiffres, parité, chiffre répété…). Teste les propositions contre la propriété la plus restrictive d’abord.',
    'croix — propriétés des lettres':
      'Chaque série partage une propriété des lettres (voyelles, rangs, symétrie). Identifie-la sur trois groupes, puis élimine les propositions qui ne la vérifient pas.',
    'série croisée figure ↔ code':
      'Associe chaque attribut de la figure à un caractère du code sur les cases connues, puis traduis la case manquante.',
  },

  conditions_minimales: {
    'âges':
      'Une information qui ne contient aucun âge peut suffire : une équation à une inconnue se résout. Compte les équations indépendantes, ne les résous pas.',
    rectangle:
      'Pour l’aire, il faut les DEUX dimensions. Un périmètre seul laisse une infinité de rectangles ; ajoute un rapport ou une dimension, et c’est fini.',
    remise:
      'Un taux seul ne donne jamais un prix. Un taux + un montant (économie ou prix soldé) suffit : le montant correspond à un pourcentage connu du prix initial.',
    entier:
      'Une équation du premier degré suffit toujours. Une borne (« n est supérieur à… ») ne suffit jamais, sauf si elle ne laisse qu’un seul candidat.',
    moyenne:
      'Deux moyennes de groupes ne se combinent qu’avec les effectifs. « Autant de filles que de garçons » + les deux moyennes : là, ça suffit.',
    ratio:
      'Un rapport donne des proportions, pas des effectifs : il faut en plus un total ou un écart chiffré pour convertir en nombre de personnes.',
    somme:
      'On demande x + y, pas x et y : une information peut suffire sans donner les deux nombres. Attention au carré : (x + y)² ne suffit que si le signe est fixé.',
    signe:
      'Un carré efface le signe (x² = 9 → 3 ou −3) ; un cube le garde (x³ = −27 → −3). Une valeur absolue + un signe suffisent.',
    prix:
      'Compte les équations INDÉPENDANTES : « deux cahiers et deux stylos » n’est que « un cahier et un stylo » multiplié par deux.',
    'carré':
      'Toute mesure d’un carré (côté, diagonale, aire, périmètre) suffit pour toutes les autres. Une propriété commune à tous les carrés ne suffit jamais.',
    hausse:
      'Le nouveau prix demande un montant ET un taux. Un montant de hausse + son taux donnent l’ancien prix, donc le nouveau.',
    'médiane':
      'La médiane est la valeur du milieu une fois les notes rangées. Range toujours avant de conclure ; une moyenne n’aide que si elle permet de retrouver la note manquante.',
    peinture:
      'Il faut un rendement par litre, direct ou retrouvable (surface couverte ÷ litres utilisés). « Deux pots couvrent deux fois plus » est vrai de toutes les peintures.',
    produit:
      'On demande xy, pas x et y : (x + y)² − (x − y)² = 4xy livre le produit sans les nombres.',
    'informations équivalentes':
      'Compare les deux informations avant de calculer : si elles disent la même chose, la réponse est D ou E, jamais A, B ni C.',
    'pièges — entier':
      'Cherche un contre-exemple dans chaque information : deux valeurs qui la vérifient mais donnent deux réponses différentes suffisent à l’éliminer.',
    'pièges — deux entiers':
      'Teste les cas limites (valeurs égales, bornes de l’intervalle) : c’est là que se cachent les contre-exemples.',
    'pièges — dés':
      'Énumère les tirages possibles : avec trois dés différents, la liste est courte, et un seul contre-exemple suffit à écarter une information.',
    'pièges — âges':
      'Teste deux couples d’âges compatibles avec l’information : s’ils donnent deux réponses, l’information ne suffit pas.',
  },

  expression: {
    'phrase correcte':
      'Vérifie dans l’ordre les accords (sujet-verbe, participe passé), puis la construction (« se rappeler quelque chose », « pallier un problème »), puis l’orthographe d’usage.',
    'phrase fautive':
      'Lis chaque phrase en cherchant UNE faute précise : accord du participe avec « avoir », subjonctif après « bien que », préposition imposée par le verbe.',
    'seule phrase correcte':
      'Élimine : dès qu’une faute est trouvée, la phrase sort. Les fautes classiques : « malgré que », « se rappeler de », « pallier à », participe mal accordé.',
    'connecteur logique':
      'Nomme le lien entre les deux propositions AVANT de lire le connecteur (cause, conséquence, opposition, concession, condition, addition), puis vérifie que le connecteur le porte.',
    synonyme:
      'Remplace le mot dans la phrase par chaque proposition : le synonyme garde le sens ET le registre. Méfie-toi des paronymes (« ostensible » ≠ « ostentatoire »).',
    antonyme:
      'Cherche d’abord le sens exact du mot dans la phrase, puis son contraire précis. Un mot simplement différent n’est pas un contraire.',
    'reformulation fidèle':
      'Repère la négation, la nuance (« pas seulement », « au moins ») et la portée de la phrase d’origine. La bonne reformulation n’ajoute ni ne retire rien.',
    'cohérence et registre':
      'Trois contrôles dans l’ordre : registre (ni familier, ni ampoulé), logique (la phrase se contredit-elle ?), sens des mots (un paronyme à une lettre près ?).',
  },

  raisonnement: {
    'contraposée':
      '« Tous les A sont B » équivaut à « tout non-B est non-A ». Il ne dit rien des B : « tous les B sont A » est le piège.',
    syllogisme:
      'Dessine deux cercles emboîtés : « tous les A sont B » place A dans B. La conclusion n’est valide que si elle se lit sur TOUS les dessins possibles.',
    affaiblir:
      'Identifie la faille de l’argument (cause inversée, échantillon biaisé, facteur caché) : la bonne réponse l’exploite. Une réponse hors sujet ne l’affaiblit pas, même vraie.',
    renforcer:
      'Repère l’hypothèse non dite dont dépend l’argument : la bonne réponse la confirme ou écarte une autre explication.',
    'hypothèse implicite':
      'Teste la négation de chaque proposition : si, niée, elle ruine l’argument, c’est l’hypothèse implicite.',
    sophisme:
      'Nomme le défaut : raisonnement circulaire, généralisation hâtive, attaque de la personne, fausse alternative. La définition élimine les autres propositions.',
    'résoudre un paradoxe':
      'La bonne réponse explique les DEUX faits à la fois, souvent par une variable cachée (population, période, taux contre effectif). Elle ne nie jamais l’un des faits.',
    'même structure':
      'Réécris l’argument en lettres (« A a eu lieu trois fois, donc A aura lieu ») et cherche la proposition qui suit exactement le même schéma, défauts compris.',
    classement:
      'Pose les informations sur un axe et commence par celles qui fixent une position absolue (« le plus élevé », « deuxième »). Les comparaisons relatives viennent ensuite.',
    'places dans une rangée':
      'Dessine les cinq places et place d’abord les contraintes fixes (extrémités, voisins imposés). Teste les cas restants plutôt que de raisonner dans le vide.',
    'chaîne de conditions':
      '« Si A alors B » donne aussi « si non-B alors non-A », jamais « si B alors A ». Enchaîne les implications dans le sens autorisé.',
    'Véridiques et Fourbes':
      'Fais une hypothèse sur le premier personnage (véridique ou fourbe) et suis ses conséquences : une contradiction élimine l’hypothèse.',
    calendrier:
      'Compte en semaines : un écart de 7 jours ne change pas le jour. Repère les longueurs de mois (31 : janvier, mars, mai, juillet, août, octobre, décembre) et travaille modulo 7.',
    'sous-groupes qui se recoupent':
      'Total = A + B − les deux + aucun des deux. Fais un tableau à double entrée ou deux cercles qui se chevauchent.',
  },
}
