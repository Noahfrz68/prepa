import type { Lecon } from './types'

/**
 * Sous-test 1 — Compréhension de textes.
 *
 * Le sous-test le plus lent à progresser, et celui où la méthode compte le
 * plus : la question n'est jamais « qu'en penses-tu » mais « qu'est-ce qui est
 * écrit ». Les six leçons correspondent aux six types de questions, parce que
 * chacun se traite autrement — et que confondre un détail explicite avec une
 * inférence fait perdre le point sans qu'on comprenne pourquoi.
 */
export const LECONS_COMPREHENSION: Lecon[] = [
  {
    skillId: 'tm.comprehension.idee_principale',
    section: 'comprehension',
    retrouver: [
      { q: 'Que fait-on avant de lire les propositions ?', r: 'On formule soi-même la thèse en une phrase.' },
      { q: 'Différence entre le sujet et la thèse ?', r: 'Le sujet est ce dont on parle ; la thèse est ce qu’on en dit.' },
      {
        q: 'Comment repère-t-on une proposition trop étroite ?',
        r: 'Un paragraphe entier du texte n’y entre pas. Trop large : elle vaudrait pour n’importe quel texte du même sujet.',
      },
    ],
    aToi: {
      enonce:
        'Un texte montre que le télétravail réduit les trajets, puis que ce gain est annulé par ' +
        'les déplacements de loisir qu’il rend possibles, et conclut que le bilan dépend des ' +
        'politiques de transport. Quelle idée principale ?',
      indice: 'La bonne réponse doit couvrir les trois mouvements, pas seulement le premier.',
      reponse:
        '« L’effet du télétravail sur les déplacements n’est pas acquis : il dépend de ce qui ' +
        'l’accompagne. » Les leurres seraient « le télétravail réduit les trajets » (le premier ' +
        'paragraphe seul) et « le télétravail est inutile » (plus fort que le texte).',
    },
    titre: 'Idée principale',
    quoi: 'Dire ce que le texte défend dans son ensemble, en une phrase.',
    regles: [
      {
        titre: 'Résumer AVANT de lire les propositions',
        texte:
          'Formuler soi-même la thèse en une phrase, puis chercher celle qui s’en rapproche. ' +
          'Lire les propositions d’abord, c’est se laisser convaincre par la première qui reprend ' +
          'les mots du texte.',
      },
      {
        titre: 'Où se trouve la thèse',
        texte:
          'Le plus souvent en fin de premier paragraphe ou en début de dernier. Un texte ' +
          'argumentatif annonce, développe, puis conclut — la thèse se lit aux deux extrémités.',
      },
      {
        titre: 'Le bon calibre',
        texte:
          'Une idée principale couvre TOUT le texte sans le dépasser. Trop étroite, elle ne parle ' +
          'que d’un paragraphe ; trop large, elle vaudrait pour n’importe quel texte du même sujet. ' +
          'Les deux erreurs figurent toujours parmi les propositions.',
      },
      {
        titre: 'Distinguer le sujet et la thèse',
        texte:
          'Le SUJET est ce dont on parle (« le principe de précaution ») ; la THÈSE est ce qu’on ' +
          'en dit (« il est critiqué à tort, mais mal appliqué »). Une proposition qui n’énonce ' +
          'que le sujet est un leurre.',
      },
      {
        titre: 'Le test du paragraphe orphelin',
        texte:
          'Si un paragraphe entier du texte n’entre pas dans la proposition retenue, elle est ' +
          'trop étroite. Vérifier que chaque partie du texte y trouve sa place.',
      },
    ],
    exemple: {
      enonce:
        'Un texte expose la critique d’immobilisme adressée au principe de précaution, la juge ' +
        'infondée, puis reproche à ce principe son application sélective. Quelle est l’idée principale ?',
      etapes: [
        'Résumé personnel : la critique habituelle est fausse, mais il y en a une autre, plus juste.',
        'Une proposition qui dit seulement « le principe est critiqué » ne couvre que le début.',
        'Une proposition qui dit « le principe doit être abrogé » dépasse le texte, qui dit ' +
          'l’inverse.',
      ],
      reponse:
        'La proposition qui contient les DEUX mouvements : le rejet de la critique courante, ' +
        'et la formulation d’une critique différente.',
    },
    piege:
      'Prendre un argument pour la thèse. Un paragraphe frappant reste un paragraphe : l’idée ' +
      'principale doit rendre compte de l’ensemble.',
  },

  {
    skillId: 'tm.comprehension.detail_explicite',
    section: 'comprehension',
    retrouver: [
      { q: 'Quel est le seul critère ?', r: 'Est-ce ÉCRIT — jamais « est-ce vrai ». On doit pouvoir pointer la ligne.' },
      {
        q: 'Le texte dit « souvent », la proposition dit « toujours ». Verdict ?',
        r: 'Fausse. Un durcissement de quantificateur suffit à écarter une proposition.',
      },
      {
        q: 'Une proposition à deux membres dont un seul est exact ?',
        r: 'Fausse. On vérifie chaque proposition sur TOUTE sa longueur.',
      },
    ],
    aToi: {
      enonce:
        'Le texte dit : « Les subventions ont surtout profité aux exploitations moyennes, les plus ' +
        'petites restant souvent hors des dispositifs. » Laquelle est conforme ? ' +
        '(a) Les petites exploitations sont exclues des subventions. ' +
        '(b) Les exploitations moyennes ont été les principales bénéficiaires.',
      indice: 'Compare mot à mot les quantificateurs du texte et ceux des propositions.',
      reponse:
        '(b). Le texte dit « surtout », que « principales » reprend fidèlement. ' +
        '(a) transforme « souvent hors des dispositifs » en exclusion générale : c’est un ' +
        'durcissement, et il suffit à la rendre fausse.',
    },
    titre: 'Détail explicite',
    quoi: 'Retrouver une information écrite dans le texte. Le type le plus fréquent du sous-test.',
    regles: [
      {
        titre: 'La réponse est ÉCRITE quelque part',
        texte:
          'On doit pouvoir pointer la ligne. Si l’on doit raisonner pour arriver à la proposition, ' +
          'ce n’est pas la bonne — ou ce n’est pas une question de détail.',
      },
      {
        titre: 'Repérer le mot-clé de la question',
        texte:
          'Un nom propre, un chiffre, un terme technique : on le cherche dans le texte, et on lit ' +
          'les deux phrases autour. Cela évite de relire le passage entier.',
      },
      {
        titre: 'Le critère n’est jamais « est-ce vrai »',
        texte:
          'Une proposition peut être exacte dans le monde et absente du texte. Le seul critère ' +
          'est : est-ce ÉCRIT ? C’est le leurre le plus efficace du sous-test, parce qu’il ' +
          'mobilise ce qu’on sait déjà.',
      },
      {
        titre: 'Vérifier la proposition sur TOUTE sa longueur',
        texte:
          'Une proposition à deux membres dont un seul est exact est fausse. Les leurres sont ' +
          'souvent construits ainsi : une moitié recopiée du texte, une moitié inventée.',
      },
      {
        titre: 'Attention aux quantificateurs',
        texte:
          'Le texte dit « souvent », la proposition dit « toujours » ; le texte dit « certains », ' +
          'la proposition dit « tous ». Un durcissement suffit à rendre la proposition fausse.',
      },
    ],
    exemple: {
      enonce:
        'Le texte indique que « les dispositifs de proximité sont lents et coûteux, mais efficaces ' +
        'auprès des personnes les plus initialement défavorables ». Quelle proposition est conforme ?',
      etapes: [
        'Repérer les trois affirmations : lents, coûteux, efficaces sur un public précis.',
        'Écarter « les dispositifs de proximité sont efficaces sur tous les publics » : le texte ' +
          'restreint.',
        'Écarter « les dispositifs de proximité sont peu coûteux » : le texte dit le contraire.',
      ],
      reponse:
        'La proposition qui reprend la restriction du texte, pas celle qui l’élargit.',
    },
    piege:
      'Répondre de mémoire après une seule lecture. Sur une question de détail, on retourne au ' +
      'texte — toujours. C’est vingt secondes contre un point.',
  },

  {
    skillId: 'tm.comprehension.inference',
    section: 'comprehension',
    retrouver: [
      { q: 'Une inférence est-elle plausible ou obligatoire ?', r: 'Obligatoire. S’il existe un cas où le texte est vrai et la proposition fausse, elle ne suit pas.' },
      { q: 'Quel est le principal ennemi ici ?', r: 'Ce qu’on sait déjà du monde : il fait accepter des conclusions que le texte ne porte pas.' },
      {
        q: 'Le texte dit « sans financement, aucun projet n’aboutit ». Ce projet a abouti. Alors ?',
        r: 'Il a été financé — c’est la contraposée. La réciproque, elle, ne suit pas.',
      },
    ],
    aToi: {
      enonce:
        'Le texte dit : « Aucune réforme n’a réussi sans l’accord des collectivités locales. » ' +
        'Que peut-on déduire d’une réforme qui a réussi ?',
      indice: 'Récris la phrase sous la forme « si… alors… », puis prends la contraposée.',
      reponse:
        'Qu’elle a eu l’accord des collectivités. C’est la seule déduction autorisée. ' +
        'Croire qu’une réforme ayant cet accord réussira est la réciproque : elle ne suit pas, ' +
        'l’accord est nécessaire mais rien ne dit qu’il suffise.',
    },
    titre: 'Inférence',
    quoi: 'Tirer ce que le texte implique nécessairement, sans le dire.',
    regles: [
      {
        titre: 'Une inférence est OBLIGATOIRE, pas plausible',
        texte:
          'On ne cherche pas ce qui est vraisemblable : on cherche ce qui découle forcément de ce ' +
          'qui est écrit. Si l’on peut imaginer un cas où le texte est vrai et la proposition ' +
          'fausse, elle ne suit pas.',
      },
      {
        titre: 'Le pas doit être court',
        texte:
          'Une bonne inférence est à un pas du texte, pas à trois. Les propositions qui demandent ' +
          'une chaîne de déductions sont presque toujours des leurres.',
      },
      {
        titre: 'Se méfier de ce qu’on sait déjà',
        texte:
          'La connaissance du monde est le principal ennemi ici : elle fait accepter des ' +
          'conclusions que le texte ne porte pas. On raisonne À PARTIR du texte seul.',
      },
      {
        titre: 'Les mots qui signalent une inférence',
        texte:
          '« On peut déduire », « le texte suggère », « cela implique », « l’auteur laisse ' +
          'entendre ». Ils indiquent qu’on n’aura pas la phrase toute faite dans le texte.',
      },
      {
        titre: 'La contraposée s’applique aussi ici',
        texte:
          'Si le texte dit « sans financement, aucun projet n’aboutit », alors « ce projet a ' +
          'abouti » implique qu’il a été financé. C’est la seule déduction autorisée — la ' +
          'réciproque ne l’est pas.',
      },
    ],
    exemple: {
      enonce:
        'Le texte dit : « L’anonymat urbain fonctionne comme une ressource, mais il n’est pas ' +
        'distribué également : certains habitants en jouissent, d’autres le subissent. » ' +
        'Que peut-on en déduire ?',
      etapes: [
        'Ce qui est écrit : l’anonymat est une ressource, et sa distribution est inégale.',
        'Déduction à un pas : tous les habitants ne bénéficient pas également de la vie urbaine ' +
          'sur ce point.',
        'Déduction abusive : « la ville est injuste » — le texte ne porte pas ce jugement.',
      ],
      reponse:
        'L’inégale répartition d’un même avantage. Tout ce qui ajoute un jugement moral dépasse ' +
        'le texte.',
    },
    piege:
      'Confondre inférence et opinion raisonnable. La question n’est pas « est-ce sensé » mais ' +
      '« est-ce forcé par le texte ».',
  },

  {
    skillId: 'tm.comprehension.ton_et_intention_de_l_auteur',
    section: 'comprehension',
    retrouver: [
      {
        q: 'Quel est le piège central de ce type de question ?',
        r: 'Prêter à l’auteur la thèse qu’il RAPPORTE avant de la réfuter.',
      },
      { q: 'Après « certes… mais… », où est la position de l’auteur ?', r: 'Dans ce qui suit le « mais ». La concession n’est pas sa thèse.' },
      {
        q: 'Cite les quatre familles de leurres.',
        r: 'Inverser la conclusion, absolutiser un propos nuancé, attribuer la thèse rapportée, prêter une neutralité que le vocabulaire dément.',
      },
    ],
    aToi: {
      enonce:
        'Un auteur écrit : « On répète que la voiture individuelle serait condamnée. L’argument ' +
        'flatte, mais il ignore les territoires où aucune alternative n’existe. » Quelle position ?',
      indice: 'Repère qui parle dans la première phrase, et ce que « flatte » révèle.',
      reponse:
        'Il conteste la thèse qu’il rapporte — sans défendre la voiture pour autant : il objecte ' +
        'que l’argument néglige certains territoires. « Il annonce la fin de la voiture » serait ' +
        'l’attribution croisée ; « il défend la voiture individuelle » serait l’inversion.',
    },
    titre: 'Ton et intention de l’auteur',
    quoi: 'Dire quelle position l’auteur adopte, et sur quel registre il écrit.',
    regles: [
      {
        titre: 'Distinguer ce qu’il DIT de ce qu’il RAPPORTE',
        texte:
          'Un auteur expose souvent la thèse qu’il combat avant de la réfuter. Prêter à l’auteur ' +
          'ce qu’il cite est le piège central de ce type de question. Repérer « on prétend que », ' +
          '« selon ses détracteurs », « l’argument habituel est ».',
      },
      {
        titre: 'Le vocabulaire évaluatif trahit la position',
        texte:
          '« Commode », « contresens », « prétendu », « à juste titre », « heureusement » : ' +
          'ces mots ne décrivent pas, ils jugent. Deux ou trois suffisent à établir que l’auteur ' +
          'prend parti.',
      },
      {
        titre: 'Le mouvement du texte donne la position finale',
        texte:
          'Concession puis objection : la position de l’auteur est dans l’objection. ' +
          '« Certes… mais… » — c’est ce qui suit le « mais » qui compte.',
      },
      {
        titre: 'Les registres possibles',
        texte:
          'Neutre et descriptif · critique · ironique · nuancé (il adopte puis limite) · ' +
          'engagé. La neutralité est rare : si l’auteur emploie des mots évaluatifs, ' +
          'la proposition « il ne prend pas parti » est fausse.',
      },
      {
        titre: 'Les quatre familles de leurres',
        texte:
          'Inverser la conclusion · absolutiser un propos nuancé · attribuer à l’auteur la thèse ' +
          'qu’il rapporte · lui prêter une neutralité que son vocabulaire dément. Les reconnaître ' +
          'permet d’en écarter deux ou trois immédiatement.',
      },
    ],
    exemple: {
      enonce:
        'Un auteur écrit : « L’accusation est commode, mais elle repose sur un contresens. » ' +
        'Plus loin : « La critique pertinente ne porte pas sur le principe, mais sur son usage. » ' +
        'Quelle est sa position ?',
      etapes: [
        'Premier mouvement : il écarte la critique courante (« contresens »).',
        'Second mouvement : il en formule une autre (« son usage »).',
        'Sa position n’est ni la défense inconditionnelle ni la condamnation : c’est un déplacement ' +
          'de la critique.',
      ],
      reponse:
        'Il écarte la critique habituelle et lui en substitue une autre. « Il le défend sans ' +
        'réserve » et « il en réclame l’abrogation » sont les deux inversions attendues.',
    },
    piege:
      'Prendre le paragraphe d’exposition pour la thèse de l’auteur. Ce qu’il présente au début ' +
      'est souvent ce qu’il va démonter.',
  },

  {
    skillId: 'tm.comprehension.structure_argumentative',
    section: 'comprehension',
    retrouver: [
      { q: 'On répond par quoi à « quel est le rôle de ce paragraphe » ?', r: 'Un verbe d’action : il illustre, il nuance, il objecte, il conclut. Jamais par un résumé.' },
      { q: 'Que signalent « or », « pourtant », « toutefois » ?', r: 'Un retournement. « Ainsi », « par exemple » : une illustration. « Certes » : une concession à venir.' },
      { q: 'Un exemple prouve-t-il ?', r: 'Non, il illustre. Les propositions qui en font une preuve sont des leurres.' },
    ],
    aToi: {
      enonce:
        'Après avoir défendu une mesure, l’auteur écrit : « On objectera que son coût est élevé. ' +
        'C’est exact, mais ce coût se compare à celui de l’inaction. » Quel est le rôle de ce passage ?',
      indice: 'Deux mouvements en deux phrases. Nomme-les l’un après l’autre.',
      reponse:
        'Il anticipe une objection puis y répond — une concession suivie d’une réfutation. ' +
        'Ce n’est ni une illustration ni un changement de thèse : l’auteur renforce sa position ' +
        'en désamorçant la critique la plus prévisible.',
    },
    titre: 'Structure argumentative',
    quoi: 'Comprendre comment le texte est construit, indépendamment de ce qu’il dit.',
    regles: [
      {
        titre: 'La question porte sur la FONCTION, pas le contenu',
        texte:
          '« Que montre cet exemple ? », « quel est le rôle de ce paragraphe ? » : on répond par ' +
          'un verbe d’action — il illustre, il nuance, il objecte, il conclut — et non par un résumé.',
      },
      {
        titre: 'Les cinq fonctions les plus fréquentes',
        texte:
          'Illustrer une thèse par un cas · Objecter puis répondre à l’objection · Nuancer une ' +
          'affirmation trop générale · Établir un contraste entre deux situations · Tirer une ' +
          'conclusion pratique.',
      },
      {
        titre: 'Les connecteurs sont la carte du texte',
        texte:
          '« Or », « pourtant », « toutefois » signalent un retournement. « Ainsi », « par ' +
          'exemple » une illustration. « Certes » une concession qui sera suivie d’un « mais ». ' +
          'Les entourer à la lecture donne le plan.',
      },
      {
        titre: 'Le plan type d’un texte de concours',
        texte:
          'Constat ou thèse courante · objection ou nuance · exemple · déplacement du problème · ' +
          'conclusion. Reconnaître ce squelette permet de situer n’importe quel paragraphe.',
      },
      {
        titre: 'Un exemple ne prouve pas, il illustre',
        texte:
          'Quand la question porte sur le rôle d’un exemple, la réponse est presque toujours ' +
          '« montrer concrètement » et presque jamais « démontrer ». Les propositions qui font ' +
          'de l’exemple une preuve sont des leurres.',
      },
    ],
    exemple: {
      enonce:
        'Après avoir affirmé que l’anonymat urbain est une ressource, l’auteur écrit : ' +
        '« L’analyse mérite toutefois d’être nuancée sur un point. » Quel est le rôle de ce passage ?',
      etapes: [
        'Le connecteur « toutefois » signale un retournement partiel.',
        '« Nuancée » dit explicitement la fonction : limiter la portée de ce qui précède.',
        'Ce n’est ni une réfutation (l’auteur garde sa thèse), ni une illustration.',
      ],
      reponse:
        'Limiter la portée de l’affirmation précédente sans l’abandonner. Répondre « réfuter la ' +
        'thèse de Simmel » serait trop fort.',
    },
    piege:
      'Résumer le contenu du paragraphe au lieu d’en donner la fonction. La question demande ' +
      'à quoi il SERT, pas ce qu’il dit.',
  },

  {
    skillId: 'tm.comprehension.vocabulaire_en_contexte',
    section: 'comprehension',
    retrouver: [
      { q: 'La question porte-t-elle sur le sens du dictionnaire ?', r: 'Non : sur le sens que le mot a ICI. Un sens exact mais absent du passage est un leurre.' },
      { q: 'Quel test tranche entre deux synonymes possibles ?', r: 'Remettre chacun à la place du mot et relire la phrase entière.' },
      {
        q: 'Où le texte donne-t-il souvent la réponse ?',
        r: 'Juste après le mot : une apposition, une reformulation ou un exemple l’explicite.',
      },
    ],
    aToi: {
      enonce:
        '« Cette politique a été menée avec une CONSTANCE que ses détracteurs eux-mêmes ' +
        'reconnaissent. » Que signifie « constance » ici ?',
      indice: 'Le mot a deux sens usuels. Lequel la phrase autorise-t-elle ?',
      reponse:
        '« Persévérance, continuité dans le temps » — une qualité de conduite. ' +
        'Le leurre est le sens mathématique ou physique (« caractère de ce qui ne varie pas »), ' +
        'exact dans l’absolu et absurde dans cette phrase.',
    },
    titre: 'Vocabulaire en contexte',
    quoi: 'Donner le sens d’un mot ou d’une expression tel que le texte l’emploie.',
    regles: [
      {
        titre: 'Le contexte prime sur le dictionnaire',
        texte:
          'La question n’est pas « que veut dire ce mot » mais « que veut-il dire ICI ». Un sens ' +
          'exact mais absent du passage est un leurre — et c’est le plus fréquent.',
      },
      {
        titre: 'Relire la phrase entière, et celle d’avant',
        texte:
          'Le sens se lit dans l’entourage immédiat. Une reprise, une opposition, un exemple qui ' +
          'suit : ce sont eux qui fixent l’acception.',
      },
      {
        titre: 'Le test du remplacement',
        texte:
          'Remettre chaque proposition à la place du mot et relire la phrase. Une seule la laisse ' +
          'intacte ; les autres changent le sens de la phrase, même si elles sont des synonymes ' +
          'possibles du mot en général.',
      },
      {
        titre: 'Les indices de sens dans le texte',
        texte:
          'Un mot difficile est souvent explicité juste après, par une apposition, une ' +
          'reformulation, ou un exemple. Le texte donne fréquemment la réponse dans la ligne ' +
          'suivante.',
      },
      {
        titre: 'Les images et les métaphores',
        texte:
          'Quand la question porte sur une expression figurée, on cherche ce qu’elle dit du sujet, ' +
          'pas ce qu’elle décrit littéralement. « L’équation a changé » ne parle pas de ' +
          'mathématiques.',
      },
    ],
    exemple: {
      enonce:
        'Le texte écrit : « Cette postérité en partie infidèle a fait de Hardin un partisan de la ' +
        'privatisation. » Que signifie « infidèle » ici ?',
      etapes: [
        'Contexte : on parle de la façon dont les lecteurs ont repris l’auteur.',
        'La phrase suivante précise que la conclusion venait des lecteurs, pas de Hardin.',
        'Test : « une postérité qui a déformé sa pensée » fonctionne ; « une postérité déloyale » ' +
          'transpose le mot sans le contexte.',
      ],
      reponse:
        'Qui a déformé la pensée d’origine. Le sens moral du mot (« déloyal ») est un leurre de ' +
        'dictionnaire.',
    },
    piege:
      'Choisir le sens le plus courant du mot. C’est presque toujours celui du leurre : si le ' +
      'sens courant convenait, la question n’aurait pas été posée.',
  },
]
