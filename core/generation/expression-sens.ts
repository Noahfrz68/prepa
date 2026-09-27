/**
 * Expression — reformulation, cohérence et registre.
 *
 * Deux types sans exercice : deux questions en banque chacun, jamais visés
 * par le plan. Comme le reste de l'expression, la réponse est puisée dans un
 * corpus écrit à la main (voir corpus-expression.ts), où chaque leurre porte
 * la raison de son erreur.
 */

import { qcmTexte } from './qcm'
import type { Famille } from './types'

/* ------------------------------------------------------ reformulation -- */

interface Reformulation {
  phrase: string
  fidele: string
  /** Le sens retourné. */
  inverse: string
  /** Une nuance (restriction, modalité, degré) perdue ou forcée. */
  nuance: string
  /** Le lien logique déplacé : la cause devient conséquence, la condition devient certitude. */
  lien: string
  /** Le propos glisse vers autre chose que ce que dit la phrase. */
  glissement: string
}

const MOTIFS_REFORMULATION = {
  inverse: 'elle dit le contraire de la phrase d’origine',
  nuance: 'elle perd ou force une nuance : la phrase d’origine ne dit pas cela avec cette force',
  lien: 'elle déplace le lien logique — cause, condition ou concession — de la phrase d’origine',
  glissement: 'elle parle d’autre chose : le propos a glissé',
} as const

export const REFORMULATIONS: Reformulation[] = [
  {
    phrase: 'Bien que le projet ait été salué par la critique, il n’a guère attiré le public.',
    fidele: 'Le projet a peu attiré le public, malgré l’accueil favorable de la critique.',
    inverse: 'Le projet a attiré un large public, malgré l’accueil réservé de la critique.',
    nuance: 'Le projet n’a attiré absolument personne, bien que la critique l’ait apprécié.',
    lien: 'C’est parce que la critique l’a salué que le projet a peu attiré le public.',
    glissement: 'La critique et le public jugent toujours les projets de la même façon.',
  },
  {
    phrase: 'Il n’est pas impossible que la réunion soit reportée.',
    fidele: 'Il se peut que la réunion soit reportée.',
    inverse: 'Il est exclu que la réunion soit reportée.',
    nuance: 'La réunion sera certainement reportée.',
    lien: 'La réunion sera reportée si les participants sont absents.',
    glissement: 'Il n’est pas possible de reporter une réunion.',
  },
  {
    phrase: 'Faute de financement, le chantier a été interrompu.',
    fidele: 'Le chantier a été interrompu parce que le financement manquait.',
    inverse: 'Le chantier a été mené à terme grâce au financement obtenu.',
    nuance: 'Le chantier a été légèrement ralenti par un financement un peu juste.',
    lien: 'L’interruption du chantier a fait perdre son financement au projet.',
    glissement: 'Les chantiers publics manquent souvent de financement.',
  },
  {
    phrase: 'Seuls les candidats ayant obtenu leur diplôme pourront s’inscrire.',
    fidele: 'Pour s’inscrire, il faut avoir obtenu son diplôme.',
    inverse: 'Les candidats diplômés ne pourront pas s’inscrire.',
    nuance: 'Les candidats diplômés seront inscrits d’office.',
    lien: 'Les candidats qui s’inscriront obtiendront ensuite leur diplôme.',
    glissement: 'L’inscription est ouverte à tous les candidats.',
  },
  {
    phrase: 'Plus on s’entraîne tôt, moins la dernière semaine est éprouvante.',
    fidele: 'Un entraînement commencé tôt rend la dernière semaine moins pénible.',
    inverse: 'Un entraînement commencé tôt rend la dernière semaine plus pénible.',
    nuance: 'Commencer tôt supprime toute difficulté pendant la dernière semaine.',
    lien: 'C’est parce que la dernière semaine est éprouvante qu’on s’entraîne tôt.',
    glissement: 'La dernière semaine d’entraînement est toujours la plus longue.',
  },
  {
    phrase: 'La mesure n’a pas fait baisser le chômage, mais elle en a freiné la hausse.',
    fidele: 'Le chômage a continué d’augmenter, mais moins vite grâce à la mesure.',
    inverse: 'La mesure a fait nettement baisser le chômage.',
    nuance: 'La mesure n’a eu strictement aucun effet sur le chômage.',
    lien: 'C’est la hausse du chômage qui a rendu la mesure inefficace.',
    glissement: 'Les mesures contre le chômage coûtent cher à l’État.',
  },
  {
    phrase: 'Rares sont les étudiants qui lisent intégralement les ouvrages conseillés.',
    fidele: 'Peu d’étudiants lisent en entier les ouvrages conseillés.',
    inverse: 'La plupart des étudiants lisent en entier les ouvrages conseillés.',
    nuance: 'Aucun étudiant ne lit en entier les ouvrages conseillés.',
    lien: 'Les ouvrages sont conseillés parce que les étudiants ne les lisent pas.',
    glissement: 'Les ouvrages conseillés aux étudiants sont trop nombreux.',
  },
  {
    phrase: 'À moins d’un imprévu, la livraison aura lieu jeudi.',
    fidele: 'Sauf imprévu, la livraison se fera jeudi.',
    inverse: 'Sauf imprévu, la livraison ne se fera pas jeudi.',
    nuance: 'La livraison aura lieu jeudi, quoi qu’il arrive.',
    lien: 'La livraison aura lieu jeudi seulement si un imprévu survient.',
    glissement: 'Les livraisons du jeudi sont souvent retardées.',
  },
  {
    phrase: 'L’auteur ne condamne pas la technique ; il en dénonce l’usage aveugle.',
    fidele: 'L’auteur critique non la technique elle-même, mais la façon irréfléchie dont on s’en sert.',
    inverse: 'L’auteur condamne la technique, quel qu’en soit l’usage.',
    nuance: 'L’auteur approuve sans réserve toute utilisation de la technique.',
    lien: 'L’auteur dénonce la technique parce qu’elle rend son usage aveugle.',
    glissement: 'L’auteur décrit l’histoire des techniques depuis l’Antiquité.',
  },
  {
    phrase: 'Si coûteuse qu’elle soit, cette formation reste un investissement rentable.',
    fidele: 'Même chère, cette formation finit par rapporter plus qu’elle ne coûte.',
    inverse: 'Cette formation est trop chère pour être rentable.',
    nuance: 'Cette formation est gratuite et rapporte beaucoup.',
    lien: 'C’est parce qu’elle est chère que cette formation est rentable.',
    glissement: 'Les formations coûteuses sont de plus en plus nombreuses.',
  },
]

