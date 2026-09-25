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

export const PHRASES: PhraseSeed[] = [...ORTHOGRAPHE, ...GRAMMAIRE, ...SYNTAXE]

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
