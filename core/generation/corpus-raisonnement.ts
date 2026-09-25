/**
 * Corpus de l'argumentation.
 *
 * Chaque scénario déclare la faille de raisonnement qu'il porte. Ce n'est pas
 * une étiquette décorative : c'est elle qui rend calculables les quatre
 * questions qu'on peut poser sur un argument — l'affaiblir, le renforcer,
 * nommer son présupposé, nommer son défaut. Un scénario dont la faille serait
 * mal déclarée produirait quatre questions fausses d'un coup.
 *
 * Les leurres, eux, sont les remèdes des AUTRES failles du catalogue : des
 * phrases sensées, applicables à un argument voisin, et fausses pour celui-ci.
 */

export interface Contexte {
  sujet: string
  mesure: string
  effet: string
  groupe: string
}

export interface Faille {
  id: string
  /** Nom du défaut, tel qu'il apparaîtra parmi les propositions. */
  nom: string
  affaiblit: (c: Contexte) => string
  renforce: (c: Contexte) => string
  presuppose: (c: Contexte) => string
}

export const FAILLES: Faille[] = [
  {
    id: 'causalite',
    nom: 'prendre une coïncidence dans le temps pour une relation de cause à effet',
    affaiblit: (c) => `Un autre changement important est intervenu au même moment que ${c.mesure}.`,
    renforce: (c) => `Là où ${c.mesure} fait défaut, ${c.effet} n’a pas évolué.`,
    presuppose: (c) => `Aucun autre facteur n’a agi sur ${c.effet} pendant la période observée.`,
  },
  {
    id: 'echantillon',
    nom: 'généraliser à partir d’un groupe qui ne représente pas l’ensemble',
    affaiblit: (c) => `${c.groupe} ne ressemble en rien à l’ensemble de la population concernée.`,
    renforce: (c) => `${c.groupe} a été constitué par tirage au sort dans l’ensemble de la population.`,
    presuppose: (c) => `${c.groupe} se comporte comme l’ensemble de la population concernée.`,
  },
  {
    id: 'faux_dilemme',
    nom: 'réduire la question à deux possibilités alors qu’il en existe d’autres',
    affaiblit: () => `Une troisième solution, ignorée par l’argument, obtient de meilleurs résultats.`,
    renforce: () => `Toutes les autres possibilités envisageables ont été testées puis écartées.`,
    presuppose: () => `Il n’existe aucune autre possibilité que les deux mentionnées.`,
  },
  {
    id: 'autorite',
    nom: 'faire reposer la conclusion sur la seule notoriété de qui l’affirme',
    affaiblit: () => `La personne citée n’a aucune compétence dans le domaine dont il est question.`,
    renforce: () => `Les travaux publiés sur la question aboutissent tous à la même conclusion.`,
    presuppose: () => `Ce que soutient une personne réputée est vrai hors de son domaine comme dedans.`,
  },
  {
    id: 'inversion',
    nom: 'confondre la cause et la conséquence',
    affaiblit: (c) => `${c.effet} précédait ${c.mesure} et pourrait en être la cause.`,
    renforce: (c) => `${c.mesure} a précédé toute évolution de ${c.effet}.`,
    presuppose: (c) => `${c.mesure} précède bien l’évolution de ${c.effet}.`,
  },
  {
    id: 'moyenne',
    nom: 'tirer d’une moyenne une conclusion sur chaque cas particulier',
    affaiblit: () => `La moyenne invoquée recouvre des situations extrêmement dispersées.`,
    renforce: () => `Les valeurs relevées sont toutes très proches de la moyenne.`,
    presuppose: () => `Chaque cas particulier se comporte comme la moyenne de l’ensemble.`,
  },
  {
    id: 'survie',
    nom: 'ne regarder que les cas qui ont réussi, en ignorant ceux qui ont échoué',
    affaiblit: () => `Les cas ayant échoué n’ont pas été comptabilisés dans l’observation.`,
    renforce: () => `Réussites et échecs ont été suivis dans les mêmes conditions.`,
    presuppose: () => `Les cas observés sont représentatifs, réussites comme échecs.`,
  },
  {
    id: 'petition',
    nom: 'poser dans les prémisses ce que la conclusion devait établir',
    affaiblit: () => `La prémisse invoquée est précisément ce que l’argument prétend démontrer.`,
    renforce: () => `La prémisse est établie par des observations indépendantes de la conclusion.`,
    presuppose: () => `Ce qui est affirmé au départ est vrai sans avoir à être démontré.`,
  },
]

