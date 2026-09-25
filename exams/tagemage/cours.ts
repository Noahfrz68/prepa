import type { SectionTageMage } from './index'

/**
 * Fiches de méthode par sous-test.
 *
 * Ce ne sont pas des cours de connaissances : le TAGE MAGE n'évalue aucun
 * programme. Ce qu'il évalue, c'est une conduite sous contrainte de temps. Les fiches disent donc ce qu'il faut FAIRE, dans quel ordre, et à
 * quel moment renoncer — pas ce qu'il faut savoir.
 */

export interface Fiche {
  section: SectionTageMage
  /** Ce que le sous-test mesure réellement, en une phrase. */
  enjeu: string
  /** Le geste, étape par étape. Ordonné : c'est une procédure, pas une liste. */
  methode: string[]
  /** Erreurs qui coûtent des points à des gens qui savent faire l'exercice. */
  pieges: Array<{ titre: string; texte: string }>
  /** Ce qu'on décide avant d'entrer dans le sous-test. */
  strategie: string
}

export const FICHES: Fiche[] = [
  {
    section: 'comprehension',
    enjeu:
      'Retrouver dans un texte ce qu’il dit exactement — ni ce qu’il suggère, ni ce que tu en penses.',
    methode: [
      'Lis la question AVANT le texte. Tu sauras quoi chercher, et tu liras une fois au lieu de deux.',
      'Repère la nature de la question : idée principale, détail localisé, inférence, ton de l’auteur. Chacune se traite différemment.',
      'Pour un détail, reviens au passage et cite-le mentalement. Pour une idée principale, résume le texte en une phrase avant de regarder les propositions.',
      'Élimine d’abord ce qui est vrai mais hors sujet : c’est le leurre le plus fréquent, et il paraît juste.',
      'Vérifie que la proposition retenue tient sur TOUTE sa longueur. Une seule partie fausse suffit à l’écarter.',
    ],
    pieges: [
      {
        titre: 'La proposition vraie mais absente du texte',
        texte:
          'Elle est cohérente avec ce que tu sais du monde, mais le texte ne la dit pas. Le critère n’est jamais « est-ce vrai » mais « est-ce écrit ».',
      },
      {
        titre: 'Les quantificateurs',
        texte:
          '« toujours », « tous », « jamais », « uniquement » : une proposition trop absolue est presque toujours fausse quand le texte, lui, nuance.',
      },
      {
        titre: 'Le glissement de sens',
        texte:
          'La proposition reprend les mots du texte mais en inverse la relation — cause devenue conséquence, condition devenue certitude.',
      },
    ],
    strategie:
      'Trois textes, cinq questions chacun. Traite les textes dans l’ordre où ils t’arrangent : le texte le plus court d’abord fait cinq questions rapides et te libère du temps pour les deux autres.',
  },
  {
    section: 'calcul',
    enjeu:
      'Calculer vite et juste sur des problèmes simples — la difficulté vient du chronomètre, pas des mathématiques.',
    methode: [
      'Lis la question en dernier mot : c’est elle qui dit quelle quantité chercher, et beaucoup d’erreurs viennent d’un calcul juste sur la mauvaise grandeur.',
      'Cherche l’ordre de grandeur avant le calcul exact. Il élimine souvent deux ou trois propositions d’un coup.',
      'Privilégie les fractions aux décimales : 1/3 est exact, 0,33 ne l’est pas et l’erreur s’accumule.',
      'Si les propositions sont espacées, approxime. Si elles sont serrées, calcule exactement — leur écartement te dit quelle précision est nécessaire.',
      'Reporte le résultat dans l’énoncé pour vérifier. Cinq secondes, et cela attrape les erreurs de signe et de sens.',
    ],
    pieges: [
      {
        titre: 'Les pourcentages qui s’additionnent',
        texte:
          '+20 % puis −20 % ne ramène pas au départ mais à −4 %. Les taux se composent en multipliant leurs coefficients : 1,20 × 0,80 = 0,96.',
      },
      {
        titre: 'La vitesse moyenne',
        texte:
          'Sur un aller-retour à 60 puis 30 km/h, la moyenne n’est pas 45 mais 40 km/h. On moyenne des temps, pas des vitesses.',
      },
      {
        titre: 'Le « sans remise »',
        texte:
          'Trois mots qui changent tout le calcul de probabilité. Ils sont écrits ; il suffit de les lire.',
      },
      {
        titre: 'L’unité',
        texte:
          'Des minutes contre des heures, des cm contre des m : le leurre correspondant est toujours présent dans les propositions.',
      },
    ],
    strategie:
      'Fais un premier passage sur les questions que tu vois tomber en moins d’une minute, puis reviens. Rester bloqué trois minutes sur la question 4 coûte les questions 13, 14 et 15, qui valent autant.',
  },
  {
    section: 'raisonnement',
    enjeu:
      'Juger la validité d’un argument, indépendamment de la vérité de ce qu’il affirme.',
    methode: [
      'Sépare la conclusion des prémisses. Repère les marqueurs : « donc », « par conséquent » annoncent une conclusion ; « car », « puisque » une prémisse.',
      'Formule le lien manquant : qu’est-ce qui doit être vrai pour que les prémisses entraînent la conclusion ? C’est presque toujours là qu’est la question.',
      'Distingue affaiblir, renforcer, et supposer. Une proposition qui renforce n’est pas une réponse à « quel présupposé ».',
      'Teste par l’extrême : si la proposition était vraie à 100 %, l’argument tiendrait-il encore ? Sinon, c’est bien elle qui l’affaiblit.',
      'Reste dans l’argument. Ton opinion sur le sujet ne compte pas, et c’est justement ce que le sous-test vérifie.',
    ],
    pieges: [
      {
        titre: 'Corrélation prise pour causalité',
        texte:
          'Deux faits qui varient ensemble n’ont pas de rapport de cause à effet. Une bonne partie des arguments proposés reposent sur ce saut.',
      },
      {
        titre: 'L’échantillon non représentatif',
        texte:
          'Une conclusion générale tirée d’un cas particulier, ou d’un groupe choisi. Cherchez toujours sur qui portait l’observation.',
      },
      {
        titre: 'La proposition hors périmètre',
        texte:
          'Elle affaiblit une thèse voisine, pas celle de l’argument. Reviens à la conclusion écrite, mot pour mot.',
      },
    ],
    strategie:
      'C’est le sous-test où relire l’énoncé est rentable : les textes sont courts et une lecture ratée coûte plus cher que les vingt secondes d’une seconde lecture.',
  },
  {
    section: 'conditions_minimales',
    enjeu:
      'Décider si une réponse EXISTE, sans jamais la calculer. C’est le sous-test le plus rentable, parce que la méthode y remplace le talent.',
    methode: [
      'Écris la question sous forme d’inconnue : que cherche-t-on exactement, et une seule valeur suffit-elle ?',
      'Prends l’information (1) SEULE. Masque mentalement la (2). Détermine-t-elle la réponse ? Oui ou non.',
      'Prends l’information (2) SEULE, en oubliant tout ce que la (1) t’a appris. C’est l’étape que tout le monde rate.',
      'Si les deux suffisent séparément : D. Si une seule suffit : A ou B. Si aucune ne suffit seule, réunis-les : C si le couple suffit, E sinon.',
      'Ne pousse jamais le calcul jusqu’au bout. Savoir qu’une équation à une inconnue a une solution unique suffit — la résoudre est du temps perdu.',
    ],
    pieges: [
      {
        titre: 'La contamination',
        texte:
          'Tu as lu (1), puis tu évalues (2) en gardant (1) en tête. C’est l’erreur numéro un du sous-test, et elle fait répondre D là où la réponse est A.',
      },
      {
        titre: 'Le carré',
        texte:
          'x² = 25 donne deux solutions, 5 et −5 : l’information ne suffit pas. Un cube, lui, détermine le signe. La différence vaut plusieurs points par épreuve.',
      },
      {
        titre: 'La réponse demandée n’est pas l’inconnue',
        texte:
          'Si la question porte sur x + y, une information qui donne x + y suffit, même si elle ne dit rien de x ni de y séparément.',
      },
      {
        titre: 'La division par zéro',
        texte:
          'Une équation avec un dénominateur ou un paramètre peut perdre l’unicité de sa solution dans un cas particulier. Cherche-le avant de conclure.',
      },
    ],
    strategie:
      'Les cinq propositions sont TOUJOURS les mêmes et dans le même ordre. Apprends-les par cœur avant l’épreuve : tu récupères plusieurs secondes par question, soit deux ou trois questions sur le sous-test.',
  },
  {
    section: 'expression',
    enjeu:
      'Reconnaître le français correct — orthographe, syntaxe, registre, cohérence — sans avoir à expliquer la règle.',
    methode: [
      'Identifie le type de question : correction d’une phrase, synonyme, reformulation, cohérence d’un enchaînement. Chacun se traite autrement.',
      'Sur une reformulation, compare les propositions ENTRE ELLES d’abord : leurs différences pointent l’endroit précis qui est testé.',
      'Lis à voix basse dans ta tête. L’oreille attrape des accords et des constructions que l’analyse rate.',
      'Vérifie les points sensibles dans l’ordre : accord du participe passé, concordance des temps, prépositions, pronoms relatifs.',
      'Si deux propositions te semblent également correctes, l’une a un défaut de registre ou une lourdeur. Cherche la plus sobre.',
    ],
    pieges: [
      {
        titre: 'Le participe passé avec « avoir »',
        texte:
          'Il s’accorde avec le complément d’objet direct seulement quand celui-ci est placé avant. C’est le test le plus fréquent du sous-test.',
      },
      {
        titre: 'Les paires proches',
        texte:
          'quelquefois / quelques fois, plutôt / plus tôt, quoique / quoi que, davantage / d’avantage. La proposition fautive n’en change qu’une.',
      },
      {
        titre: 'Le subjonctif après une locution',
        texte:
          '« bien que », « quoique », « avant que » l’imposent ; « après que » ne le demande pas. Les propositions jouent précisément là-dessus.',
      },
    ],
    strategie:
      'C’est le sous-test le plus rapide quand la langue est acquise, et le plus coûteux sinon. Chronomètre-toi : si tu dépasses 60 secondes sur une question, tu ne trouveras pas en 120 — passe, et reviens s’il reste du temps.',
  },
  {
    section: 'logique',
    enjeu:
      'Trouver la règle qui engendre une suite. Aucune connaissance n’est requise : seulement une manière ordonnée de chercher.',
    methode: [
      'Convertis avant de comparer. Les lettres en rangs (A = 1, Z = 26), les figures en nombres (combien de côtés, de points, de traits). Une régularité invisible sur des symboles saute aux yeux sur des nombres.',
      'Décompose en attributs et traite-les SÉPARÉMENT. Un groupe de trois lettres, ce sont trois suites ; un domino, deux ; une figure, souvent trois. Lire l’objet en bloc est la première cause d’échec du sous-test.',
      'Écarte les attributs qui varient partout : s’ils ne séparent rien, ils ne portent aucune règle. Cette déduction prend trois secondes et fait souvent tomber le problème de trois dimensions à une.',
      'Sur une croix, lis la rangée SEULE d’abord — que vérifie chaque case toute seule ? — puis la colonne seule. Vouloir voir les deux règles en même temps est le meilleur moyen de n’en voir aucune.',
      'Sur une suite numérique, écris les écarts sous la suite. Constants : arithmétique. Réguliers : la règle porte sur l’écart. Ni l’un ni l’autre : cherche un rapport, puis les carrés et cubes.',
      'Sur un intrus, cherche la règle que QUATRE éléments partagent, jamais l’anomalie d’un seul. Chercher ce qui cloche permet de justifier n’importe lequel des cinq.',
      'Vérifie ta règle sur TOUS les éléments visibles, pas seulement sur deux. Une règle qui marche sur deux termes est souvent une coïncidence ; il en faut quatre pour en être sûr.',
      'Élimine plutôt que de construire. Applique la moitié la plus rapide de la règle aux cinq propositions — deux tombent — puis vérifie le reste sur les survivantes.',
    ],
    pieges: [
      {
        titre: 'La règle validée sur deux termes',
        texte:
          'Deux points suffisent à tracer n’importe quelle droite. Il en faut trois pour que la règle soit crédible, et quatre pour en être sûr.',
      },
      {
        titre: 'Le repli de l’alphabet',
        texte:
          'Après Z on revient à A. Une progression qui semble s’interrompre continue souvent de l’autre côté.',
      },
      {
        titre: 'La lettre libre',
        texte:
          'Dans un groupe de trois, une position ne porte parfois aucune règle. Chercher une régularité là où il n’y en a pas fait perdre la question.',
      },
      {
        titre: 'La case sautée',
        texte:
          'Le « ? » occupe une place dans la série : entre la case du dessus et celle du dessous, il y a DEUX pas, pas un. Le leurre correspondant à un seul pas est toujours proposé.',
      },
      {
        titre: 'Le leurre qui vérifie une règle sur deux',
        texte:
          'Croix, cases barrées, analogies figurées : la règle est double, et chaque mauvaise proposition en respecte exactement une moitié. Dès qu’une proposition passe le premier test, la tentation est de cocher — c’est précisément le piège.',
      },
      {
        titre: 'Le retour à zéro des dominos et des cartes',
        texte:
          'Une moitié de domino va de 0 à 6, une valeur de carte de 1 à 13, une enseigne sur 4. Les trois bouclages n’ont pas la même période, et les leurres exploitent exactement cela.',
      },
      {
        titre: 'L’attribut décoratif',
        texte:
          'Sur une figure, la taille et l’inclinaison sont des attributs décoratifs neuf fois sur dix. Ils attirent l’œil, et c’est leur rôle.',
      },
    ],
    strategie:
      'Le sous-test est très inégal : certaines séries se voient en dix secondes, d’autres résistent. Fais deux passages, et accepte de renoncer sur deux ou trois — mais coche-les quand même avant de partir : une croix au hasard rapporte 0,8 point, une case vide zéro.',
  },
]

