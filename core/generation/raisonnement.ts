/**
 * Sous-test 3 — Raisonnement et argumentation.
 *
 * Deux familles de nature très différente, et il faut le savoir en s'entraînant.
 *
 * La déduction formelle est entièrement calculable : la validité d'une forme
 * logique ne dépend d'aucun contenu, le programme la connaît et peut en produire
 * autant qu'on veut. C'est aussi là que le TAGE MAGE piège le plus, parce que
 * réciproque et contraposée se ressemblent à s'y méprendre.
 *
 * L'argumentation, elle, repose sur des gabarits : la faille du raisonnement est
 * POSÉE avant d'écrire l'argument (voir corpus-raisonnement.ts). Affaiblir,
 * renforcer et présupposer se déduisent alors de cette faille, et les leurres
 * sont les remèdes des autres failles — plausibles, et faux pour une raison
 * précise.
 *
 * Limite assumée : les argumentaires sont plus courts et plus nets que ceux
 * d'une annale, où le texte fait souvent six à huit lignes de prose.
 */

import { capitale, capitaliserPhrases, type Alea } from './alea'
import { qcmTexte } from './qcm'
import type { Famille, QuestionGeneree } from './types'
import { FAILLES, SCENARIOS } from './corpus-raisonnement'
import { paradoxe } from './paradoxes'

const S = 'raisonnement' as const

const SKILL = {
  premisse: 'tm.raisonnement.premisse_et_conclusion',
  renforcer: 'tm.raisonnement.renforcer_un_argument',
  affaiblir: 'tm.raisonnement.affaiblir_un_argument',
  hypothese: 'tm.raisonnement.hypothese_implicite',
  sophisme: 'tm.raisonnement.identifier_un_sophisme',
} as const

/* ------------------------------------------------- déduction formelle -- */

/**
 * Groupes nominaux neutres, au singulier et au pluriel.
 *
 * Deux exigences les gouvernent. Ils sont vides de sens courant : dès qu'on
 * écrit « tous les chats sont des mammifères », on répond avec ce qu'on sait du
 * monde au lieu de suivre la forme logique, et c'est précisément ce que le
 * sous-test veut empêcher. Et ils portent leurs deux nombres, parce que la
 * langue ne se laisse pas concaténer : « aucun membre » mais « aux membres ».
 * Tous les singuliers sont masculins, pour que « aucun » reste valide.
 */
interface Ensemble {
  pluriel: string
  singulier: string
}

const ENSEMBLES: Ensemble[] = [
  { pluriel: 'membres du club Aurore', singulier: 'membre du club Aurore' },
  { pluriel: 'abonnés de la revue Borée', singulier: 'abonné de la revue Borée' },
  { pluriel: 'habitants du quartier Cévennes', singulier: 'habitant du quartier Cévennes' },
  { pluriel: 'adhérents de la coopérative Dune', singulier: 'adhérent de la coopérative Dune' },
  { pluriel: 'diplômés de l’institut Érable', singulier: 'diplômé de l’institut Érable' },
  { pluriel: 'salariés du site Fontaine', singulier: 'salarié du site Fontaine' },
  { pluriel: 'inscrits au programme Gaïa', singulier: 'inscrit au programme Gaïa' },
  { pluriel: 'titulaires du label Halage', singulier: 'titulaire du label Halage' },
  { pluriel: 'lecteurs du bulletin Iris', singulier: 'lecteur du bulletin Iris' },
  { pluriel: 'bénévoles de l’association Jade', singulier: 'bénévole de l’association Jade' },
]

const tous = (e: Ensemble) => `tous les ${e.pluriel}`
const aux = (e: Ensemble) => `aux ${e.pluriel}`
const aucun = (e: Ensemble) => `aucun ${e.singulier}`
const certains = (e: Ensemble) => `certains ${e.pluriel}`

function troisEnsembles(a: Alea): [Ensemble, Ensemble, Ensemble] {
  const t = a.melanger(ENSEMBLES).slice(0, 3)
  return [t[0], t[1], t[2]]
}