export const reformulation: Famille = {
  skillId: 'tm.expression.reformulation',
  nom: 'reformulation fidèle',
  produire(a) {
    const r = a.choix(REFORMULATIONS)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, r.fidele, [
      [r.inverse, MOTIFS_REFORMULATION.inverse],
      [r.nuance, MOTIFS_REFORMULATION.nuance],
      [r.lien, MOTIFS_REFORMULATION.lien],
      [r.glissement, MOTIFS_REFORMULATION.glissement],
    ])
    return {
      section: 'expression',
      skillId: reformulation.skillId,
      typeItem: 'qcm',
      enonce: `Quelle proposition reformule le plus fidèlement la phrase suivante ?\n« ${r.phrase} »`,
      options,
      bonneReponse,
      diagnostics,
      rappel: 'Une reformulation garde le sens, les nuances et les liens logiques — elle ne change que les mots.',
      explication:
        `1. Repérer ce que la phrase affirme, avec quelle force, et quel lien elle établit (cause, condition, concession).\n` +
        `2. La bonne proposition garde les trois : « ${r.fidele} »\n` +
        `3. Les leurres échouent chacun sur un point : l’un retourne le sens, l’un force ou perd une nuance ` +
        `(« rare » n’est pas « aucun », « il se peut » n’est pas « certainement »), l’un déplace le lien logique, ` +
        `le dernier parle d’autre chose.\n` +
        `Le piège le plus fréquent est la nuance : une proposition presque juste, mais trop absolue.`,
      difficulte: 3,
    }
  },
}

