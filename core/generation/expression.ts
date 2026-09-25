/**
 * Sous-test 5 — Expression.
 *
 * Ici, rien ne se calcule : une phrase n'est correcte que parce que la langue
 * le dit. Le générateur ne fabrique donc pas la réponse, il la PUISE dans un
 * corpus écrit à la main (voir corpus-expression.ts) où chaque variante fautive
 * porte le nom de la règle qu'elle viole.
 *
 * La garantie n'est pas de même nature que pour le calcul, et il faut le dire :
 * elle repose sur la rédaction du corpus, pas sur une démonstration. Ce que le
 * générateur assure, c'est qu'une seule proposition est correcte dans chaque
 * question, et que l'explication nomme la faute des quatre autres — de sorte
 * qu'une erreur de corpus saute aux yeux en relecture au lieu de dormir en banque.
 */

import type { Alea } from './alea'
import { qcmTexte } from './qcm'
import type { Famille, QuestionGeneree } from './types'
import {
  CONNECTEURS,
  LEXIQUE,
  LIBELLE_RELATION,
  PAIRES,
  PHRASES,
  type PhraseSeed,
  type Relation,
} from './corpus-expression'

const S = 'expression' as const

const SKILL = {
  orthographe: 'tm.expression.orthographe',
  grammaire_et_conjugaison: 'tm.expression.grammaire_et_conjugaison',
  correction_syntaxique: 'tm.expression.correction_syntaxique',
  connecteurs: 'tm.expression.connecteurs_logiques',
  lexique: 'tm.expression.synonymes_et_antonymes',
} as const

/* ------------------------------------------------ trouver la correcte -- */

/**
 * Cinq variantes d'une même phrase, une seule correcte.
 *
 * C'est le format canonique du sous-test. Les quatre leurres ne diffèrent que
 * par un point précis, ce qui oblige à comparer plutôt qu'à lire.
 */
const phraseCorrecte: Famille = {
  skillId: SKILL.orthographe,
  nom: 'phrase correcte',
  produire(a) {
    const seed = a.choix(PHRASES)
    const fautives = a.melanger(seed.variantes).slice(0, 4)
    if (fautives.length < 4) throw new Error('Pas assez de variantes pour ce seed.')

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      seed.correcte,
      fautives.map((v): [string, string] => [v.texte, v.regle]),
    )

    return {
      section: S,
      skillId: SKILL[seed.skill],
      typeItem: 'qcm',
      enonce: 'Parmi les propositions suivantes, laquelle est correctement écrite ?',
      options,
      bonneReponse,
      diagnostics,
      rappel: `« ${seed.correcte} » — les quatre autres varient sur un seul point chacune.`,
      explication:
        `1. Les cinq propositions racontent la même chose : on ne les LIT pas, on les COMPARE. ` +
        `Repérer les endroits où elles divergent, et n'examiner que ces endroits-là.\n` +
        `2. La formulation correcte est : « ${seed.correcte} »\n` +
        `3. Ce qui cloche dans les autres, une faute à la fois :\n` +
        fautives.map((v) => `   • « ${v.texte} » — ${v.regle}`).join('\n') +
        `\nLes points sensibles à balayer en priorité sur ce format : accords du participe passé, ` +
        `homophones (a/à, ce/se, ces/ses, leur/leurs), mode après une conjonction, ` +
        `préposition attendue par le verbe.`,
      difficulte: 3,
    }
  },
}

/* -------------------------------------------------- trouver la fautive -- */

/**
 * Une phrase fautive au milieu de quatre phrases correctes.
 *
 * Le format inverse du précédent, et il est bien plus difficile : les cinq
 * phrases n'ayant rien à voir entre elles, on ne peut pas les comparer — il
 * faut lire chacune pour elle-même.
 */