/**
 * Conditionnel : la contraposée est valide, la réciproque et l'inverse ne le
 * sont pas. C'est la question la plus rentable du sous-test, parce que les
 * trois formes se ressemblent et qu'une seule suit.
 */
const conditionnel: Famille = {
  skillId: SKILL.premisse,
  nom: 'contraposée',
  produire(a) {
    const [p, q] = troisEnsembles(a)

    const contraposee = `Qui n’appartient pas ${aux(q)} n’appartient pas ${aux(p)}.`
    const reciproque = `${capitale(tous(q))} appartiennent ${aux(p)}.`
    const inverse = `Qui n’appartient pas ${aux(p)} n’appartient pas ${aux(q)}.`
    const exclusion = `${capitale(aucun(p))} n’appartient ${aux(q)}.`
    const partielle = `${capitale(certains(q))} n’appartiennent pas ${aux(p)}.`

    const { options, bonneReponse, diagnostics } = qcmTexte(a, contraposee, [
      [reciproque, 'c’est la RÉCIPROQUE (« tous les Q sont P ») : elle retourne l’inclusion, qui n’est pas symétrique'],
      [inverse, 'c’est l’INVERSE (« non-P donc non-Q ») : elle nie les deux termes sans les échanger'],
      [exclusion, 'elle contredit la prémisse : les P sont justement TOUS dans Q'],
      [partielle, 'rien dans la prémisse ne dit ce que font les Q qui ne sont pas P'],
    ])

    return {
      section: S,
      skillId: SKILL.premisse,
      typeItem: 'qcm',
      enonce:
        `${capitale(tous(p))} appartiennent ${aux(q)}.\n` +
        `Si cette affirmation est vraie, laquelle des conclusions suivantes l’est nécessairement ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« Tous les P sont Q » n’autorise que la contraposée : non-Q ⇒ non-P.`,
      explication:
        `1. Réécrire la prémisse en P et Q : « tous les P sont Q », c'est-à-dire P ⇒ Q. ` +
        `Ici P = ${p.pluriel}, Q = ${q.pluriel}.\n` +
        `2. Une implication n'autorise qu'UNE conclusion : sa contraposée, non-Q ⇒ non-P. ` +
        `Toutes les autres formes sont invalides, et il n'y a pas d'exception.\n` +
        `3. Ici la contraposée s'écrit : « ${contraposee} » — c'est la réponse.\n` +
        `4. Les trois formes à ne jamais confondre avec elle :\n` +
        `   • la RÉCIPROQUE Q ⇒ P (« ${reciproque} ») — elle retourne l'inclusion, qui n'est pas ` +
        `symétrique. C'est le leurre numéro un du sous-test.\n` +
        `   • l'INVERSE non-P ⇒ non-Q (« ${inverse} ») — elle nie sans échanger. Invalide aussi.\n` +
        `   • toute affirmation sur les Q qui ne sont pas P : la prémisse n'en dit rien.\n` +
        `Le dessin qui règle tout : un cercle P entièrement dedans un cercle Q. Sortir de Q, c'est ` +
        `forcément sortir de P (contraposée). Mais être dans Q ne dit pas qu'on est dans P.`,
      difficulte: 3,
    }
  },
}

/**
 * Syllogismes.
 *
 * Chaque forme reçoit les trois ensembles dans le même ordre, prémisses et
 * conclusion comprises : une permutation de paramètres suffirait à produire un
 * énoncé dont la bonne réponse ne suivrait de rien.
 *
 * Chaque forme porte AUSSI ses propres leurres, et c'est indispensable : une
 * conclusion invalide pour une forme peut être vraie pour une autre. « Aucun Q
 * n'appartient aux R » est un leurre acceptable derrière des prémisses
 * transitives, mais c'est la reformulation exacte de la mineure du premier
 * syllogisme — donc une seconde bonne réponse. Les leurres retenus ici ne
 * suivent d'aucune des deux lectures possibles, avec ou sans import
 * existentiel : « tous les P sont R » entraîne « certains P sont R » chez
 * Aristote mais pas en logique moderne, et une question ne peut pas reposer
 * sur ce désaccord.
 */