/* ------------------------------------------------ cohérence et registre -- */

interface Registre {
  situation: string
  juste: string
  familier: string
  pompeux: string
  incoherent: string
  impropre: string
}

const MOTIFS_REGISTRE = {
  familier: 'registre familier : déplacé dans un écrit de cette nature',
  pompeux: 'registre ampoulé : la phrase se veut soutenue et devient pompeuse ou fautive',
  incoherent: 'incohérence logique : le connecteur ou la construction contredit ce qui est dit',
  impropre: 'impropriété : un mot employé dans un sens qu’il n’a pas',
} as const

export const REGISTRES: Registre[] = [
  {
    situation: 'Dans une lettre de candidature adressée à une école',
    juste: 'Je souhaite rejoindre votre programme pour approfondir ma formation en gestion.',
    familier: 'Franchement, votre programme, ça me brancherait bien pour la suite.',
    pompeux: 'Je me permets de solliciter l’insigne honneur d’être admis en votre auguste programme.',
    incoherent: 'Je souhaite rejoindre votre programme, donc je n’ai aucun intérêt pour la gestion.',
    impropre: 'Je souhaite rejoindre votre programme pour approfondir ma formation en gestation.',
  },
  {
    situation: 'Dans un courriel professionnel à un client',
    juste: 'Nous vous prions de bien vouloir nous excuser pour ce retard de livraison.',
    familier: 'Désolés pour le retard, ça arrive, hein.',
    pompeux: 'Veuillez agréer nos plus plates excuses pour ce funeste retard de livraison.',
    incoherent: 'Nous vous prions de nous excuser pour ce retard, puisque la livraison est arrivée en avance.',
    impropre: 'Nous vous prions de bien vouloir nous excuser pour ce retard de délivrance.',
  },
  {
    situation: 'Dans la conclusion d’un rapport de stage',
    juste: 'Ce stage m’a permis de mettre en pratique les méthodes d’analyse étudiées en cours.',
    familier: 'Ce stage, c’était top, j’ai appris plein de trucs.',
    pompeux: 'Ce stage fut pour moi l’occasion insigne d’éprouver la quintessence de mes savoirs.',
    incoherent: 'Ce stage m’a permis d’appliquer les méthodes étudiées, bien qu’il m’ait permis de les appliquer.',
    impropre: 'Ce stage m’a permis de mettre en pratique les méthodes d’analyse éludées en cours.',
  },
  {
    situation: 'Dans une note adressée à sa hiérarchie',
    juste: 'Je vous propose de reporter la réunion à la semaine prochaine, afin de disposer des chiffres définitifs.',
    familier: 'On pourrait décaler la réunion, les chiffres sont pas prêts.',
    pompeux: 'Il m’apparaît hautement opportun de procrastiner ladite réunion jusqu’à l’obtention des chiffres.',
    incoherent: 'Je vous propose de reporter la réunion afin de ne pas disposer des chiffres définitifs.',
    impropre: 'Je vous propose de reporter la réunion, afin de disposer des chiffres définis.',
  },
  {
    situation: 'Dans une dissertation',
    juste: 'Cette thèse, séduisante au premier abord, résiste mal à l’examen des faits.',
    familier: 'Cette thèse a l’air sympa, mais en vrai elle tient pas la route.',
    pompeux: 'Cette thèse, d’une séduction ineffable, se délite piteusement sous l’implacable scalpel des faits.',
    incoherent: 'Cette thèse, séduisante au premier abord, résiste donc parfaitement à l’examen des faits qui la réfutent.',
    impropre: 'Cette thèse, séduisante au premier abord, résiste mal à l’examen des effets.',
  },
  {
    situation: 'Dans un courrier de réclamation à une administration',
    juste: 'Je conteste le montant qui m’a été réclamé, pour les raisons exposées ci-dessous.',
    familier: 'Votre facture, là, elle est carrément à côté de la plaque.',
    pompeux: 'Je m’insurge avec la dernière véhémence contre cette ignominieuse réclamation pécuniaire.',
    incoherent: 'Je conteste le montant réclamé, que j’accepte donc pour les raisons ci-dessous.',
    impropre: 'Je conteste le montant qui m’a été déclamé, pour les raisons exposées ci-dessous.',
  },
  {
    situation: 'Dans l’introduction d’un exposé',
    juste: 'Nous verrons d’abord les causes de la crise, puis ses conséquences sur l’emploi.',
    familier: 'Alors, on va voir d’abord pourquoi c’est parti en vrille, puis ce que ça a fait.',
    pompeux: 'Nous nous proposons d’embrasser successivement l’étiologie et les retombées de ladite crise.',
    incoherent: 'Nous verrons d’abord les conséquences de la crise, puis ses causes, qui en découlent.',
    impropre: 'Nous verrons d’abord les causes de la crise, puis ses répercutions sur l’emploi.',
  },
  {
    situation: 'Dans un courriel à un professeur',
    juste: 'Pourriez-vous m’indiquer la date limite de remise du mémoire ?',
    familier: 'Salut, c’est quand qu’on rend le mémoire ?',
    pompeux: 'Daigneriez-vous m’éclairer quant à l’ultime échéance de la remise dudit mémoire ?',
    incoherent: 'Pourriez-vous m’indiquer la date limite, que je connais déjà, de remise du mémoire ?',
    impropre: 'Pourriez-vous m’indiquer la date limitrophe de remise du mémoire ?',
  },
  {
    situation: 'Dans un compte rendu de réunion',
    juste: 'Les participants ont validé le budget, sous réserve d’une révision en mars.',
    familier: 'Les gens ont dit OK pour le budget, mais faudra revoir ça en mars.',
    pompeux: 'L’assemblée a daigné entériner le budget, nonobstant une révision ultérieure en mars.',
    incoherent: 'Les participants ont rejeté le budget, qu’ils ont donc validé sous réserve d’une révision.',
    impropre: 'Les participants ont avalisé le budget, sous réserve d’une révocation en mars.',
  },
  {
    situation: 'Dans une lettre de motivation pour un stage',
    juste: 'Votre entreprise m’attire par la place qu’elle accorde à l’innovation.',
    familier: 'Votre boîte me plaît trop, vous innovez grave.',
    pompeux: 'Votre entreprise exerce sur ma personne une irrésistible fascination par son génie novateur.',
    incoherent: 'Votre entreprise m’attire par la place qu’elle accorde à l’innovation, qu’elle refuse d’ailleurs.',
    impropre: 'Votre entreprise m’attire par la place qu’elle accorde à l’inauguration.',
  },
]

