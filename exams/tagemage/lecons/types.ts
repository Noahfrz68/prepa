import type { SectionTageMage } from '../index'

/**
 * Une leçon : la technique d'un type de question, de bout en bout.
 *
 * Les fiches de `cours.ts` disent la CONDUITE d'un sous-test — dans quel ordre
 * traiter les questions, quand renoncer. Elles ne disent pas comment on résout.
 * C'est ce que les leçons ajoutent : la règle, la formule, l'exemple déroulé,
 * et l'erreur qui coûte le point.
 *
 * Une leçon par sous-compétence, sans exception. C'est ce découpage-là que
 * l'application mesure déjà : un taux faible sur « vitesses, débits et
 * mélanges » doit renvoyer vers la page qui explique la moyenne harmonique, et
 * pas vers un chapitre « calcul » de huit mille signes où il faut la chercher.
 */
export interface Lecon {
  /** La sous-compétence mesurée à laquelle la leçon répond. */
  skillId: string
  section: SectionTageMage
  titre: string
  /** À quoi sert cette technique, en une phrase, avant toute formule. */
  quoi: string
  /** Les règles à connaître. Ordonnées : on lit de haut en bas. */
  regles: Array<{ titre: string; texte: string }>
  /**
   * Un exemple déroulé jusqu'au bout.
   *
   * Une règle énoncée ne s'applique pas toute seule ; c'est l'exemple qui la
   * rend utilisable, et c'est lui qu'on relit la veille de l'épreuve.
   */
  exemple: { enonce: string; etapes: string[]; reponse: string }
  /**
   * Un second exercice, à faire seul.
   *
   * L'exemple résolu fait comprendre ; il ne fait pas acquérir. Le passage de
   * l'un à l'autre est ce que la recherche sur l'apprentissage appelle
   * l'estompage : on retire progressivement l'étayage. Ici en deux temps —
   * entièrement résolu, puis à faire seul avec un indice si l'on cale.
   */
  aToi: { enonce: string; indice: string; reponse: string }
  /**
   * Trois questions à se poser AVANT de lire, réponse masquée.
   *
   * Relire un cours donne le sentiment de le savoir sans le savoir. Se forcer à
   * ressortir l'information sans l'avoir sous les yeux — la récupération active —
   * bat la relecture dans toutes les études sur la mémorisation, et c'est le
   * seul geste que le cours ne demandait nulle part.
   */
  retrouver: Array<{ q: string; r: string }>
  /** L'erreur que ce type de question teste. */
  piege: string
  /** Ce qui doit être su sans réfléchir. Facultatif. */
  parCoeur?: string[]
}