interface FormeSyllogisme {
  majeure: (p: Ensemble, q: Ensemble, r: Ensemble) => string
  mineure: (p: Ensemble, q: Ensemble, r: Ensemble) => string
  conclusion: (p: Ensemble, q: Ensemble, r: Ensemble) => string
  /** Chaque leurre porte le motif qui le disqualifie : c'est ce qui est rendu en correction. */
  leurres: Array<{ texte: (p: Ensemble, q: Ensemble, r: Ensemble) => string; motif: string }>
  motif: string
  defauts: string
  /** Le dessin des trois cercles, en une ligne. */
  schema: string
}

const VALIDES: FormeSyllogisme[] = [
  {
    majeure: (p, q) => `${capitale(tous(p))} appartiennent ${aux(q)}.`,
    mineure: (_p, q, r) => `${capitale(aucun(r))} n’appartient ${aux(q)}.`,
    conclusion: (p, _q, r) => `${capitale(aucun(p))} n’appartient ${aux(r)}.`,
    leurres: [
      { texte: (p, _q, r) => `${capitale(tous(r))} appartiennent ${aux(p)}.`, motif: 'elle fait entrer le troisième ensemble dans le premier, alors que les prémisses les séparent' },
      { texte: (p, _q, r) => `${capitale(certains(p))} appartiennent ${aux(r)}.`, motif: 'elle fait se rencontrer deux ensembles que les prémisses excluent l’un de l’autre' },
      { texte: (p, q) => `${capitale(tous(q))} appartiennent ${aux(p)}.`, motif: 'c’est la réciproque de la majeure : l’inclusion ne se retourne pas' },
      { texte: (p, q) => `${capitale(aucun(p))} n’appartient ${aux(q)}.`, motif: 'elle contredit la majeure, qui place justement tous les P dans Q' },
    ],
    motif:
      'le premier ensemble est entièrement contenu dans le deuxième, dont le troisième est entièrement exclu : le premier et le troisième ne peuvent donc pas se rencontrer',
    defauts:
      'les autres propositions retournent une inclusion qui ne se retourne pas, font se rencontrer deux ensembles que les prémisses séparent, ou contredisent la majeure',
    schema:
      'un petit cercle P dans un grand cercle Q, et un cercle R posé complètement en dehors de Q. ' +
      'P est enfermé dans Q, R n’y met pas un pied : P et R ne peuvent pas se toucher',
  },
  {
    majeure: (p, q) => `${capitale(tous(p))} appartiennent ${aux(q)}.`,
    mineure: (_p, q, r) => `${capitale(tous(q))} appartiennent ${aux(r)}.`,
    conclusion: (p, _q, r) => `${capitale(tous(p))} appartiennent ${aux(r)}.`,
    leurres: [
      { texte: (p, _q, r) => `${capitale(tous(r))} appartiennent ${aux(p)}.`, motif: 'c’est l’inclusion retournée de bout en bout : R est le plus grand ensemble, il ne rentre pas dans le plus petit' },
      { texte: (p, q) => `${capitale(tous(q))} appartiennent ${aux(p)}.`, motif: 'c’est la réciproque de la majeure : l’inclusion ne se retourne pas' },
      { texte: (p, _q, r) => `${capitale(aucun(p))} n’appartient ${aux(r)}.`, motif: 'elle affirme le contraire de ce que les prémisses établissent' },
      { texte: (_p, q, r) => `${capitale(certains(r))} n’appartiennent pas ${aux(q)}.`, motif: 'rien dans les prémisses ne garantit l’existence de tels R : c’est une exception ajoutée' },
    ],
    motif:
      'l’inclusion est transitive : ce qui vaut du premier au deuxième et du deuxième au troisième vaut du premier au troisième',
    defauts:
      'les autres propositions retournent une inclusion qui ne se retourne pas, contredisent ce que les prémisses établissent, ou ajoutent une exception que rien ne fonde',
    schema:
      'trois cercles emboîtés, P dans Q dans R. Tout ce qui est dans P est forcément dans R — ' +
      'mais l’inverse n’a aucune raison d’être vrai',
  },
]