export const registre: Famille = {
  skillId: 'tm.expression.coherence_et_registre',
  nom: 'cohérence et registre',
  produire(a) {
    const r = a.choix(REGISTRES)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, r.juste, [
      [r.familier, MOTIFS_REGISTRE.familier],
      [r.pompeux, MOTIFS_REGISTRE.pompeux],
      [r.incoherent, MOTIFS_REGISTRE.incoherent],
      [r.impropre, MOTIFS_REGISTRE.impropre],
    ])
    return {
      section: 'expression',
      skillId: registre.skillId,
      typeItem: 'qcm',
      enonce: `${r.situation}, quelle phrase convient le mieux ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: 'Registre courant et soutenu sans emphase, logique cohérente, mots dans leur sens exact.',
      explication:
        `1. Trois contrôles, dans l’ordre : le registre (ni familier, ni ampoulé), la cohérence (le connecteur dit-il ` +
        `ce que la phrase fait ?), la propriété des mots (chaque mot dans son vrai sens).\n` +
        `2. La bonne phrase passe les trois : « ${r.juste} »\n` +
        `3. Les leurres échouent chacun sur un point : un registre familier, une emphase pompeuse, une ` +
        `contradiction logique, un mot pris pour un autre (paronyme).\n` +
        `Le piège : croire que « plus soutenu » veut dire « meilleur ». Un écrit professionnel est sobre.`,
      difficulte: 2,
    }
  },
}

export const FAMILLES_EXPRESSION_SENS: Famille[] = [reformulation, registre]