const phraseFautive: Famille = {
  skillId: SKILL.orthographe,
  nom: 'phrase fautive',
  produire(a) {
    const seed = a.choix(PHRASES)
    const faute = a.choix(seed.variantes)

    // Les quatre autres viennent de seeds différents : la fautive ne doit pas
    // se repérer au fait qu'elle traite du même sujet que ses voisines.
    const autres = a
      .melanger(PHRASES)
      .filter((p: PhraseSeed) => p !== seed)
      .slice(0, 4)
    if (autres.length < 4) throw new Error('Corpus trop court pour ce format.')

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      faute.texte,
      autres.map((p): [string, string] => [p.correcte, 'cette phrase est correcte : rien à y reprendre']),
    )

    return {
      section: S,
      skillId: SKILL[seed.skill],
      typeItem: 'qcm',
      enonce: 'Parmi les propositions suivantes, laquelle comporte une faute ?',
      options,
      bonneReponse,
      diagnostics,
      rappel: `${faute.regle} Forme correcte : « ${seed.correcte} »`,
      explication:
        `1. Format inverse du précédent, et bien plus difficile : les cinq phrases n'ont rien à voir ` +
        `entre elles, on ne peut donc pas les comparer. Il faut relire chacune pour elle-même, ` +
        `en balayant les points sensibles : accords (sujet-verbe, participe passé), temps et modes, ` +
        `prépositions, homophones, doubles négations.\n` +
        `2. La phrase fautive est : « ${faute.texte} »\n` +
        `3. La règle violée : ${faute.regle}\n` +
        `4. Forme correcte : « ${seed.correcte} »\n` +
        `Les quatre autres phrases sont irréprochables. Si aucune faute ne saute aux yeux ` +
        `en une relecture, marquer la question et y revenir : sur ce format, s'acharner coûte ` +
        `plus cher que le point qu'on espère gagner.`,
      difficulte: 4,
    }
  },
}

/* --------------------------------------------------------- connecteurs -- */

const RELATIONS = Object.keys(CONNECTEURS) as Relation[]

const connecteur: Famille = {
  skillId: SKILL.connecteurs,
  nom: 'connecteur logique',
  produire(a) {
    const paire = a.choix(PAIRES)
    const bon = a.choix(CONNECTEURS[paire.relation])

    // Les leurres sont les connecteurs des AUTRES relations : ils sont
    // grammaticalement possibles et sémantiquement faux, ce qui oblige à
    // identifier le lien logique au lieu de choisir au son.
    const leurres = a
      .melanger(RELATIONS.filter((r) => r !== paire.relation))
      .map((r): [string, string] => [
        a.choix(CONNECTEURS[r]),
        `ce connecteur marque ${LIBELLE_RELATION[r]} — grammaticalement possible ici, mais ce n’est pas le lien entre les deux propositions`,
      ])

    const { options, bonneReponse, diagnostics } = qcmTexte(a, bon, leurres)

    return {
      section: S,
      skillId: SKILL.connecteurs,
      typeItem: 'qcm',
      enonce:
        `Quel connecteur complète correctement la phrase ?\n` +
        `${paire.gauche} … ${paire.droite}.`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Le lien est ${LIBELLE_RELATION[paire.relation]} : « ${bon} ».`,
      explication:
        `1. Le réflexe qui décide de tout : nommer le lien logique AVANT de regarder les propositions. ` +
        `Sinon on choisit au son, et les cinq connecteurs sonnent bien.\n` +
        `2. Première proposition : « ${paire.gauche} ». Seconde : « ${paire.droite} ». ` +
        `La seconde exprime ${LIBELLE_RELATION[paire.relation]} par rapport à la première.\n` +
        `3. Le seul connecteur qui porte ce lien est « ${bon} ».\n` +
        `4. Les quatre autres marquent ${RELATIONS.filter((r) => r !== paire.relation)
          .map((r) => LIBELLE_RELATION[r])
          .join(', ')} : toutes des relations réelles, aucune n'est celle du texte.\n` +
        `La liste à avoir en tête : cause, conséquence, opposition, concession, addition, ` +
        `condition, but. Sept relations, et presque toutes les questions de ce type s'y ramènent.`,
      difficulte: 2,
    }
  },
}