export interface Scenario {
  faille: string
  contexte: Contexte
  texte: (c: Contexte) => string
}

export const SCENARIOS: Scenario[] = [
  /* ------------------------------------------------------- causalité -- */
  {
    faille: 'causalite',
    contexte: { sujet: 'la ville de Varennes', mesure: 'la limitation de vitesse à 30 km/h', effet: 'le nombre d’accidents', groupe: 'l’échantillon de conducteurs interrogés' },
    texte: (c) => `Depuis que ${c.sujet} a instauré ${c.mesure}, ${c.effet} a baissé d’un tiers. ${c.mesure} est donc efficace pour réduire ${c.effet}.`,
  },
  {
    faille: 'causalite',
    contexte: { sujet: 'cette entreprise', mesure: 'la semaine de quatre jours', effet: 'le taux d’absentéisme', groupe: 'le groupe de salariés volontaires' },
    texte: (c) => `${c.sujet} a adopté ${c.mesure} l’an dernier ; ${c.effet} a chuté depuis. Il faut donc généraliser ${c.mesure} pour faire baisser ${c.effet}.`,
  },
  {
    faille: 'causalite',
    contexte: { sujet: 'ce quartier', mesure: 'l’ouverture de la médiathèque', effet: 'la fréquentation des commerces', groupe: 'le panel de riverains' },
    texte: (c) => `${c.effet} de ${c.sujet} a augmenté l’année de ${c.mesure}. ${c.mesure} a donc relancé le commerce local.`,
  },
  {
    faille: 'causalite',
    contexte: { sujet: 'ce service hospitalier', mesure: 'le nouveau protocole d’accueil', effet: 'la durée moyenne d’attente', groupe: 'l’échantillon de patients reçus' },
    texte: (c) => `${c.effet} a diminué de moitié depuis ${c.mesure}. ${c.mesure} est donc la cause de cette amélioration.`,
  },

  /* ----------------------------------------------------- échantillon -- */
  {
    faille: 'echantillon',
    contexte: { sujet: 'un institut de sondage', mesure: 'l’enquête menée en centre-ville', effet: 'l’opinion des habitants', groupe: 'le panel interrogé' },
    texte: (c) => `${c.mesure} montre que sept personnes sur dix soutiennent le projet. On peut donc affirmer que ${c.effet} y est favorable.`,
  },
  {
    faille: 'echantillon',
    contexte: { sujet: 'une école de commerce', mesure: 'l’enquête auprès des anciens élèves', effet: 'la valeur du diplôme', groupe: 'l’ensemble des diplômés ayant répondu' },
    texte: (c) => `${c.mesure} révèle un salaire médian très élevé. ${c.effet} est donc démontrée.`,
  },
  {
    faille: 'echantillon',
    contexte: { sujet: 'une plateforme de vente', mesure: 'l’analyse des avis publiés', effet: 'la satisfaction des acheteurs', groupe: 'l’ensemble des clients ayant laissé un avis' },
    texte: (c) => `${c.mesure} donne une note moyenne de 4,6 sur 5. ${c.effet} est donc très élevée.`,
  },
  {
    faille: 'echantillon',
    contexte: { sujet: 'une chaîne de magasins', mesure: 'l’essai mené dans le magasin pilote', effet: 'l’effet du nouvel agencement', groupe: 'le magasin retenu pour l’essai' },
    texte: (c) => `${c.mesure} a fait progresser les ventes de 12 %. Il faut donc généraliser l’agencement à tout le réseau.`,
  },

  /* ---------------------------------------------------- faux dilemme -- */
  {
    faille: 'faux_dilemme',
    contexte: { sujet: 'la commune', mesure: 'la fermeture de la piscine', effet: 'l’équilibre du budget', groupe: 'le public des usagers' },
    texte: (c) => `Ou bien ${c.sujet} augmente les impôts, ou bien elle procède à ${c.mesure}. Comme personne ne veut d’une hausse d’impôts, ${c.mesure} s’impose.`,
  },
  {
    faille: 'faux_dilemme',
    contexte: { sujet: 'l’équipe', mesure: 'le report du projet', effet: 'la qualité du livrable', groupe: 'l’équipe de développement' },
    texte: (c) => `Soit nous livrons à la date prévue en réduisant les tests, soit nous acceptons ${c.mesure}. Livrer sans tests étant exclu, ${c.mesure} est la seule issue.`,
  },
  {
    faille: 'faux_dilemme',
    contexte: { sujet: 'l’université', mesure: 'la sélection à l’entrée', effet: 'le taux de réussite', groupe: 'la promotion étudiée' },
    texte: (c) => `Ou bien ${c.sujet} instaure ${c.mesure}, ou bien elle accepte que ${c.effet} continue de baisser. Cette baisse étant inacceptable, ${c.mesure} est indispensable.`,
  },
  {
    faille: 'faux_dilemme',
    contexte: { sujet: 'la direction', mesure: 'la fermeture du site secondaire', effet: 'la rentabilité du groupe', groupe: 'le personnel concerné' },
    texte: (c) => `Nous devons choisir : baisser les salaires, ou procéder à ${c.mesure}. Une baisse des salaires étant impossible, ${c.mesure} est la seule voie.`,
  },

  /* -------------------------------------------------------- autorité -- */
  {
    faille: 'autorite',
    contexte: { sujet: 'un économiste renommé', mesure: 'la réforme proposée', effet: 'la croissance', groupe: 'le comité d’experts consulté' },
    texte: (c) => `${c.sujet}, lauréat de nombreuses distinctions, affirme que ${c.mesure} relancera ${c.effet}. ${c.mesure} doit donc être adoptée.`,
  },
  {
    faille: 'autorite',
    contexte: { sujet: 'un acteur très populaire', mesure: 'ce complément alimentaire', effet: 'la qualité du sommeil', groupe: 'le panel de consommateurs' },
    texte: (c) => `${c.sujet} déclare que ${c.mesure} a transformé ${c.effet}. ${c.mesure} est donc efficace.`,
  },
  {
    faille: 'autorite',
    contexte: { sujet: 'le fondateur de l’entreprise', mesure: 'cette méthode de gestion', effet: 'la productivité des équipes', groupe: 'l’échantillon de cadres interrogés' },
    texte: (c) => `${c.sujet}, dont la réussite est incontestable, soutient que ${c.mesure} améliore ${c.effet}. Il faut donc l’appliquer partout.`,
  },
  {
    faille: 'autorite',
    contexte: { sujet: 'un physicien de renom', mesure: 'cette réforme scolaire', effet: 'le niveau des élèves', groupe: 'le corps enseignant' },
    texte: (c) => `${c.sujet} estime que ${c.mesure} relèvera ${c.effet}. Son autorité scientifique suffit à emporter la conviction.`,
  },

  /* ------------------------------------------------------- inversion -- */
  {
    faille: 'inversion',
    contexte: { sujet: 'cette région', mesure: 'l’implantation de nouvelles entreprises', effet: 'la hausse du niveau de vie', groupe: 'l’ensemble des communes étudiées' },
    texte: (c) => `Dans ${c.sujet}, ${c.mesure} s’accompagne systématiquement de ${c.effet}. C’est donc ${c.mesure} qui produit ${c.effet}.`,
  },
  {
    faille: 'inversion',
    contexte: { sujet: 'les grandes villes', mesure: 'l’ouverture de salles de sport', effet: 'la pratique sportive des habitants', groupe: 'l’ensemble des villes observées' },
    texte: (c) => `Dans ${c.sujet}, ${c.mesure} va de pair avec ${c.effet}. Ouvrir des salles fait donc pratiquer le sport.`,
  },
  {
    faille: 'inversion',
    contexte: { sujet: 'les entreprises du secteur', mesure: 'l’investissement en formation', effet: 'la bonne santé financière', groupe: 'l’ensemble des sociétés étudiées' },
    texte: (c) => `${c.sujet} qui forment le plus se portent le mieux. ${c.mesure} est donc la cause de ${c.effet}.`,
  },
  {
    faille: 'inversion',
    contexte: { sujet: 'ce dispositif de soutien scolaire', mesure: 'l’inscription au soutien', effet: 'la difficulté scolaire', groupe: 'le groupe d’élèves suivis' },
    texte: () => `Les élèves inscrits au soutien scolaire obtiennent de moins bons résultats que les autres. Le soutien aggrave donc les difficultés.`,
  },

  /* --------------------------------------------------------- moyenne -- */
  {
    faille: 'moyenne',
    contexte: { sujet: 'ce lycée', mesure: 'la nouvelle méthode d’enseignement', effet: 'le niveau des élèves', groupe: 'l’ensemble des classes concernées' },
    texte: (c) => `La moyenne générale de ${c.sujet} a progressé de deux points après ${c.mesure}. Chaque élève a donc bénéficié de ${c.mesure}.`,
  },
  {
    faille: 'moyenne',
    contexte: { sujet: 'cette région', mesure: 'la revalorisation des salaires', effet: 'le pouvoir d’achat', groupe: 'l’ensemble des ménages' },
    texte: (c) => `Le revenu moyen de ${c.sujet} a augmenté après ${c.mesure}. ${c.effet} de chaque ménage s’est donc amélioré.`,
  },
  {
    faille: 'moyenne',
    contexte: { sujet: 'ce service client', mesure: 'la nouvelle organisation', effet: 'le temps de réponse', groupe: 'l’ensemble des demandes traitées' },
    texte: (c) => `${c.effet} moyen est passé sous les deux heures grâce à ${c.mesure}. Aucun client n’attend donc plus de deux heures.`,
  },
  {
    faille: 'moyenne',
    contexte: { sujet: 'cette promotion', mesure: 'le nouveau programme', effet: 'la note obtenue', groupe: 'la promotion concernée' },
    texte: (c) => `La moyenne de ${c.sujet} dépasse celle de l’an dernier depuis ${c.mesure}. Chaque étudiant a donc mieux réussi que ses aînés.`,
  },

  /* ---------------------------------------------------------- survie -- */
  {
    faille: 'survie',
    contexte: { sujet: 'les créateurs d’entreprise', mesure: 'l’abandon des études', effet: 'la réussite professionnelle', groupe: 'l’échantillon de dirigeants interrogés' },
    texte: (c) => `Plusieurs dirigeants célèbres ont connu ${c.mesure} avant de réussir. ${c.mesure} favorise donc ${c.effet}.`,
  },
  {
    faille: 'survie',
    contexte: { sujet: 'les sportifs de haut niveau', mesure: 'cet entraînement intensif', effet: 'la performance', groupe: 'le groupe d’athlètes médaillés' },
    texte: (c) => `Tous les médaillés interrogés suivent ${c.mesure}. ${c.mesure} améliore donc ${c.effet}.`,
  },
  {
    faille: 'survie',
    contexte: { sujet: 'les bâtiments anciens', mesure: 'la construction en pierre', effet: 'la solidité', groupe: 'l’ensemble des édifices encore debout' },
    texte: (c) => `Les bâtiments du siècle dernier encore debout sont presque tous en pierre. ${c.mesure} garantit donc ${c.effet}.`,
  },
  {
    faille: 'survie',
    contexte: { sujet: 'les fonds d’investissement', mesure: 'cette stratégie de placement', effet: 'le rendement', groupe: 'l’ensemble des fonds encore en activité' },
    texte: (c) => `Les fonds encore ouverts aujourd’hui affichent un rendement remarquable avec ${c.mesure}. ${c.mesure} assure donc ${c.effet}.`,
  },

  /* -------------------------------------------------------- pétition -- */
  {
    faille: 'petition',
    contexte: { sujet: 'ce texte', mesure: 'la nouvelle réglementation', effet: 'la sécurité des usagers', groupe: 'le public concerné' },
    texte: (c) => `${c.mesure} est nécessaire, puisque sans elle ${c.effet} ne serait pas assurée. Or ${c.effet} ne peut être assurée que par ${c.mesure}.`,
  },
  {
    faille: 'petition',
    contexte: { sujet: 'ce classement', mesure: 'la méthode de notation retenue', effet: 'la fiabilité du classement', groupe: 'l’ensemble des établissements notés' },
    texte: (c) => `${c.effet} est assurée, car ${c.mesure} est la meilleure. Et elle est la meilleure parce qu’elle produit un classement fiable.`,
  },
  {
    faille: 'petition',
    contexte: { sujet: 'ce témoignage', mesure: 'la parole du témoin', effet: 'la véracité des faits', groupe: 'le groupe de personnes entendues' },
    texte: (c) => `${c.mesure} est digne de foi, puisque les faits qu’elle rapporte sont exacts. Or nous savons qu’ils sont exacts parce que le témoin les rapporte.`,
  },
  {
    faille: 'petition',
    contexte: { sujet: 'ce règlement', mesure: 'l’interdiction décidée', effet: 'le respect de la règle', groupe: 'le public des usagers' },
    texte: (c) => `${c.mesure} est légitime, car elle interdit une pratique illégitime. Et cette pratique est illégitime puisqu’elle est interdite.`,
  },
]