const syllogisme: Famille = {
  skillId: SKILL.premisse,
  nom: 'syllogisme',
  produire(a) {
    const [p, q, r] = troisEnsembles(a)
    const forme = a.choix(VALIDES)
    const bonne = forme.conclusion(p, q, r)

    const candidats: Array<[string, string]> = forme.leurres.map((l) => [l.texte(p, q, r), l.motif])
    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      bonne,
      candidats.filter(([c]) => c !== bonne),
    )

    return {
      section: S,
      skillId: SKILL.premisse,
      typeItem: 'qcm',
      enonce:
        `${forme.majeure(p, q, r)}
${forme.mineure(p, q, r)}
` +
        `Si ces deux affirmations sont vraies, laquelle des conclusions suivantes l’est nécessairement ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« ${bonne} » — ${forme.motif}.`,
      explication:
        `1. Poser des lettres sur les trois ensembles, sinon les noms embrouillent : ` +
        `P = ${p.pluriel}, Q = ${q.pluriel}, R = ${r.pluriel}.\n` +
        `2. Dessiner. C'est la seule méthode qui tienne sur un syllogisme, et elle prend dix secondes : ` +
        `${forme.schema}.\n` +
        `3. Lire la conclusion sur le dessin : ${forme.motif}.\n` +
        `4. Réponse : « ${bonne} ».\n` +
        `La règle de tri, pour les quatre autres : ${forme.defauts}. ` +
        `Le test décisif — si l'on peut imaginer UN dessin qui respecte les deux prémisses et ` +
        `contredit la proposition, alors elle ne suit pas. « Nécessairement » veut dire « dans tous ` +
        `les dessins possibles », pas « dans celui auquel je pense ».`,
      difficulte: 4,
    }
  },
}

/* --------------------------------------------------- argumentation -- */

const PAR_ID = new Map(FAILLES.map((f) => [f.id, f]))

type Genre = 'affaiblit' | 'renforce' | 'presuppose' | 'sophisme'

const CONSIGNES: Record<Genre, string> = {
  affaiblit: 'Laquelle des propositions suivantes affaiblit le plus cet argument ?',
  renforce: 'Laquelle des propositions suivantes renforce le plus cet argument ?',
  presuppose: 'Sur laquelle des hypothèses suivantes cet argument repose-t-il nécessairement ?',
  sophisme: 'Quel défaut de raisonnement l’argument commet-il ?',
}

const SKILL_GENRE: Record<Genre, string> = {
  affaiblit: SKILL.affaiblir,
  renforce: SKILL.renforcer,
  presuppose: SKILL.hypothese,
  sophisme: SKILL.sophisme,
}

