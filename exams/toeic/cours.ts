/**
 * Fiches de méthode par partie du TOEIC Listening & Reading.
 *
 * Le TOEIC ne sanctionne pas l'erreur : il n'y a que des points gagnés. Toute
 * la stratégie découle de là, et elle est presque à l'opposé de celle du
 * TAGE MAGE — ce qui est la première chose à intégrer quand on prépare les deux.
 */

export interface FicheToeic {
  part: string
  numero: number
  section: 'listening' | 'reading'
  libelle: string
  questions: number
  enjeu: string
  methode: string[]
  pieges: Array<{ titre: string; texte: string }>
  strategie: string
}

export const FICHES_TOEIC: FicheToeic[] = [
  {
    part: 'p1',
    numero: 1,
    section: 'listening',
    libelle: 'Photographies',
    questions: 6,
    enjeu: 'Associer une description entendue à une image, sans texte à l’appui.',
    methode: [
      'Regarde la photo pendant la consigne : qui, quoi, où, quelle action en cours.',
      'Prépare mentalement deux ou trois phrases en anglais qui la décriraient. Tu reconnaîtras la bonne au lieu de la déchiffrer.',
      'Écoute le verbe et son temps : c’est presque toujours lui qui distingue les propositions.',
      'Élimine dès qu’une proposition nomme un objet absent, même si le reste colle.',
    ],
    pieges: [
      {
        titre: 'Les homophones',
        texte:
          'La proposition contient un mot qui sonne comme ce que tu vois — « copy » pour « coffee », « walking » pour « working ». Le son est proche, le sens n’a rien à voir.',
      },
      {
        titre: 'La voix passive',
        texte:
          '« The boxes are being loaded » suppose quelqu’un en train de charger. Sans personne sur la photo, c’est faux.',
      },
    ],
    strategie:
      'Six questions seulement, les plus faciles de l’épreuve. Ne les rate pas par distraction : c’est du score gratuit.',
  },
  {
    part: 'p2',
    numero: 2,
    section: 'listening',
    libelle: 'Question / réponse',
    questions: 25,
    enjeu:
      'Reconnaître une réponse plausible à une question, sans support écrit ni image. La partie la plus difficile pour un francophone.',
    methode: [
      'Concentre tout sur les TROIS premiers mots : ils donnent le type de question, donc la forme de la réponse attendue.',
      'Une question en Wh- (where, when, who, why) n’appelle jamais yes ou no. Cette seule règle élimine des propositions entières.',
      'Si tu n’as pas compris, choisis la proposition qui ne reprend AUCUN mot de la question : la répétition est le piège standard.',
      'Réponds immédiatement et oublie. Ruminer la question 12 fait rater la 13.',
    ],
    pieges: [
      {
        titre: 'La répétition de mots',
        texte:
          'La proposition reprend un mot entendu dans la question. C’est presque toujours un leurre — la vraie réponse reformule.',
      },
      {
        titre: 'La réponse indirecte',
        texte:
          '« When is the meeting? » — « I haven’t checked my calendar. » C’est une réponse valable, et c’est souvent la bonne.',
      },
      {
        titre: 'Le décrochage en chaîne',
        texte:
          'Une question ratée en fait rater deux autres si tu continues d’y penser. Le rythme compte plus que la question perdue.',
      },
    ],
    strategie:
      '25 questions sans aucun support visuel, à cadence imposée. C’est la partie qui s’améliore le plus vite par l’écoute quotidienne, même dix minutes.',
  },
  {
    part: 'p3',
    numero: 3,
    section: 'listening',
    libelle: 'Conversations',
    questions: 39,
    enjeu:
      'Suivre un dialogue de deux ou trois locuteurs et répondre à trois questions posées à l’écrit.',
    methode: [
      'LIS LES TROIS QUESTIONS pendant le silence qui précède l’audio. C’est la compétence réellement testée par cette partie.',
      'Les trois questions suivent l’ordre de la conversation : la première porte sur le début, la troisième sur la fin.',
      'Repère qui parle et où l’on est dès les deux premières phrases : beaucoup de questions portent là-dessus.',
      'Réponds pendant l’audio, pas après. Le temps entre deux conversations sert à lire les questions suivantes, pas à réfléchir aux précédentes.',
    ],
    pieges: [
      {
        titre: 'Le changement d’avis',
        texte:
          'Un locuteur annonce une chose puis se ravise. La bonne réponse est la seconde version, jamais la première.',
      },
      {
        titre: 'La question d’intention',
        texte:
          '« What does the man imply? » ne se répond pas avec une phrase entendue mot pour mot : il faut interpréter le ton.',
      },
      {
        titre: 'Le graphique',
        texte:
          'Certaines questions renvoient à un tableau ou un plan à l’écran. L’information demandée croise l’audio ET le visuel — regarder l’un seul ne suffit jamais.',
      },
    ],
    strategie:
      'Trente-neuf questions, presque un tiers du Listening. Si tu ne dois travailler qu’une chose à l’oral, c’est le geste de lire les questions à l’avance.',
  },
  {
    part: 'p4',
    numero: 4,
    section: 'listening',
    libelle: 'Exposés courts',
    questions: 30,
    enjeu:
      'Même exercice qu’en Part 3, mais un seul locuteur et un registre plus formel : annonce, message vocal, visite guidée, bulletin.',
    methode: [
      'Lis les trois questions à l’avance, comme en Part 3.',
      'Identifie le genre dès la première phrase : une annonce d’aéroport, un répondeur et une publicité ont chacun leur structure et leurs questions habituelles.',
      'La première phrase donne le contexte, la dernière donne l’action demandée. Ce sont les deux moments à ne pas manquer.',
      'Note mentalement les chiffres entendus : horaires, numéros de porte, prix. Ils sont presque toujours demandés.',
    ],
    pieges: [
      {
        titre: 'Le chiffre en trop',
        texte:
          'Plusieurs nombres sont énoncés, un seul répond à la question. Il faut savoir lequel on cherche AVANT de les entendre.',
      },
      {
        titre: 'La fin qui bascule',
        texte:
          '« However », « but », « unfortunately » annoncent que ce qui précède ne s’applique plus. La réponse est après.',
      },
    ],
    strategie:
      'Registre plus soutenu qu’en Part 3, mais pas de dialogue à suivre : beaucoup de candidats y sont meilleurs. Vérifie où tu en es avant de décider quoi travailler.',
  },
  {
    part: 'p5',
    numero: 5,
    section: 'reading',
    libelle: 'Phrases à compléter',
    questions: 30,
    enjeu:
      'Choisir le mot ou la forme correcte dans une phrase isolée. Grammaire et vocabulaire, sans contexte.',
    methode: [
      'Regarde d’abord les quatre propositions. Si elles partagent la même racine (« succeed / success / successful / successfully »), c’est une question de grammaire : la place dans la phrase suffit à répondre.',
      'Si elles sont de sens différents, c’est du vocabulaire : là il faut lire la phrase entière.',
      'Pour une question de grammaire, identifie ce qui manque — sujet, verbe, complément, adverbe — sans traduire.',
      'Vingt secondes par question, pas davantage. Cette partie doit financer le temps de la Part 7.',
    ],
    pieges: [
      {
        titre: 'Traduire',
        texte:
          'Passer par le français double le temps et introduit des erreurs. Sur une question de forme, la traduction n’apporte rien.',
      },
      {
        titre: 'Les prépositions figées',
        texte:
          'depend ON, interested IN, responsible FOR : elles ne se déduisent pas, elles s’apprennent. C’est le vocabulaire le plus rentable du TOEIC.',
      },
    ],
    strategie:
      'C’est ici qu’on gagne du temps, pas des points : les questions valent exactement autant qu’en Part 7. Ne t’attarde jamais — trente questions en dix minutes est un bon rythme.',
  },
  {
    part: 'p6',
    numero: 6,
    section: 'reading',
    libelle: 'Textes à compléter',
    questions: 16,
    enjeu:
      'Compléter un texte court : même exercice qu’en Part 5, mais le contexte compte, et une question demande d’insérer une phrase entière.',
    methode: [
      'Lis la phrase avant et la phrase après le trou : en Part 6, la réponse dépend souvent d’une autre phrase.',
      'Surveille les temps verbaux du texte entier : c’est le point le plus testé de cette partie.',
      'Pour l’insertion d’une phrase, cherche le lien logique — reprise d’un mot, connecteur, enchaînement de l’idée.',
      'Traite les quatre trous d’un texte ensemble, sans revenir en arrière une fois passé au texte suivant.',
    ],
    pieges: [
      {
        titre: 'Répondre trou par trou',
        texte:
          'Une réponse correcte localement peut contredire le reste du texte. La cohérence d’ensemble prime.',
      },
      {
        titre: 'Le connecteur',
        texte:
          'however, therefore, moreover, nevertheless : ils changent le sens de la phrase suivante. Un mauvais connecteur est l’erreur la plus fréquente ici.',
      },
    ],
    strategie:
      'Seize questions, souvent négligées entre la Part 5 et la Part 7. Le rapport effort / points y est pourtant très bon.',
  },
  {
    part: 'p7',
    numero: 7,
    section: 'reading',
    libelle: 'Compréhension écrite',
    questions: 54,
    enjeu:
      'Trouver une information dans un ou plusieurs documents : courriels, annonces, articles, formulaires.',
    methode: [
      'Lis la question, puis cherche dans le texte. Jamais l’inverse : lire intégralement un document de la Part 7 coûte le double du temps disponible.',
      'Repère la structure du document avant de chercher : expéditeur, destinataire, date, objet. Beaucoup de questions ne demandent que cela.',
      'Pour les documents multiples, la question qui croise deux textes est signalée par un détail présent dans un seul des deux. Repère lequel.',
      'Sur une question NOT / EXCEPT, vérifie les quatre propositions dans le texte — c’est plus long, et il n’y a pas de raccourci.',
    ],
    pieges: [
      {
        titre: 'La reformulation',
        texte:
          'La bonne réponse ne reprend presque jamais les mots du texte. Une proposition qui recopie une phrase entière est souvent le leurre.',
      },
      {
        titre: 'Le temps mangé en amont',
        texte:
          'Arriver à la Part 7 avec dix minutes fait perdre vingt questions qui étaient faisables. Le vrai risque de la partie Reading est là, pas dans sa difficulté.',
      },
    ],
    strategie:
      'Cinquante-quatre questions, plus de la moitié du Reading. Réserve-lui au moins 45 des 75 minutes, et remplis toutes les cases avant la fin, même au hasard.',
  },
]

