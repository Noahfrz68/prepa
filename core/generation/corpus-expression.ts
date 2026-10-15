/**
 * Corpus de l'expression.
 *
 * Contrairement au calcul ou à la logique, rien ici ne se calcule : une phrase
 * n'est correcte que parce que la langue le dit. Le corpus est donc écrit, et
 * chaque variante fautive nomme la règle qu'elle viole — pour que l'explication
 * enseigne quelque chose, et pour qu'une erreur de rédaction soit visible en
 * relecture au lieu de se cacher dans une banque de deux cents questions.
 *
 * Une seule discipline compense l'absence de calcul : la faute est toujours
 * UNIQUE et NOMMÉE. Une variante qui contiendrait deux fautes, ou une faute
 * discutable, n'a pas sa place ici.
 */

export type SkillExpression =
  | 'orthographe'
  | 'grammaire_et_conjugaison'
  | 'correction_syntaxique'

export interface VarianteFautive {
  texte: string
  /** La règle violée, telle qu'elle sera écrite dans l'explication. */
  regle: string
}

export interface PhraseSeed {
  skill: SkillExpression
  correcte: string
  variantes: VarianteFautive[]
  /** Ne teste que des pièges de règle, sans faute de frappe visible : niveau annales. */
  difficile?: boolean
}

/* ------------------------------------------------------- orthographe -- */