/* --------------------------------------------------------- lexique -- */

const synonyme: Famille = {
  skillId: SKILL.lexique,
  nom: 'synonyme',
  produire(a) {
    const e = a.choix(LEXIQUE)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, e.synonyme, [
      [e.antonyme, `c’est le CONTRAIRE de « ${e.mot} » — même champ de sens, sens inverse`],
      ...e.leurres.map((l): [string, string] => [
        l,
        `ce mot ressemble à « ${e.mot} » par la forme ou le registre, mais pas par le sens`,
      ]),
    ])

    return {
      section: S,
      skillId: SKILL.lexique,
      typeItem: 'qcm',
      enonce:
        `Par quel mot peut-on remplacer « ${e.mot} » sans changer le sens de la phrase ?\n` +
        `${e.contexte}`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« ${e.mot} » = « ${e.synonyme} ». Le contraire, « ${e.antonyme} », est dans la liste.`,
      explication:
        `1. Relire la phrase support, pas seulement le mot : un mot n'a de sens que dans son contexte, ` +
        `et c'est le contexte qui départage ses acceptions.\n` +
        `   « ${e.contexte} »\n` +
        `2. Dans cette phrase, « ${e.mot} » signifie « ${e.synonyme} ».\n` +
        `3. Le test qui tranche : remplacer le mot par chaque proposition et relire la phrase entière. ` +
        `Une seule la laisse intacte.\n` +
        `4. Réponse : « ${e.synonyme} ».\n` +
        `Le leurre le plus efficace du sous-test est « ${e.antonyme} » : c'est le contraire du mot, ` +
        `donc il appartient au même champ de sens et « sonne » juste. Lire la consigne — ` +
        `synonyme ou contraire — avant de regarder les propositions.`,
      difficulte: 3,
    }
  },
}

const antonyme: Famille = {
  skillId: SKILL.lexique,
  nom: 'antonyme',
  produire(a) {
    const e = a.choix(LEXIQUE)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, e.antonyme, [
      [e.synonyme, `c’est le SYNONYME de « ${e.mot} », pas son contraire — la consigne demandait l’inverse`],
      ...e.leurres.map((l): [string, string] => [
        l,
        `ce mot ressemble à « ${e.mot} » par la forme ou le registre, mais ne s’y oppose pas`,
      ]),
    ])

    return {
      section: S,
      skillId: SKILL.lexique,
      typeItem: 'qcm',
      enonce:
        `Quel mot exprime le contraire de « ${e.mot} » dans cette phrase ?\n` +
        `${e.contexte}`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« ${e.mot} » = « ${e.synonyme} », donc son contraire est « ${e.antonyme} ».`,
      explication:
        `1. La consigne demande le CONTRAIRE. C'est le premier mot à relire : le synonyme figure ` +
        `dans la liste, et c'est sur cette inattention que la question se perd.\n` +
        `2. Dans la phrase « ${e.contexte} », « ${e.mot} » signifie « ${e.synonyme} ».\n` +
        `3. L'opposé de ce sens-là est « ${e.antonyme} ».\n` +
        `4. Réponse : « ${e.antonyme} ». Le piège, « ${e.synonyme} », dit exactement la même chose ` +
        `que le mot de départ.\n` +
        `Méthode générale : passer par le sens du mot dans la phrase avant de chercher son contraire. ` +
        `Chercher directement un opposé, sans avoir fixé le sens, mène au contraire d'une autre acception.`,
      difficulte: 3,
    }
  },
}

export const FAMILLES_EXPRESSION: Famille[] = [
  phraseCorrecte,
  phraseFautive,
  connecteur,
  synonyme,
  antonyme,
]

export type { QuestionGeneree, Alea }