export const REGLES_GENERALES_TOEIC: Array<{ titre: string; texte: string }> = [
  {
    titre: 'Aucune case vide, jamais',
    texte:
      'Le TOEIC ne retire aucun point pour une mauvaise réponse. Une case vide vaut zéro, une case cochée au hasard vaut un quart de point en espérance. Laisser une case vide est la seule faute impardonnable de l’épreuve — et c’est l’exact opposé du TAGE MAGE, où une mauvaise réponse coûte un point.',
  },
  {
    titre: 'Le Listening ne se rattrape pas',
    texte:
      'L’audio ne passe qu’une fois et la cadence est imposée. On ne revient pas en arrière : une question ratée est perdue, et la seule chose à sauver est le rythme pour les suivantes.',
  },
  {
    titre: 'Le Reading se gère comme un budget',
    texte:
      '75 minutes pour 100 questions, mais 54 d’entre elles sont en Part 7. Un rythme viable : 10 minutes pour la Part 5, 10 pour la Part 6, 45 pour la Part 7, 10 de marge.',
  },
  {
    titre: 'Le score est une échelle, pas un pourcentage',
    texte:
      'Chaque section va de 5 à 495 points, pour un total de 10 à 990. La conversion n’est pas linéaire et varie d’une session à l’autre : compte en questions justes, pas en points estimés.',
  },
  {
    titre: 'Ce qui se travaille en quelques semaines',
    texte:
      'Les gestes — lire les questions à l’avance, gérer le budget de temps, ne jamais laisser de case vide — se prennent en quelques séances et rapportent immédiatement. Le vocabulaire, lui, se construit par petites doses répétées, pas par bourrage la veille.',
  },
]