const ORTHOGRAPHE: PhraseSeed[] = [
  {
    skill: 'orthographe',
    correcte: "Elle s'est aperçue de son erreur dès qu'elle a relu ses notes.",
    variantes: [
      { texte: "Elle c'est aperçue de son erreur dès qu'elle a relu ses notes.", regle: "« c'est » est un présentatif ; devant un verbe pronominal il faut « s'est »." },
      { texte: "Elle s'est aperçu de son erreur dès qu'elle a relu ses notes.", regle: "Avec « s'apercevoir », le participe s'accorde avec le sujet : aperçue." },
      { texte: "Elle s'est aperçue de son erreure dès qu'elle a relu ses notes.", regle: "« erreur » ne prend pas de e final." },
      { texte: "Elle s'est aperçue de son erreur dès qu'elle à relu ses notes.", regle: "« a » est le verbe avoir ; « à » est la préposition." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Chacun apportera ses propres outils, et ces derniers resteront sur place.",
    variantes: [
      { texte: "Chacun apportera ces propres outils, et ces derniers resteront sur place.", regle: "« propre » au sens de « qui appartient à » exige un possessif : « ses propres »." },
      { texte: "Chacun apportera ses propres outils, et ses derniers resteront sur place.", regle: "« ces derniers » est une locution démonstrative figée : jamais « ses »." },
      { texte: "Chacun apporteront ses propres outils, et ces derniers resteront sur place.", regle: "« chacun » est un sujet singulier." },
      { texte: "Chacun apportera ses propres outils, et ces derniers resterons sur place.", regle: "Le sujet « ces derniers » est à la troisième personne du pluriel : resteront." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Quelle que soit la décision, nous devrons l'appliquer sans délai.",
    variantes: [
      { texte: "Quel que soit la décision, nous devrons l'appliquer sans délai.", regle: "« quel que » s'accorde avec le sujet du verbe être : décision est féminin." },
      { texte: "Quelque soit la décision, nous devrons l'appliquer sans délai.", regle: "Devant le verbe être, « quel que » s'écrit en deux mots." },
      { texte: "Quelle que soit la décision, nous devront l'appliquer sans délai.", regle: "Le sujet est « nous » : le verbe se conjugue à la première personne du pluriel." },
      { texte: "Quelle que soit la décision, nous devrons l'appliquer sans delai.", regle: "« délai » porte un accent aigu." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Le train est parti plus tôt que prévu, et nous l'avons manqué.",
    variantes: [
      { texte: "Le train est parti plutôt que prévu, et nous l'avons manqué.", regle: "« plutôt que » marque une préférence entre deux choses ; ici la comparaison porte sur un horaire, donc « plus tôt »." },
      { texte: "Le train est partit plus tôt que prévu, et nous l'avons manqué.", regle: "Le participe passé de « partir » est « parti »." },
      { texte: "Le train est parti plus tôt que prévu, et nous l'avons manquer.", regle: "Après l'auxiliaire avoir, il faut le participe passé, non l'infinitif." },
      { texte: "Le train est parti plus tôt que prévu, et nous l'avons manqués.", regle: "Le COD « l' » renvoie au train, singulier." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Les enfants ont rangé leurs affaires, puis leur mère les a félicités.",
    variantes: [
      { texte: "Les enfants ont rangé leur affaires, puis leur mère les a félicités.", regle: "Déterminant possessif devant un nom pluriel : « leurs affaires »." },
      { texte: "Les enfants ont rangé leurs affaires, puis leurs mère les a félicités.", regle: "« mère » est au singulier : le déterminant reste « leur »." },
      { texte: "Les enfants ont rangé leurs affaires, puis leur mère leur a félicités.", regle: "« féliciter » se construit avec un complément d'objet direct : « les »." },
      { texte: "Les enfants ont rangé leurs affaires, puis leur mère les a félicité.", regle: "Le COD « les » précède le verbe : le participe s'accorde, félicités." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Quoi qu'il en soit, la décision est prise et nous devrons nous y tenir.",
    variantes: [
      { texte: "Quoiqu'il en soit, la décision est prise et nous devrons nous y tenir.", regle: "Dans la locution « quoi qu'il en soit », « quoi que » s'écrit en deux mots : elle signifie « quelle que soit la chose ». « Quoique » en un mot signifie « bien que »." },
      { texte: "Quoi qu'il en soi, la décision est prise et nous devrons nous y tenir.", regle: "Le subjonctif d'« être » à la troisième personne est « soit »." },
      { texte: "Quoi qu'il en soit, la décision est prit et nous devrons nous y tenir.", regle: "Le participe passé de « prendre » au féminin est « prise »." },
      { texte: "Quoi qu'il en soit, la décision est prise et nous devront nous y tenir.", regle: "Le sujet est « nous » : le futur donne devrons." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Nous avons discuté davantage de la méthode que des résultats.",
    variantes: [
      { texte: "Nous avons discuté d'avantage de la méthode que des résultats.", regle: "« davantage » signifie « plus » ; « d'avantage » renvoie à un bénéfice." },
      { texte: "Nous avons discutés davantage de la méthode que des résultats.", regle: "Avec « avoir » et sans COD antéposé, le participe reste invariable." },
      { texte: "Nous avons discuté davantage de la méthode que de résultats.", regle: "Le second terme de la comparaison reprend le déterminant défini contracté : des résultats." },
      { texte: "Nous avons discuter davantage de la méthode que des résultats.", regle: "Après l'auxiliaire avoir, il faut le participe passé, pas l'infinitif." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Où qu'il aille, il retrouve les mêmes difficultés.",
    variantes: [
      { texte: "Ou qu'il aille, il retrouve les mêmes difficultés.", regle: "« où » indique le lieu ; « ou » est la conjonction d'alternative." },
      { texte: "Où qu'il aile, il retrouve les mêmes difficultés.", regle: "Le subjonctif d'« aller » est « aille »." },
      { texte: "Où qu'il aille, il retrouve les même difficultés.", regle: "« même » s'accorde avec le nom pluriel qu'il détermine." },
      { texte: "Où qu'il aille, il retrouvent les mêmes difficultés.", regle: "Le sujet « il » est au singulier." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Cette hypothèse, quelque séduisante qu'elle soit, reste invérifiable.",
    variantes: [
      { texte: "Cette hypothèse, quelques séduisante qu'elle soit, reste invérifiable.", regle: "Devant un adjectif, « quelque » est adverbe et reste invariable." },
      { texte: "Cette hypothèse, quelque séduisante qu'elle sois, reste invérifiable.", regle: "Le subjonctif d'« être » à la troisième personne est « soit »." },
      { texte: "Cette hypothèse, quelque séduisante quelle soit, reste invérifiable.", regle: "Il s'agit du pronom « elle » précédé de « qu' », non de l'adjectif « quelle »." },
      { texte: "Cette hypothèse, quelque séduisante qu'elle soit, restent invérifiable.", regle: "Le sujet est « cette hypothèse », au singulier." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Je me demande s'il viendra et ce qu'il apportera.",
    variantes: [
      { texte: "Je me demande si'l viendra et ce qu'il apportera.", regle: "L'élision se fait sur « si » devant « il » : s'il, sans apostrophe intérieure." },
      { texte: "Je me demande s'il viendra et se qu'il apportera.", regle: "« ce » est démonstratif ; « se » est un pronom réfléchi." },
      { texte: "Je me demande s'il viendras et ce qu'il apportera.", regle: "Au futur, la troisième personne du singulier ne prend pas de s." },
      { texte: "Je me demande s'il viendra et ce qu'il apporteras.", regle: "Même règle : la troisième personne du futur se termine par a." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Les mesures qu'il a prises se sont révélées efficaces.",
    variantes: [
      { texte: "Les mesures qu'il a pris se sont révélées efficaces.", regle: "Le COD « que », mis pour « mesures », précède le verbe : le participe s'accorde." },
      { texte: "Les mesures qu'il a prises se sont révélé efficaces.", regle: "Avec « se révéler », le participe s'accorde avec le sujet : révélées." },
      { texte: "Les mesures qu'il a prises ce sont révélées efficaces.", regle: "Le verbe est pronominal : « se sont », non « ce sont »." },
      { texte: "Les mesures qu'il a prises se sont révélées éfficaces.", regle: "« efficaces » ne prend pas d'accent." },
    ],
  },
  {
    skill: 'orthographe',
    correcte: "Parmi les candidats, quelques-uns seulement avaient l'expérience requise.",
    variantes: [
      { texte: "Parmis les candidats, quelques-uns seulement avaient l'expérience requise.", regle: "« parmi » ne prend jamais de s." },
      { texte: "Parmi les candidats, quelque-uns seulement avaient l'expérience requise.", regle: "Le pronom s'écrit « quelques-uns », avec un s et un trait d'union." },
      { texte: "Parmi les candidats, quelques-uns seulement avait l'expérience requise.", regle: "Le sujet « quelques-uns » est pluriel." },
      { texte: "Parmi les candidats, quelques-uns seulement avaient l'expérience requis.", regle: "« requise » s'accorde avec « expérience », féminin." },
    ],
  },
]

/* --------------------------------------------- grammaire et conjugaison -- */

const GRAMMAIRE: PhraseSeed[] = [
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Bien qu'il soit compétent, il n'a pas obtenu le poste.",
    variantes: [
      { texte: "Bien qu'il est compétent, il n'a pas obtenu le poste.", regle: "« bien que » commande le subjonctif : soit." },
      { texte: "Bien qu'il soit compétent, il n'a pas obtenu le post.", regle: "Le nom s'écrit « poste »." },
      { texte: "Bien qu'il soit compétent, il a pas obtenu le poste.", regle: "La négation exige « ne » devant le verbe." },
      { texte: "Bien qu'il soit compétant, il n'a pas obtenu le poste.", regle: "L'adjectif s'écrit « compétent » ; « compétant » n'existe pas." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Après qu'il eut terminé son exposé, la salle applaudit longuement.",
    variantes: [
      { texte: "Après qu'il eût terminé son exposé, la salle applaudit longuement.", regle: "« après que » se construit avec l'indicatif : eut, sans accent circonflexe." },
      { texte: "Avant qu'il eut terminé son exposé, la salle applaudit longuement.", regle: "« avant que » commande le subjonctif : la forme de l'indicatif ne convient pas." },
      { texte: "Après qu'il eut terminé son exposé, la salle applaudirent longuement.", regle: "Le sujet « la salle » est au singulier." },
      { texte: "Après qu'il eut terminer son exposé, la salle applaudit longuement.", regle: "Après l'auxiliaire, il faut le participe passé." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Si nous avions su, nous aurions pris une autre décision.",
    variantes: [
      { texte: "Si nous aurions su, nous aurions pris une autre décision.", regle: "Après « si » de condition, le conditionnel est proscrit : plus-que-parfait." },
      { texte: "Si nous avions su, nous aurons pris une autre décision.", regle: "La concordance impose le conditionnel passé dans la principale." },
      { texte: "Si nous avions sut, nous aurions pris une autre décision.", regle: "Le participe passé de « savoir » est « su »." },
      { texte: "Si nous avions su, nous aurions prit une autre décision.", regle: "Le participe passé de « prendre » est « pris »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Il faut que tu fasses preuve de patience jusqu'à la réponse.",
    variantes: [
      { texte: "Il faut que tu fais preuve de patience jusqu'à la réponse.", regle: "« il faut que » commande le subjonctif : fasses." },
      { texte: "Il faut que tu fasse preuve de patience jusqu'à la réponse.", regle: "Au subjonctif, la deuxième personne prend un s : fasses." },
      { texte: "Il faut que tu fasses preuve de patience jusqu'a la réponse.", regle: "« jusqu'à » porte un accent grave." },
      { texte: "Il faut que tu fasses preuves de patience jusqu'à la réponse.", regle: "Dans la locution « faire preuve de », « preuve » reste au singulier." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Ni la fatigue ni le doute ne l'ont détourné de son objectif.",
    variantes: [
      { texte: "Ni la fatigue ni le doute ne l'ont détourné de sont objectif.", regle: "« son » est un déterminant possessif ; « sont » est le verbe être." },
      { texte: "Ni la fatigue ni le doute l'ont détourné de son objectif.", regle: "La négation « ni… ni » réclame « ne » devant le verbe." },
      { texte: "Ni la fatigue ni le doute ne l'ont détournés de son objectif.", regle: "Le COD « l' » est au singulier : le participe s'accorde avec lui." },
      { texte: "Ni la fatigue ni le doute ne l'ont détourné de son objectifs.", regle: "Le déterminant « son » impose le singulier." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "La plupart des candidats ont rendu leur copie avant l'heure.",
    variantes: [
      { texte: "La plupart des candidats a rendu leur copie avant l'heure.", regle: "Après « la plupart de », l'accord se fait avec le complément : pluriel." },
      { texte: "La plupart des candidats ont rendus leur copie avant l'heure.", regle: "Sans COD antéposé, le participe conjugué avec avoir reste invariable." },
      { texte: "La plupart des candidat ont rendu leur copie avant l'heure.", regle: "« des candidats » est au pluriel." },
      { texte: "La plupart des candidats ont rendu leur copie avant l'heur.", regle: "Le nom s'écrit « heure »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Je crains qu'il ne soit trop tard pour revenir sur cette décision.",
    variantes: [
      { texte: "Je crains qu'il est trop tard pour revenir sur cette décision.", regle: "« craindre que » commande le subjonctif." },
      { texte: "Je crains qu'il ne soit trop tard pour revenir sur cet décision.", regle: "« décision » est féminin : cette." },
      { texte: "Je crains qu'il ne soit trop tard pour revenir sur cette décisions.", regle: "Le déterminant « cette » impose le singulier." },
      { texte: "Je craint qu'il ne soit trop tard pour revenir sur cette décision.", regle: "À la première personne, « craindre » fait « crains »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Elle s'est rendu compte de l'ampleur du problème trop tard.",
    variantes: [
      { texte: "Elle s'est rendue compte de l'ampleur du problème trop tard.", regle: "Dans « se rendre compte », « compte » est le COD : le participe reste invariable." },
      { texte: "Elle c'est rendu compte de l'ampleur du problème trop tard.", regle: "Le verbe est pronominal : « s'est »." },
      { texte: "Elle s'est rendu compte de l'empleur du problème trop tard.", regle: "Le nom s'écrit « ampleur »." },
      { texte: "Elle s'est rendu compte de l'ampleur du problèmes trop tard.", regle: "L'article contracté « du » impose le singulier." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Il s'agit d'une décision que personne n'avait anticipée.",
    variantes: [
      { texte: "Il s'agit d'une décision que personne n'avait anticipé.", regle: "Le COD « que », mis pour « décision », précède le verbe : accord au féminin." },
      { texte: "Ils s'agit d'une décision que personne n'avait anticipée.", regle: "« s'agir » est impersonnel : il ne se conjugue qu'avec « il »." },
      { texte: "Il s'agit d'une décision que personne avait anticipée.", regle: "« personne » comme sujet négatif exige « ne »." },
      { texte: "Il s'agit d'une décision dont personne n'avait anticipée.", regle: "Le verbe « anticiper » est transitif direct : le relatif est « que », non « dont »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    correcte: "Vous seriez surpris de constater à quel point ces résultats varient.",
    variantes: [
      { texte: "Vous seriez surpris de constater à quel point ces résultats varies.", regle: "Le sujet « ces résultats » est au pluriel : varient." },
      { texte: "Vous seriez surpris de constater à quelle point ces résultats varient.", regle: "« point » est masculin : à quel point." },
      { texte: "Vous seriez surpris de constater à quel point ses résultats varient.", regle: "Le démonstratif désigne les résultats évoqués : ces." },
      { texte: "Vous seriez surprit de constater à quel point ces résultats varient.", regle: "Le participe de « surprendre » est « surpris »." },
    ],
  },
]

/* --------------------------------------------------- syntaxe et style -- */

const SYNTAXE: PhraseSeed[] = [
  {
    skill: 'correction_syntaxique',
    correcte: "C'est le dossier dont je t'ai parlé hier.",
    variantes: [
      { texte: "C'est le dossier que je t'ai parlé hier.", regle: "« parler de » appelle le relatif « dont »." },
      { texte: "C'est le dossier dont je t'en ai parlé hier.", regle: "« dont » contient déjà le « de » : « en » fait double emploi." },
      { texte: "C'est le dossier dont je t'ai parler hier.", regle: "Après l'auxiliaire avoir, il faut le participe passé : parlé." },
      { texte: "C'est le dossier dont je te ai parlé hier.", regle: "L'élision est obligatoire devant une voyelle : t'ai." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "En arrivant à la gare, il a constaté que le train était parti.",
    variantes: [
      { texte: "En arrivant à la gare, le train était déjà parti.", regle: "Le participe se rapporte au sujet de la principale : le train n'arrive pas à la gare." },
      { texte: "En arrivant à la gare, il à constaté que le train était parti.", regle: "« a » est le verbe avoir ; « à » est une préposition." },
      { texte: "En arrivant à la gare, il a constater que le train était parti.", regle: "Après l'auxiliaire avoir, il faut le participe passé." },
      { texte: "En arrivant à la gare, il a constaté que le train étais parti.", regle: "À la troisième personne, l'imparfait d'être fait « était »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Il ne se souvient plus de ce qu'on lui avait promis.",
    variantes: [
      { texte: "Il ne se souvient plus ce qu'on lui avait promis.", regle: "« se souvenir » se construit avec « de »." },
      { texte: "Il ne se rappelle plus de ce qu'on lui avait promis.", regle: "« se rappeler » est transitif direct : la préposition « de » est fautive." },
      { texte: "Il ne se souvient plus de ce que on lui avait promis.", regle: "L'élision devant « on » est obligatoire : qu'on." },
      { texte: "Il ne se souvient plus de ce qu'on lui avait promi.", regle: "Le participe de « promettre » est « promis »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Le rapport auquel vous faites référence date de l'an dernier.",
    variantes: [
      { texte: "Le rapport dont vous faites référence date de l'an dernier.", regle: "« faire référence à » appelle « auquel », non « dont »." },
      { texte: "Le rapport lequel vous faites référence date de l'an dernier.", regle: "Le relatif doit porter la préposition : auquel." },
      { texte: "Le rapport auquel vous faites références date de l'an dernier.", regle: "Dans la locution « faire référence à », le nom reste au singulier." },
      { texte: "Le rapport auquel vous faites référence datent de l'an dernier.", regle: "Le sujet est « le rapport », au singulier." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Malgré les difficultés, l'équipe a tenu les délais annoncés.",
    variantes: [
      { texte: "Malgré que les difficultés, l'équipe a tenu les délais annoncés.", regle: "« malgré que » est fautif ; « malgré » se construit avec un nom." },
      { texte: "Malgré les difficultés, l'équipe ont tenu les délais annoncés.", regle: "« l'équipe » est un collectif singulier." },
      { texte: "Malgré les difficultés, l'équipe a tenue les délais annoncés.", regle: "Le COD « les délais » suit le verbe : pas d'accord." },
      { texte: "Malgré les difficultés, l'équipe a tenu les délais annoncé.", regle: "« annoncés » s'accorde avec « délais »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Plus il avance dans son travail, moins il doute de ses conclusions.",
    variantes: [
      { texte: "Plus il avance dans son travail, moins il doute de ses conclusion.", regle: "Le déterminant « ses » impose le pluriel : conclusions." },
      { texte: "Plus qu'il avance dans son travail, moins il doute de ses conclusions.", regle: "La corrélation « plus… moins » ne prend pas « que »." },
      { texte: "Plus il avance dans son travail, moins il doute à ses conclusions.", regle: "« douter » se construit avec « de »." },
      { texte: "Plus il avance dans son travail, moins il doutent de ses conclusions.", regle: "Le sujet « il » est au singulier." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Ce sont les arguments les plus solides que j'aie entendus.",
    variantes: [
      { texte: "C'est les arguments les plus solides que j'aie entendus.", regle: "Devant un attribut pluriel, on écrit « ce sont »." },
      { texte: "Ce sont les arguments les plus solide que j'aie entendus.", regle: "L'adjectif « solides » s'accorde avec « arguments », au pluriel." },
      { texte: "Ce sont les arguments les plus solides que j'aie entendu.", regle: "Le COD « que » précède le verbe : accord au pluriel." },
      { texte: "Ce sont les arguments le plus solides que j'aie entendus.", regle: "Le superlatif s'accorde avec le nom : les plus." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    correcte: "Je préfère qu'on m'avertisse plutôt que d'apprendre la nouvelle par hasard.",
    variantes: [
      { texte: "Je préfère qu'on m'avertit plutôt que d'apprendre la nouvelle par hasard.", regle: "« préférer que » commande le subjonctif : avertisse." },
      { texte: "Je préfère qu'on m'avertisse plus tôt que d'apprendre la nouvelle par hasard.", regle: "Il s'agit d'une préférence, non d'un moment : plutôt." },
      { texte: "Je préfère qu'on m'avertisse plutôt que d'apprendre la nouvelle par hazard.", regle: "« hasard » s'écrit avec un s." },
      { texte: "Je préfère qu'on m'avertisse plutôt que d'apprendre le nouvelle par hasard.", regle: "« nouvelle » est féminin." },
    ],
  },
]

/* ---------------------------------------------------- niveau annales -- */

/**
 * Les règles sur lesquelles les annales font tomber les candidats.
 *
 * Les phrases plus haut testent souvent une faute de frappe (« erreure »,
 * « delai ») qui se voit sans connaître de règle. Celles-ci ne contiennent que
 * des pièges de règle : participe de « durer » ou de « falloir », « se
 * succéder », « tout » devant un adjectif féminin, « après que » à l'indicatif,
 * « dont » et ses pléonasmes, « pallier », « se rappeler ». La phrase correcte
 * a l'air fautive aussi souvent que les variantes ont l'air justes.
 */
const DIFFICILES: PhraseSeed[] = [
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Les deux heures qu'a duré la réunion nous ont paru interminables.",
    variantes: [
      { texte: "Les deux heures qu'a durées la réunion nous ont paru interminables.", regle: "« durer » n'a pas de complément d'objet : « que » indique une durée, le participe reste invariable." },
      { texte: "Les deux heures qu'a duré la réunion nous ont parues interminables.", regle: "« paraître » n'a pas de complément d'objet direct (« nous » est indirect) : le participe reste invariable." },
      { texte: "Les deux heures qu'à duré la réunion nous ont paru interminables.", regle: "« a » est ici l'auxiliaire avoir, pas la préposition « à »." },
      { texte: "Les deux heures qu'a duré la réunion nous ont paru interminable.", regle: "L'attribut « interminables » se rapporte à « heures », au pluriel." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Les efforts qu'il a fallu pour terminer à temps ont été considérables.",
    variantes: [
      { texte: "Les efforts qu'il a fallus pour terminer à temps ont été considérables.", regle: "« falloir » est impersonnel : son participe passé est toujours invariable." },
      { texte: "Les efforts qu'il a fallut pour terminer à temps ont été considérables.", regle: "Le participe passé de « falloir » est « fallu », sans t." },
      { texte: "Les efforts qu'il a fallu pour terminer à temps ont été considérable.", regle: "L'attribut « considérables » s'accorde avec « efforts », au pluriel." },
      { texte: "Les efforts qu'il à fallu pour terminer à temps ont été considérables.", regle: "« a » est ici l'auxiliaire avoir, pas la préposition « à »." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Elles se sont succédé à la tribune sans jamais se répondre.",
    variantes: [
      { texte: "Elles se sont succédées à la tribune sans jamais se répondre.", regle: "On succède À quelqu'un : « se » est complément indirect, le participe reste invariable." },
      { texte: "Elles se sont succédé à la tribune sans jamais ce répondre.", regle: "Devant un verbe, le pronom réfléchi s'écrit « se » ; « ce » est un démonstratif." },
      { texte: "Elles ce sont succédé à la tribune sans jamais se répondre.", regle: "Devant un verbe pronominal, il faut le pronom réfléchi « se »." },
      { texte: "Elles se sont succédé a la tribune sans jamais se répondre.", regle: "Devant « la tribune », c'est la préposition « à », avec accent." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Quoi qu'on en dise, ce projet a davantage de partisans que d'opposants.",
    variantes: [
      { texte: "Quoiqu'on en dise, ce projet a davantage de partisans que d'opposants.", regle: "« quoi que » (quelle que soit la chose que) s'écrit en deux mots ; « quoique » en un mot signifie « bien que »." },
      { texte: "Quoi qu'on en dise, ce projet a d'avantage de partisans que d'opposants.", regle: "« davantage » (plus) s'écrit en un seul mot." },
      { texte: "Quoi qu'on en dise, ce projet à davantage de partisans que d'opposants.", regle: "« a » est ici le verbe avoir, pas la préposition « à »." },
      { texte: "Quoi qu'on en dises, ce projet a davantage de partisans que d'opposants.", regle: "Le sujet « on » est à la troisième personne : « dise »." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Ils se sont rappelé leurs promesses et les ont tenues.",
    variantes: [
      { texte: "Ils se sont rappelés leurs promesses et les ont tenues.", regle: "On rappelle quelque chose À soi : « se » est indirect et le COD « leurs promesses » est placé après — participe invariable." },
      { texte: "Ils se sont rappelé leurs promesses et les ont tenu.", regle: "Le COD « les » (les promesses) est placé avant l'auxiliaire avoir : « tenues »." },
      { texte: "Ils se sont rappelé de leurs promesses et les ont tenues.", regle: "« se rappeler » est transitif direct : on se rappelle quelque chose, pas « de » quelque chose." },
      { texte: "Ils se sont rappelé leur promesses et les ont tenues.", regle: "Déterminant possessif devant un nom pluriel : « leurs promesses »." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Elle s'est fait opérer la semaine dernière et se porte déjà mieux.",
    variantes: [
      { texte: "Elle s'est faite opérer la semaine dernière et se porte déjà mieux.", regle: "« fait » suivi d'un infinitif reste toujours invariable." },
      { texte: "Elle s'est fait opéré la semaine dernière et se porte déjà mieux.", regle: "Après « faire », le verbe est à l'infinitif : « opérer »." },
      { texte: "Elle s'est fait opérer la semaine dernière et ce porte déjà mieux.", regle: "Devant un verbe, le pronom réfléchi s'écrit « se »." },
      { texte: "Elle s'est fait opérer la semaine dernière et se porte déja mieux.", regle: "« déjà » prend un accent grave sur le a final." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "Tout émue, elle a remercié toutes les personnes présentes.",
    variantes: [
      { texte: "Toute émue, elle a remercié toutes les personnes présentes.", regle: "« tout » adverbe (tout à fait) ne varie que devant un adjectif féminin commençant par une consonne ; devant une voyelle, il reste « tout »." },
      { texte: "Tout émue, elle a remerciée toutes les personnes présentes.", regle: "Le COD « toutes les personnes » est placé après le verbe : le participe reste invariable." },
      { texte: "Tout émue, elle a remercié toutes les personnes présente.", regle: "« présentes » s'accorde avec « personnes », au pluriel." },
      { texte: "Tout émue, elle a remercié tous les personnes présentes.", regle: "« personnes » est féminin : « toutes les personnes »." },
    ],
  },
  {
    skill: 'orthographe',
    difficile: true,
    correcte: "La salle compte deux cents places, dont quatre-vingt-trois sont déjà réservées.",
    variantes: [
      { texte: "La salle compte deux cent places, dont quatre-vingt-trois sont déjà réservées.", regle: "« cent » multiplié et non suivi d'un autre nombre prend un s : « deux cents »." },
      { texte: "La salle compte deux cents places, dont quatre-vingts-trois sont déjà réservées.", regle: "« vingt » suivi d'un autre nombre ne prend pas de s : « quatre-vingt-trois »." },
      { texte: "La salle compte deux cents places, dont quatre-vingt-trois sont déjà réservés.", regle: "Le participe se rapporte à « places », féminin : « réservées »." },
      { texte: "La salle compte deux cents places, dont quatre-vingt-trois sont déja réservées.", regle: "« déjà » prend un accent grave sur le a final." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Après qu'il a terminé son discours, la salle s'est levée.",
    variantes: [
      { texte: "Après qu'il ait terminé son discours, la salle s'est levée.", regle: "« après que » introduit un fait accompli : indicatif. C'est « avant que » qui demande le subjonctif." },
      { texte: "Après qu'il a terminé son discours, la salle s'est levé.", regle: "Avec un verbe pronominal réfléchi, le participe s'accorde avec le sujet « la salle »." },
      { texte: "Après qu'il a terminé son discours, la salle c'est levée.", regle: "Devant un verbe pronominal, il faut le pronom réfléchi : « s'est »." },
      { texte: "Après qu'il a terminer son discours, la salle s'est levée.", regle: "Après l'auxiliaire avoir, il faut le participe passé : « terminé »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Bien qu'il soit arrivé en retard, il a pu passer l'épreuve.",
    variantes: [
      { texte: "Bien qu'il est arrivé en retard, il a pu passer l'épreuve.", regle: "« bien que » exige le subjonctif : « soit arrivé »." },
      { texte: "Bien qu'il soit arrivé en retard, il a pû passer l'épreuve.", regle: "Le participe passé de « pouvoir » s'écrit « pu », sans accent." },
      { texte: "Bien qu'il soit arrivé en retard, il a pu passé l'épreuve.", regle: "Après « pouvoir », le verbe est à l'infinitif : « passer »." },
      { texte: "Bien qu'il soit arrivée en retard, il a pu passer l'épreuve.", regle: "Avec l'auxiliaire être, le participe s'accorde avec le sujet « il » : « arrivé »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Si j'avais su, je serais venu plus tôt.",
    variantes: [
      { texte: "Si j'aurais su, je serais venu plus tôt.", regle: "Après le « si » de condition, jamais de conditionnel : « si j'avais su »." },
      { texte: "Si j'avais su, je serai venu plus tôt.", regle: "Derrière « si » + plus-que-parfait, il faut le conditionnel passé : « je serais venu »." },
      { texte: "Si j'avais su, j'aurais venu plus tôt.", regle: "« venir » se conjugue avec l'auxiliaire être : « je serais venu »." },
      { texte: "Si j'avais su, je serais venu plutôt.", regle: "Il s'agit d'un moment, non d'une préférence : « plus tôt »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "C'est nous qui avons pris cette décision, et nous l'assumons.",
    variantes: [
      { texte: "C'est nous qui ont pris cette décision, et nous l'assumons.", regle: "Après « qui », le verbe s'accorde avec l'antécédent « nous » : « avons »." },
      { texte: "C'est nous qui avons prit cette décision, et nous l'assumons.", regle: "Le participe passé de « prendre » est « pris »." },
      { texte: "C'est nous qui avons pris cette décision, et nous l'assumont.", regle: "Première personne du pluriel : la terminaison est -ons." },
      { texte: "C'est nous qui avons pris cette décision, et nous l'assumons pas.", regle: "À l'écrit, la négation est complète : « nous ne l'assumons pas »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Je doute qu'il puisse venir, mais je crois qu'il essaiera.",
    variantes: [
      { texte: "Je doute qu'il peut venir, mais je crois qu'il essaiera.", regle: "« douter que » commande le subjonctif : « puisse »." },
      { texte: "Je doute qu'il pourra venir, mais je crois qu'il essaiera.", regle: "« douter que » commande le subjonctif, pas le futur : « puisse »." },
      { texte: "Je doute qu'il puisse venir, mais je croit qu'il essaiera.", regle: "Première personne du singulier : « je crois »." },
      { texte: "Je doute qu'il puisses venir, mais je crois qu'il essaiera.", regle: "Troisième personne du singulier : « qu'il puisse »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Les dossiers dont nous avons besoin sont rangés dans l'armoire.",
    variantes: [
      { texte: "Les dossiers que nous avons besoin sont rangés dans l'armoire.", regle: "On a besoin DE quelque chose : le relatif est « dont »." },
      { texte: "Les dossiers dont nous en avons besoin sont rangés dans l'armoire.", regle: "« dont » reprend déjà le complément : « en » fait double emploi." },
      { texte: "Les dossiers dont nous avons besoin sont rangé dans l'armoire.", regle: "Le participe s'accorde avec le sujet « les dossiers » : « rangés »." },
      { texte: "Les dossiers dont nous avons besoins sont rangés dans l'armoire.", regle: "Dans « avoir besoin », le nom reste au singulier." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Il faut que vous preniez une décision avant que la réunion commence.",
    variantes: [
      { texte: "Il faut que vous prenez une décision avant que la réunion commence.", regle: "« il faut que » commande le subjonctif : « preniez »." },
      { texte: "Il faut que vous prendriez une décision avant que la réunion commence.", regle: "« il faut que » commande le subjonctif, jamais le conditionnel : « preniez »." },
      { texte: "Il faut que vous preniez une décision avant que la réunion a commencé.", regle: "« avant que » commande le subjonctif : « commence »." },
      { texte: "Il faut que vous preniez une décision avant que la réunion commençe.", regle: "La cédille ne se met que devant a, o, u : « commence »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Les candidats se sont plu à rappeler leurs résultats.",
    variantes: [
      { texte: "Les candidats se sont plus à rappeler leurs résultats.", regle: "Le participe passé de « se plaire » est invariable : « plu »." },
      { texte: "Les candidats se sont plu de rappeler leurs résultats.", regle: "On se plaît À faire quelque chose : préposition « à »." },
      { texte: "Les candidats se sont plu à rappelé leurs résultats.", regle: "Après une préposition, le verbe est à l'infinitif : « rappeler »." },
      { texte: "Les candidats se sont plu à rappeler leur résultats.", regle: "Déterminant possessif devant un nom pluriel : « leurs résultats »." },
    ],
  },
  {
    skill: 'grammaire_et_conjugaison',
    difficile: true,
    correcte: "Je vous saurais gré de bien vouloir me répondre.",
    variantes: [
      { texte: "Je vous serais gré de bien vouloir me répondre.", regle: "L'expression est « savoir gré » : « je vous saurais gré »." },
      { texte: "Je vous saurez gré de bien vouloir me répondre.", regle: "Première personne du singulier : « je saurais »." },
      { texte: "Je vous saurais gré à bien vouloir me répondre.", regle: "On sait gré DE quelque chose : préposition « de »." },
      { texte: "Je vous saurais grès de bien vouloir me répondre.", regle: "« gré » s'écrit sans s." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Le directeur, dont j'ai lu le rapport hier, nous a convaincus.",
    variantes: [
      { texte: "Le directeur, que j'ai lu le rapport hier, nous a convaincus.", regle: "Le rapport DU directeur : le relatif est « dont »." },
      { texte: "Le directeur, dont j'ai lu son rapport hier, nous a convaincus.", regle: "« dont » marque déjà l'appartenance : le possessif « son » fait double emploi." },
      { texte: "Le directeur, dont j'ai lu le rapport hier, nous ont convaincus.", regle: "Le sujet est « le directeur », au singulier : « a convaincus »." },
      { texte: "Le directeur, dont j'ai lu le rapport hier, nous à convaincus.", regle: "« a » est ici l'auxiliaire avoir, pas la préposition « à »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Je me souviens de ce voyage ; je me le rappelle en détail.",
    variantes: [
      { texte: "Je me souviens de ce voyage ; je m'en rappelle en détail.", regle: "« se rappeler » est transitif direct : on se rappelle quelque chose, donc « je me le rappelle »." },
      { texte: "Je me souviens ce voyage ; je me le rappelle en détail.", regle: "On se souvient DE quelque chose : « je me souviens de »." },
      { texte: "Je me souvient de ce voyage ; je me le rappelle en détail.", regle: "Première personne du singulier : « je me souviens »." },
      { texte: "Je me souviens de ce voyage ; je me le rapelle en détail.", regle: "« rappeler » prend deux p." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "C'est à lui que je pense, et c'est de cela que je parle.",
    variantes: [
      { texte: "C'est à lui à qui je pense, et c'est de cela que je parle.", regle: "La préposition est déjà portée par « à lui » : « c'est à lui que », sans « à qui »." },
      { texte: "C'est à lui que je pense, et c'est de cela dont je parle.", regle: "« dont » reprend déjà « de cela » : pléonasme ; il faut « c'est de cela que »." },
      { texte: "C'est lui que je pense, et c'est de cela que je parle.", regle: "On pense À quelqu'un : « c'est à lui que je pense »." },
      { texte: "C'est à lui que je pense, et c'est de cela que je parles.", regle: "Première personne du singulier : « je parle »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Bien qu'il ait plu, la fête a eu lieu comme prévu.",
    variantes: [
      { texte: "Malgré qu'il ait plu, la fête a eu lieu comme prévu.", regle: "« malgré que » est fautif : on dit « bien que » (ou « malgré » suivi d'un nom)." },
      { texte: "Bien qu'il a plu, la fête a eu lieu comme prévu.", regle: "« bien que » exige le subjonctif : « ait plu »." },
      { texte: "Bien qu'il ait plut, la fête a eu lieu comme prévu.", regle: "Le participe passé de « pleuvoir » est « plu », sans t." },
      { texte: "Bien qu'il ait plu, la fête a eu lieue comme prévu.", regle: "Dans « avoir lieu », le nom « lieu » s'écrit sans e." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Nous avons pallié ce manque grâce à une meilleure organisation.",
    variantes: [
      { texte: "Nous avons pallié à ce manque grâce à une meilleure organisation.", regle: "« pallier » est transitif direct : on pallie quelque chose, sans « à »." },
      { texte: "Nous avons palié ce manque grâce à une meilleure organisation.", regle: "« pallier » prend deux l." },
      { texte: "Nous avons pallié ce manque grâce à une meilleur organisation.", regle: "« meilleure » s'accorde avec « organisation », au féminin." },
      { texte: "Nous avons pallier ce manque grâce à une meilleure organisation.", regle: "Après l'auxiliaire avoir, il faut le participe passé : « pallié »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "On ne peut pas lui en vouloir : il n'a rien vu.",
    variantes: [
      { texte: "On peut pas lui en vouloir : il n'a rien vu.", regle: "À l'écrit, la négation est complète : « on ne peut pas »." },
      { texte: "On ne peut pas lui en vouloir : il n'a pas rien vu.", regle: "« pas » et « rien » ne se cumulent pas : « il n'a rien vu »." },
      { texte: "On ne peut pas l'en vouloir : il n'a rien vu.", regle: "On en veut À quelqu'un : le pronom est indirect, « lui en vouloir »." },
      { texte: "On ne peut pas lui en vouloir : il n'a rien vus.", regle: "Sans COD placé avant, le participe reste invariable : « vu »." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Les élèves, dont la plupart avaient révisé, ont réussi l'examen.",
    variantes: [
      { texte: "Les élèves, dont la plupart avait révisé, ont réussi l'examen.", regle: "Après « la plupart » (des élèves), le verbe se met au pluriel : « avaient »." },
      { texte: "Les élèves, que la plupart avaient révisé, ont réussi l'examen.", regle: "La plupart DES élèves : le relatif est « dont »." },
      { texte: "Les élèves, dont la plupart d'entre eux avaient révisé, ont réussi l'examen.", regle: "« dont » reprend déjà les élèves : « d'entre eux » fait double emploi." },
      { texte: "Les élèves, dont la plupart avaient révisé, ont réussis l'examen.", regle: "Le COD « l'examen » est placé après : le participe reste invariable." },
    ],
  },
  {
    skill: 'correction_syntaxique',
    difficile: true,
    correcte: "Il est sorti sans qu'on le voie.",
    variantes: [
      { texte: "Il est sorti sans qu'on le voit.", regle: "« sans que » commande le subjonctif : « voie »." },
      { texte: "Il est sorti sans qu'on le voye.", regle: "Le subjonctif de « voir » s'écrit « voie »." },
      { texte: "Il a sorti sans qu'on le voie.", regle: "Sans complément d'objet, « sortir » se conjugue avec être : « il est sorti »." },
      { texte: "Il est sortit sans qu'on le voie.", regle: "Le participe passé de « sortir » est « sorti », sans t." },
    ],
  },
]

export const PHRASES: PhraseSeed[] = [...ORTHOGRAPHE, ...GRAMMAIRE, ...SYNTAXE, ...DIFFICILES]

/* --------------------------------------------- connecteurs logiques -- */

export type Relation = 'cause' | 'consequence' | 'opposition' | 'concession' | 'condition' | 'addition'

export const CONNECTEURS: Record<Relation, string[]> = {
  cause: ['car', 'parce que', 'puisque'],
  consequence: ['par conséquent', 'c’est pourquoi', 'de sorte que'],
  opposition: ['en revanche', 'au contraire', 'tandis que'],
  concession: ['pourtant', 'néanmoins', 'bien que'],
  condition: ['à condition que', 'pourvu que', 'si tant est que'],
  addition: ['de plus', 'en outre', 'par ailleurs'],
}

export const LIBELLE_RELATION: Record<Relation, string> = {
  cause: 'la cause',
  consequence: 'la conséquence',
  opposition: 'l’opposition',
  concession: 'la concession',
  condition: 'la condition',
  addition: 'l’addition',
}

export interface PaireSeed {
  /** Première proposition, telle quelle. */
  gauche: string
  /** Seconde proposition, sans majuscule ni ponctuation finale. */
  droite: string
  relation: Relation
}

export const PAIRES: PaireSeed[] = [
  { gauche: "Le train a été supprimé", droite: "la voie était inondée depuis la veille", relation: 'cause' },
  { gauche: "Les inscriptions ont doublé", droite: "l’école a dû ouvrir une seconde salle", relation: 'consequence' },
  { gauche: "Le premier candidat parlait longuement", droite: "le second répondait en trois phrases", relation: 'opposition' },
  { gauche: "Le dossier était complet", droite: "il a été refusé sans explication", relation: 'concession' },
  { gauche: "La réunion se tiendra à distance", droite: "chacun dispose d’une connexion stable", relation: 'condition' },
  { gauche: "Ce logement est mal isolé", droite: "il est situé loin de tout commerce", relation: 'addition' },
  { gauche: "La récolte a été mauvaise", droite: "le printemps a été exceptionnellement sec", relation: 'cause' },
  { gauche: "Les stocks sont épuisés", droite: "les livraisons sont suspendues jusqu’à lundi", relation: 'consequence' },
  { gauche: "Le nord du pays connaît une forte croissance", droite: "le sud se dépeuple d’année en année", relation: 'opposition' },
  { gauche: "Elle avait tout préparé", droite: "rien ne s’est déroulé comme prévu", relation: 'concession' },
  { gauche: "Nous accepterons ce calendrier", droite: "les délais de relecture soient maintenus", relation: 'condition' },
  { gauche: "Cette méthode est coûteuse", droite: "elle demande une formation longue", relation: 'addition' },
  { gauche: "Le bâtiment a été fermé", droite: "la charpente menaçait de céder", relation: 'cause' },
  { gauche: "Le prix des matériaux a triplé", droite: "le chantier a été interrompu", relation: 'consequence' },
  { gauche: "Les uns réclament plus de contrôles", droite: "les autres demandent plus de liberté", relation: 'opposition' },
  { gauche: "Le texte avait été relu trois fois", droite: "deux erreurs subsistaient à l’impression", relation: 'concession' },
  { gauche: "L’expérience sera reconduite", droite: "les premiers résultats se confirment", relation: 'condition' },
  { gauche: "Ce quartier manque de transports", droite: "les loyers y ont fortement augmenté", relation: 'addition' },
  { gauche: "La séance a été avancée", droite: "plusieurs participants partaient le soir même", relation: 'cause' },
  { gauche: "Aucune candidature n’a été retenue", droite: "l’appel d’offres a été relancé", relation: 'consequence' },
  { gauche: "Le rapport insiste sur la prévention", droite: "le budget porte surtout sur la réparation", relation: 'opposition' },
  { gauche: "Les prévisions étaient prudentes", droite: "le résultat les a largement dépassées", relation: 'concession' },
  { gauche: "Le prêt sera accordé", droite: "l’emprunteur fournisse une garantie", relation: 'condition' },
  { gauche: "Cette solution est plus rapide", droite: "elle mobilise moins de personnel", relation: 'addition' },
  { gauche: "L’exposition a été prolongée", droite: "la fréquentation dépassait les prévisions", relation: 'cause' },
  { gauche: "Les relevés étaient erronés", droite: "toute l’étude a dû être refaite", relation: 'consequence' },
  { gauche: "La première version était touffue", droite: "la seconde tient en deux pages", relation: 'opposition' },
  { gauche: "L’auteur connaissait la région", droite: "sa description en est méconnaissable", relation: 'concession' },
  { gauche: "Le stage sera validé", droite: "le rapport soit remis avant juin", relation: 'condition' },
  { gauche: "Ce dispositif est difficile à installer", droite: "son entretien réclame un spécialiste", relation: 'addition' },
  { gauche: "L’audience a été reportée", droite: "un témoin essentiel était absent", relation: 'cause' },
  { gauche: "La demande a explosé", droite: "les délais se sont allongés de trois semaines", relation: 'consequence' },
  { gauche: "Certains y voient une avancée", droite: "d’autres n’y lisent qu’un renoncement", relation: 'opposition' },
  { gauche: "Le matériel était neuf", droite: "la panne est survenue dès le premier jour", relation: 'concession' },
]

/* ----------------------------------------------- synonymes et antonymes -- */

export interface EntreeLexique {
  mot: string
  /** Phrase où le mot apparaît, pour fixer le sens visé. */
  contexte: string
  synonyme: string
  antonyme: string
  /** Mots proches par la forme ou le domaine, mais faux ici. */
  leurres: string[]
}

export const LEXIQUE: EntreeLexique[] = [
  { mot: 'éphémère', contexte: "Le succès de ce produit fut éphémère.", synonyme: 'passager', antonyme: 'durable', leurres: ['aérien', 'anodin', 'discret', 'fragile'] },
  { mot: 'prolixe', contexte: "L’orateur, prolixe, dépassa son temps de parole.", synonyme: 'bavard', antonyme: 'laconique', leurres: ['prolifique', 'précis', 'confus', 'brillant'] },
  { mot: 'obsolète', contexte: "Ce procédé est devenu obsolète.", synonyme: 'périmé', antonyme: 'actuel', leurres: ['obscur', 'complexe', 'coûteux', 'obligatoire'] },
  { mot: 'exacerber', contexte: "Cette annonce a exacerbé les tensions.", synonyme: 'aviver', antonyme: 'apaiser', leurres: ['exagérer', 'exclure', 'expliquer', 'exposer'] },
  { mot: 'pléthore', contexte: "Une pléthore de candidatures est arrivée.", synonyme: 'abondance', antonyme: 'pénurie', leurres: ['sélection', 'variété', 'poignée', 'succession'] },
  { mot: 'fallacieux', contexte: "Son raisonnement repose sur un argument fallacieux.", synonyme: 'trompeur', antonyme: 'honnête', leurres: ['fastidieux', 'audacieux', 'facultatif', 'incomplet'] },
  { mot: 'lapidaire', contexte: "Il répondit d’une formule lapidaire.", synonyme: 'concis', antonyme: 'prolixe', leurres: ['brutal', 'écrit', 'définitif', 'obscur'] },
  { mot: 'entériner', contexte: "Le conseil a entériné la décision.", synonyme: 'valider', antonyme: 'annuler', leurres: ['enterrer', 'engager', 'énumérer', 'examiner'] },
  { mot: 'saugrenu', contexte: "Cette proposition saugrenue fit sourire.", synonyme: 'absurde', antonyme: 'sensé', leurres: ['savant', 'soudain', 'ambitieux', 'sinistre'] },
  { mot: 'atermoyer', contexte: "La direction atermoie depuis des mois.", synonyme: 'tergiverser', antonyme: 'trancher', leurres: ['atténuer', 'attester', 'alterner', 'accélérer'] },
  { mot: 'véniel', contexte: "Il ne s’agit que d’un manquement véniel.", synonyme: 'bénin', antonyme: 'grave', leurres: ['vénal', 'volontaire', 'ancien', 'répété'] },
  { mot: 'exhaustif', contexte: "Le recensement se veut exhaustif.", synonyme: 'complet', antonyme: 'partiel', leurres: ['épuisant', 'exigeant', 'exact', 'officiel'] },
  { mot: 'contrit', contexte: "Il présenta des excuses d’un air contrit.", synonyme: 'repentant', antonyme: 'satisfait', leurres: ['contraint', 'contraire', 'crispé', 'distrait'] },
  { mot: 'idoine', contexte: "Il faut trouver la personne idoine pour ce poste.", synonyme: 'appropriée', antonyme: 'inadaptée', leurres: ['idéale', 'identique', 'disponible', 'unique'] },
  { mot: 'palliatif', contexte: "Cette mesure n’est qu’un palliatif.", synonyme: 'expédient', antonyme: 'remède', leurres: ['préalable', 'privilège', 'principe', 'précédent'] },
  { mot: 'incurie', contexte: "L’incurie de la gestion a été pointée.", synonyme: 'négligence', antonyme: 'rigueur', leurres: ['incurable', 'inquiétude', 'ingérence', 'insolence'] },
  { mot: 'notoire', contexte: "Son incompétence est notoire.", synonyme: 'manifeste', antonyme: 'ignorée', leurres: ['notable', 'nouvelle', 'notariée', 'niée'] },
  { mot: 'proscrire', contexte: "L’usage de ce terme a été proscrit.", synonyme: 'interdire', antonyme: 'autoriser', leurres: ['prescrire', 'proclamer', 'promouvoir', 'prolonger'] },
  { mot: 'ubiquité', contexte: "On lui prête un don d’ubiquité.", synonyme: 'omniprésence', antonyme: 'absence', leurres: ['unicité', 'urbanité', 'utilité', 'rapidité'] },
  { mot: 'velléitaire', contexte: "C’est un réformateur velléitaire.", synonyme: 'irrésolu', antonyme: 'déterminé', leurres: ['véhément', 'volontaire', 'visionnaire', 'vaniteux'] },
  { mot: 'aléatoire', contexte: "Le résultat reste aléatoire.", synonyme: 'incertain', antonyme: 'garanti', leurres: ['alarmant', 'allégé', 'alternatif', 'immédiat'] },
  { mot: 'dilapider', contexte: "Il a dilapidé l’héritage familial.", synonyme: 'gaspiller', antonyme: 'épargner', leurres: ['dilater', 'délaisser', 'déplacer', 'distribuer'] },
  { mot: 'spécieux', contexte: "L’argument est spécieux.", synonyme: 'captieux', antonyme: 'valable', leurres: ['spécifique', 'spectaculaire', 'spontané', 'sérieux'] },
  { mot: 'inopiné', contexte: "Un contrôle inopiné a eu lieu.", synonyme: 'imprévu', antonyme: 'programmé', leurres: ['inopérant', 'inopportun', 'inutile', 'informel'] },
  { mot: 'stigmatiser', contexte: "Le rapport stigmatise ces pratiques.", synonyme: 'dénoncer', antonyme: 'louer', leurres: ['signaler', 'stimuler', 'systématiser', 'constater'] },
  { mot: 'laconique', contexte: "Sa réponse fut laconique.", synonyme: 'bref', antonyme: 'verbeux', leurres: ['laborieux', 'lacunaire', 'tranchant', 'sévère'] },
  { mot: 'préconiser', contexte: "Le rapport préconise une réforme du barème.", synonyme: 'recommander', antonyme: 'déconseiller', leurres: ['prévoir', 'précéder', 'prétendre', 'imposer'] },
  { mot: 'ostensible', contexte: "Il affichait un mépris ostensible.", synonyme: 'visible', antonyme: 'discret', leurres: ['ostentatoire', 'obstiné', 'offensant', 'hostile'] },
  { mot: 'anodin', contexte: "L’incident paraissait anodin.", synonyme: 'insignifiant', antonyme: 'grave', leurres: ['anonyme', 'ancien', 'anormal', 'isolé'] },
  { mot: 'ténu', contexte: "Le lien entre les deux faits reste ténu.", synonyme: 'faible', antonyme: 'solide', leurres: ['tendu', 'tenace', 'certain', 'ancien'] },
  { mot: 'occulter', contexte: "Ce débat occulte l’essentiel.", synonyme: 'masquer', antonyme: 'révéler', leurres: ['occuper', 'accuser', 'écarter', 'éclairer'] },
  { mot: 'insidieux', contexte: "La progression du mal est insidieuse.", synonyme: 'sournoise', antonyme: 'franche', leurres: ['inspirée', 'indécise', 'inutile', 'rapide'] },
  { mot: 'probité', contexte: "Sa probité n’a jamais été mise en doute.", synonyme: 'honnêteté', antonyme: 'malhonnêteté', leurres: ['probabilité', 'sobriété', 'notoriété', 'autorité'] },
  { mot: 'éluder', contexte: "Il a éludé la question.", synonyme: 'esquiver', antonyme: 'affronter', leurres: ['élucider', 'éliminer', 'écouter', 'énoncer'] },
  { mot: 'sporadique', contexte: "Les contrôles restent sporadiques.", synonyme: 'occasionnels', antonyme: 'réguliers', leurres: ['spectaculaires', 'sévères', 'symboliques', 'soudains'] },
  { mot: 'pusillanime', contexte: "Une direction pusillanime n’a rien tranché.", synonyme: 'craintive', antonyme: 'audacieuse', leurres: ['puissante', 'pointilleuse', 'passive', 'partiale'] },
  { mot: 'corroborer', contexte: "Ces relevés corroborent l’hypothèse.", synonyme: 'confirmer', antonyme: 'infirmer', leurres: ['collaborer', 'corriger', 'compléter', 'contester'] },
  { mot: 'délétère', contexte: "Un climat délétère s’est installé.", synonyme: 'nocif', antonyme: 'sain', leurres: ['délicat', 'déterminé', 'diffus', 'durable'] },
  { mot: 'apocryphe', contexte: "Cette citation est apocryphe.", synonyme: 'inauthentique', antonyme: 'avérée', leurres: ['ancienne', 'apolitique', 'obscure', 'célèbre'] },
  { mot: 'prodigue', contexte: "Il s’est montré prodigue en compliments.", synonyme: 'généreux', antonyme: 'avare', leurres: ['prodigieux', 'prudent', 'précis', 'sincère'] },
]