/**
 * Ce qui vaut pour toute l’épreuve, et que la stratégie par sous-test ne dit pas.
 */
export const REGLES_GENERALES: Array<{ titre: string; texte: string }> = [
  {
    titre: 'Ne rends jamais une case vide',
    texte:
      'Une bonne réponse vaut +4, une mauvaise 0, une case vide 0. La pénalité a disparu : se tromper ne coûte plus rien. Une croix posée au hasard entre cinq propositions rapporte donc (1/5) × 4 = 0,8 point en moyenne, contre 0 pour une case laissée blanche. Il n’existe aucune situation, aucun niveau de doute, où s’abstenir rapporte davantage que répondre.',
  },
  {
    titre: 'La décision porte sur le temps, pas sur la réponse',
    texte:
      'Puisque répondre est toujours gagnant, la seule question qui reste est : combien de secondes cette question mérite-t-elle ? Éliminer des propositions fait monter l’espérance — 1 point avec une écartée, 1,33 avec deux — mais ce n’est plus un seuil à franchir, c’est un rendement à comparer. Sur une question où tu ne fais pas mieux que le hasard, coche immédiatement et passe : les 80 secondes économisées valent davantage ailleurs.',
  },
  {
    titre: '80 secondes par question',
    texte:
      'Six sous-tests, 15 questions, 20 minutes chacun. Une question qui dépasse deux minutes en mange une autre entièrement. Le chronomètre est l’adversaire réel de l’épreuve.',
  },
  {
    titre: 'Les sous-tests ne se compensent pas comme on croit',
    texte:
      'Le score sur 600 est une moyenne, mais les écoles regardent aussi les blocs : verbal (compréhension, expression), résolution de problèmes (calcul, conditions minimales), raisonnement (argumentation, logique). Un bloc effondré se voit, même avec un total correct.',
  },
  {
    titre: 'Progresser d’abord là où c’est mécanique',
    texte:
      'Les conditions minimales et la logique s’améliorent par la méthode, vite. La compréhension et l’expression dépendent d’une langue qui se construit sur des mois. À trois semaines de l’épreuve, l’effort rentable n’est pas le même qu’à trois mois.',
  },
]