/** Fabrique la question demandée sur un scénario tiré au sort. */
function argument(a: Alea, genre: Genre): QuestionGeneree {
  const scenario = a.choix(SCENARIOS)
  const faille = PAR_ID.get(scenario.faille)
  if (!faille) throw new Error(`Faille inconnue : ${scenario.faille}`)

  const c = scenario.contexte
  const texte = capitaliserPhrases(scenario.texte(c))

  // Les leurres sont les remèdes des AUTRES failles : chacun est une phrase
  // sensée, applicable à un argument voisin, et fausse pour celui-ci. Un leurre
  // absurde n'apprendrait rien ; celui-ci oblige à nommer la faille.
  const autres = a.melanger(FAILLES.filter((f) => f.id !== faille.id))

  const bonne = genre === 'sophisme' ? faille.nom : faille[genre](c)
  const candidats: Array<[string, string]> =
    genre === 'sophisme'
      ? autres.map((f) => [f.nom, `ce défaut existe, mais ce n’est pas celui-ci : l’argument ne ${f.nom.toLowerCase()} pas`])
      : autres.map((f) => [
          f[genre](c),
          `cette proposition ${genre === 'affaiblit' ? 'affaiblirait' : genre === 'renforce' ? 'renforcerait' : 'serait l’hypothèse'} un argument bâti sur une autre faille (${f.nom.toLowerCase()}) — pas celui-ci`,
        ])

  const { options, bonneReponse, diagnostics } = qcmTexte(
    a,
    capitale(bonne),
    candidats
      .filter(([x]) => x !== bonne)
      .map(([x, motif]): [string, string] => [capitale(x), motif]),
  )

  const cle =
    genre === 'sophisme'
      ? `L’argument commet un défaut précis : ${faille.nom}.`
      : `L’argument repose sur une faille précise : ${faille.nom}. ` +
        (genre === 'affaiblit'
          ? `L’affaiblir, c’est attaquer cette faille — pas contester la conclusion de front.`
          : genre === 'renforce'
            ? `Le renforcer, c’est écarter cette faille.`
            : `L’hypothèse implicite, c’est exactement ce que la faille laisse dans l’ombre.`)

  const consigne: Record<Genre, string> = {
    affaiblit:
      `3. Affaiblir un argument, ce n'est pas contester sa conclusion de front : c'est attaquer ` +
      `le point faible du raisonnement. Ici, montrer que ${faille.nom.toLowerCase()} ne tient pas.`,
    renforce:
      `3. Renforcer un argument, c'est écarter sa faille — fermer la porte que le raisonnement ` +
      `avait laissée ouverte. Ici, exclure que ${faille.nom.toLowerCase()} explique le résultat.`,
    presuppose:
      `3. Une hypothèse implicite est ce que l'argument tient pour acquis sans le dire. ` +
      `C'est exactement ce que la faille laisse dans l'ombre : si l'hypothèse tombe, l'argument tombe.`,
    sophisme: `3. Nommer le défaut suppose de reconstituer le pas de raisonnement qui a été franchi trop vite.`,
  }

  return {
    section: S,
    skillId: SKILL_GENRE[genre],
    typeItem: 'qcm',
    enonce: `${texte}\n${CONSIGNES[genre]}`,
    options,
    bonneReponse,
    diagnostics,
    rappel: `Faille : ${faille.nom.toLowerCase()}. ${genre === 'sophisme' ? '' : `D'où « ${capitale(bonne)} »`}`.trim(),
    explication:
      `1. Séparer ce que l'argument affirme de ce qu'il prouve. ` +
      `Prémisses d'un côté, conclusion de l'autre, et regarder le pas entre les deux.\n` +
      `2. ${cle}\n` +
      `${consigne[genre]}\n` +
      `4. Réponse : « ${capitale(bonne)} ».\n` +
      `Les quatre autres propositions sont des phrases sensées — elles conviendraient à un argument ` +
      `bâti sur une AUTRE faille. C'est ce qui les rend tentantes, et fausses ici. ` +
      `D'où la méthode, qui vaut pour tout le sous-test : nommer la faille AVANT de lire les propositions. ` +
      `Les lire d'abord, c'est se laisser convaincre par la première qui sonne bien.`,
    difficulte: 4,
  }
}

function familleArgument(nom: string, genre: Genre): Famille {
  return { skillId: SKILL_GENRE[genre], nom, produire: (a) => argument(a, genre) }
}

export const FAMILLES_RAISONNEMENT: Famille[] = [
  conditionnel,
  syllogisme,
  familleArgument('affaiblir', 'affaiblit'),
  familleArgument('renforcer', 'renforce'),
  familleArgument('hypothèse implicite', 'presuppose'),
  familleArgument('sophisme', 'sophisme'),
  // Le seul type qui n'avait aucune question (paradoxes.ts).
  paradoxe,
]
