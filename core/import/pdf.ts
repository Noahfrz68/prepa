/**
 * Import de PDF d'annales.
 *
 * Conçu sur la structure réelle des tests d'entraînement au format TAGE MAGE :
 * six sous-tests de 15 questions, puis un corrigé qui reprend les mêmes
 * sous-tests avec les bonnes réponses et leur justification.
 *
 * Deux passes : d'abord les questions, ensuite le corrigé, puis on les
 * apparie par (sous-test, numéro). Une question dont la réponse manque n'est
 * pas inventée — elle part en relecture avec sa réponse à compléter.
 *
 * Ce module ne télécharge rien : il traite un fichier que l'utilisateur ouvre
 * depuis son disque.
 */

import { LETTRES, type Lettre } from './parse'
import type { SectionTageMage } from '@/exams/tagemage'

/** Intitulés rencontrés dans les documents, vers nos identifiants de section. */
const SECTIONS: Array<{ motif: RegExp; id: SectionTageMage }> = [
  { motif: /COMPR[ÉE]HENSION\s+DE\s+TEXTES?/i, id: 'comprehension' },
  { motif: /RAISONNEMENT\s+ET\s+ARGUMENTATION/i, id: 'raisonnement' },
  { motif: /CONDITIONS\s+MINIMALES/i, id: 'conditions_minimales' },
  { motif: /EXPRESSION/i, id: 'expression' },
  { motif: /LOGIQUE/i, id: 'logique' },
  { motif: /CALCUL/i, id: 'calcul' },
]

const RE_QUESTION = /^\s*Question\s+(\d{1,3})\s*[.:)]?\s*(.*)$/i
const RE_CORRIGE_ITEM = /^\s*Corrig[ée]\s+(\d{1,3})\s*[.:)]?\s*(.*)$/i
const RE_REPONSE = /^\s*R[ée]ponse\s*[:.]?\s*\(?([A-E])\)?\s*$/i
const RE_OPTION = /^\s*\(?([A-E])\s*[).\]:-]\s*(.+)$/
/** Repère toutes les étiquettes d'option d'une ligne, pour la découper. */
const RE_OPTION_GLOBALE = /(?:^|\s)\(?([A-E])\)\s*/g
const RE_INFO = /^\s*\(?([12])\)\s*(.+)$/
const RE_SOUS_TEST = /^\s*SOUS[-\s]?TEST\s*\d*\s*[:.]?\s*(.+)$/i
const RE_CONSIGNES = /^\s*Consignes?\s*$/i
/**
 * En-tête d'un texte support : « Texte. 1 : La condition de l'homme moderne ».
 * Le titre est sur la même ligne — une version antérieure exigeait que la
 * ligne s'arrête après le numéro et ne matchait donc jamais, ce qui privait
 * toutes les questions de compréhension de leur passage.
 */
const RE_TEXTE_SUPPORT = /^\s*Textes?\s*[.:]?\s*(?:n°\s*)?(\d+)\s*[:.–-]?\s*(.*)$/i

/**
 * Rebuts de mise en page : numérotation, pied de page, mentions d'éditeur.
 * Les laisser polluerait les énoncés.
 */
const RE_REBUT = [
  /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/i,
  /^\s*Page\s+\d+\s*$/i,
  /^\s*\d+\s*$/,
  /Tous\s+droits\s+r[ée]serv[ée]s/i,
  /^\s*Dur[ée]e\s*:/i,
  /^\s*\d+\s+questions?\s*$/i,
  /_{5,}/,
]

export interface QuestionPdf {
  numero: number
  section: SectionTageMage
  enonce: string
  options: string[]
  contexte?: string
  /** Conditions minimales : les deux informations, propositions A-E figées. */
  info1?: string
  info2?: string
  bonneReponse?: Lettre
  explication?: string
}

/**
 * Découpe une ligne portant plusieurs propositions.
 *
 * Les sous-tests de calcul et de logique impriment les cinq réponses sur une
 * seule ligne — « A) 7% B) 9% C) 10% D) 11% E) 13% ». Sans ce découpage, tout
 * atterrit dans la proposition A et la question est rejetée.
 */
export function decouperOptionsEnLigne(ligne: string): Array<{ lettre: Lettre; texte: string }> {
  const marqueurs: Array<{ lettre: Lettre; debut: number; fin: number }> = []

  RE_OPTION_GLOBALE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_OPTION_GLOBALE.exec(ligne)) !== null) {
    marqueurs.push({
      lettre: m[1] as Lettre,
      debut: m.index,
      fin: m.index + m[0].length,
    })
  }

  // Une seule étiquette : ce n'est pas une ligne compacte, on laisse faire le
  // traitement normal (l'option peut être multiligne).
  if (marqueurs.length < 2) return []

  // Les étiquettes doivent se suivre dans l'ordre alphabétique, sinon c'est du
  // texte qui contient des parenthèses, pas une liste de propositions.
  for (let i = 1; i < marqueurs.length; i++) {
    if (LETTRES.indexOf(marqueurs[i].lettre) !== LETTRES.indexOf(marqueurs[i - 1].lettre) + 1) {
      return []
    }
  }

  return marqueurs.map((mk, i) => ({
    lettre: mk.lettre,
    texte: ligne.slice(mk.fin, marqueurs[i + 1]?.debut ?? ligne.length).trim(),
  }))
}

export interface ResultatPdf {
  questions: QuestionPdf[]
  /**
   * Questions dont l'énoncé est graphique : options présentes, énoncé absent.
   * Elles ne sont plus écartées mais remontées, pour qu'un rendu d'image
   * puisse leur donner leur contenu (voir core/import/figures.ts).
   */
  figures: QuestionPdf[]
  /** Questions dont la bonne réponse n'a pas été trouvée dans le corrigé. */
  sansReponse: number
  parSection: Record<string, number>
  avertissements: string[]
}

function estRebut(ligne: string): boolean {
  return RE_REBUT.some((r) => r.test(ligne))
}

function sectionDe(intitule: string): SectionTageMage | null {
  return SECTIONS.find((s) => s.motif.test(intitule))?.id ?? null
}

/**
 * Détecte un en-tête de section dans le corrigé.
 *
 * Exige que la ligne ENTIÈRE soit le titre. Un simple « contient le mot » a
 * produit un défaut grave : une phrase d'explication comme « la réponse est
 * logique » basculait la section, et les corrigés suivants étaient classés
 * sous le mauvais sous-test — donc attribués à de mauvaises questions. Un
 * corrigé mal apparié n'est pas une lacune, c'est une réponse fausse enseignée
 * comme vraie.
 */
function enTeteSection(ligne: string): SectionTageMage | null {
  const nu = ligne.trim().replace(/[.:_\s]+$/, '').trim()

  // Un titre est en capitales et ne contient pas de ponctuation de phrase.
  if (nu.length === 0 || nu.length > 45) return null
  if (/[.,;!?«»"']/.test(nu)) return null
  if (nu !== nu.toUpperCase()) return null

  return SECTIONS.find((s) => new RegExp(`^${s.motif.source}$`, 'i').test(nu))?.id ?? null
}

/**
 * Sépare la partie « test » de la partie « corrigé ».
 *
 * Le sommaire mentionne aussi « CORRIGÉ », suivi de traits de conduite : on
 * ne retient donc que la ligne isolée, sans soulignement.
 */
function couperAuCorrige(lignes: string[]): { test: string[]; corrige: string[] } {
  const i = lignes.findIndex((l) => /^\s*CORRIG[ÉE]\s*$/i.test(l))
  return i === -1
    ? { test: lignes, corrige: [] }
    : { test: lignes.slice(0, i), corrige: lignes.slice(i) }
}

/**
 * Habillage de fin de document : bandeaux promotionnels, adresses, mentions.
 *
 * Ils suivent la dernière explication du corrigé et s'y collaient. Une
 * explication est rédigée en phrases ; un bandeau est en capitales. C'est ce
 * qui les sépare, sans dépendre du nom de l'organisme.
 */
function estHabillage(ligne: string): boolean {
  const nu = ligne.trim()
  if (/https?:\/\/|www\./i.test(nu)) return true
  if (nu.length < 12 || nu !== nu.toUpperCase()) return false

  // Les séries de logique sont aussi en capitales : « SWO MXI JNQ GVZ ». Ce qui
  // les sépare d'un bandeau, c'est le mot — un groupe de trois lettres n'en est
  // pas un.
  return /[A-ZÀ-Þ]{5,}/.test(nu)
}


/** Bonnes réponses et justifications, indexées par section puis numéro. */
function lireCorrige(lignes: string[]): Map<string, { reponse: Lettre; explication: string }> {
  const cle = (s: string, n: number) => `${s}#${n}`
  const trouve = new Map<string, { reponse: Lettre; explication: string }>()

  let section: SectionTageMage | null = null
  let numero: number | null = null
  let reponse: Lettre | null = null
  let explication: string[] = []

  const cloturer = () => {
    if (section && numero !== null && reponse) {
      trouve.set(cle(section, numero), {
        reponse,
        explication: explication.join(' ').trim(),
      })
    }
    numero = null
    reponse = null
    explication = []
  }

  for (const brute of lignes) {
    const ligne = brute.trim()
    if (!ligne || estRebut(ligne)) continue

    // Dans le corrigé, les titres de section sont nus, sans « SOUS-TEST ».
    const s = enTeteSection(ligne)
    if (s) {
      cloturer()
      section = s
      continue
    }

    const mItem = ligne.match(RE_CORRIGE_ITEM)
    if (mItem) {
      cloturer()
      numero = Number(mItem[1])
      if (mItem[2].trim()) explication.push(mItem[2].trim())
      continue
    }

    const mReponse = ligne.match(RE_REPONSE)
    if (mReponse) {
      reponse = mReponse[1].toUpperCase() as Lettre
      continue
    }

    if (numero !== null && !estHabillage(ligne)) explication.push(ligne)
  }

  cloturer()
  return trouve
}

export function parserPdf(texte: string): ResultatPdf {
  const toutes = texte.replace(/\r\n?/g, '\n').split('\n')
  const { test, corrige } = couperAuCorrige(toutes)

  const reponses = lireCorrige(corrige)
  const avertissements: string[] = []
  const questions: QuestionPdf[] = []
  const figures: QuestionPdf[] = []

  let section: SectionTageMage | null = null
  // Le bloc de consignes précède les questions et n'est pas un texte support :
  // l'afficher comme tel montrerait la consigne de l'épreuve à la place du
  // passage à lire.
  let dansConsignes = false

  /**
   * Textes support.
   *
   * Ils ne sont capturés QUE derrière un en-tête explicite « Texte N : … ».
   * Sans ce point d'ancrage, rien ne distingue de façon fiable un passage
   * d'une consigne ou d'un pied de page : deux tentatives antérieures ont
   * produit l'une une consigne affichée comme un passage, l'autre de la prose
   * absorbée dans la dernière proposition d'une question — un item corrompu,
   * pire qu'un item incomplet. Hors de ce cadre, la prose est écartée et
   * comptée.
   */
  let contexte: string[] = []
  let dansTexte = false
  let proseEcartee = 0
  let courante: {
    numero: number
    enonce: string[]
    options: (string | undefined)[]
    info1?: string
    info2?: string
  } | null = null

  const cloturer = () => {
    if (!courante || !section) return

    const options = courante.options.filter((o): o is string => Boolean(o))
    const enonce = courante.enonce.join(' ').replace(/\s+/g, ' ').trim()
    const estCm = section === 'conditions_minimales'
    const cle = `${section}#${courante.numero}`
    const trouve = reponses.get(cle)

    // En conditions minimales, les cinq propositions sont figées et ne sont
    // pas imprimées avec la question : ce sont les deux informations qui font
    // l'item.
    if (estCm) {
      if (!enonce || !courante.info1 || !courante.info2) {
        avertissements.push(
          `Conditions minimales, question ${courante.numero} ignorée : informations (1) et (2) incomplètes.`,
        )
      } else {
        questions.push({
          numero: courante.numero,
          section,
          enonce,
          options: [],
          info1: courante.info1,
          info2: courante.info2,
          bonneReponse: trouve?.reponse,
          explication: trouve?.explication || undefined,
        })
      }
      courante = null
      return
    }

    // Énoncé absent : le contenu est graphique. On le remonte pour qu'un rendu
    // d'image lui redonne sa question, au lieu de l'écarter comme au lot 9.
    //
    // Deux formes coexistent en logique : figure + propositions écrites, et
    // figure dont les propositions sont elles aussi dessinées. Dans le second
    // cas il ne reste RIEN en texte ; on n'accepte alors la question que si le
    // corrigé lui donne une réponse, faute de quoi un simple faux « Question N »
    // suffirait à créer un item vide.
    if (!enonce) {
      if (options.length >= 2) {
        figures.push({
          numero: courante.numero,
          section,
          enonce: '',
          options,
          bonneReponse: trouve?.reponse,
          explication: trouve?.explication || undefined,
        })
      } else if (trouve?.reponse) {
        figures.push({
          numero: courante.numero,
          section,
          enonce: '',
          // Les propositions sont dans l'image : on ne garde que les repères.
          options: ['', '', '', '', ''],
          bonneReponse: trouve.reponse,
          explication: trouve.explication || undefined,
        })
      }
      courante = null
      return
    }

    if (options.length < 2) {
      avertissements.push(
        `Question ${courante.numero} ignorée : ${options.length} proposition(s) détectée(s) — « ${enonce.slice(0, 60)}… »`,
      )
    } else {
      questions.push({
        numero: courante.numero,
        section,
        enonce,
        options,
        contexte:
          contexte.length > 0 ? contexte.join(' ').replace(/\s+/g, ' ').trim() : undefined,
        bonneReponse: trouve?.reponse,
        explication: trouve?.explication || undefined,
      })
    }

    courante = null
  }

  for (const brute of test) {
    const ligne = brute.trim()
    if (!ligne || estRebut(ligne)) continue

    const mSousTest = ligne.match(RE_SOUS_TEST)
    if (mSousTest) {
      cloturer()
      const s = sectionDe(mSousTest[1])
      if (s) {
        section = s
        dansConsignes = false
        dansTexte = false
        contexte = []
      }
      continue
    }

    const mTexte = ligne.match(RE_TEXTE_SUPPORT)
    if (mTexte) {
      cloturer()
      dansConsignes = false
      dansTexte = true
      contexte = mTexte[2].trim() ? [mTexte[2].trim()] : []
      continue
    }

    if (RE_CONSIGNES.test(ligne)) {
      dansConsignes = true
      continue
    }

    // Un texte support ou la première question referme les consignes.
    if (dansConsignes && (RE_TEXTE_SUPPORT.test(ligne) || RE_QUESTION.test(ligne))) {
      dansConsignes = false
    }

    if (dansConsignes) continue

    const mQuestion = ligne.match(RE_QUESTION)
    if (mQuestion) {
      cloturer()
      // Le texte support est clos par la première question, mais reste
      // rattaché à toutes celles qui suivent jusqu'au texte suivant.
      dansTexte = false
      courante = { numero: Number(mQuestion[1]), enonce: [], options: [] }
      if (mQuestion[2].trim()) courante.enonce.push(mQuestion[2].trim())
      continue
    }

    if (!courante) {
      if (dansTexte) contexte.push(ligne)
      else if (section) proseEcartee++
      continue
    }

    // Conditions minimales : les lignes « (1) » et « (2) » portent l'item.
    if (section === 'conditions_minimales') {
      const mInfo = ligne.match(RE_INFO)
      if (mInfo) {
        if (mInfo[1] === '1') courante.info1 = mInfo[2].trim()
        else courante.info2 = mInfo[2].trim()
        continue
      }
      if (courante.info2) {
        courante.info2 = `${courante.info2} ${ligne}`.trim()
      } else if (courante.info1) {
        courante.info1 = `${courante.info1} ${ligne}`.trim()
      } else {
        courante.enonce.push(ligne)
      }
      continue
    }

    // Cinq propositions sur une seule ligne : cas du calcul et de la logique.
    const compactes = decouperOptionsEnLigne(ligne)
    if (compactes.length >= 2) {
      for (const o of compactes) {
        const rang = LETTRES.indexOf(o.lettre)
        if (rang >= 0) courante.options[rang] = o.texte
      }
      continue
    }

    const mOption = ligne.match(RE_OPTION)
    if (mOption) {
      const rang = LETTRES.indexOf(mOption[1].toUpperCase() as Lettre)
      if (rang >= 0) {
        courante.options[rang] = mOption[2].trim()
        continue
      }
    }

    // Tant qu'aucune proposition n'est vue, la ligne prolonge l'énoncé. Après,
    // c'est du texte support ou du pied de page : l'accrocher à la dernière
    // proposition la corromprait.
    if (courante.options.every((o) => !o)) {
      courante.enonce.push(ligne)
    } else {
      proseEcartee++
    }
  }

  cloturer()

  if (proseEcartee > 0) {
    avertissements.push(
      `${proseEcartee} ligne(s) de prose écartée(s), hors de tout en-tête « Texte N » : consignes d’épreuve, pieds de page ou passage non annoncé. Si une question de compréhension arrive sans son texte, colle-le à la main depuis la relecture.`,
    )
  }

  // L'extraction du texte perd le soulignement : une consigne qui renvoie au
  // « passage souligné » n'a plus rien pour le désigner à l'écran.
  const soulignees = questions.filter((q) => /soulign/i.test(q.enonce)).map((q) => q.numero)
  if (soulignees.length > 0) {
    avertissements.push(
      `Question(s) ${soulignees.join(', ')} : la consigne parle d’un passage souligné, mais le soulignement disparaît à l’extraction du PDF. En relecture, mets le passage entre « » et adapte la consigne (« passage entre guillemets »), ou « texte ci-dessous » si tout le texte est concerné.`,
    )
  }

  const sansReponse = questions.filter((q) => !q.bonneReponse).length
  if (sansReponse > 0) {
    avertissements.push(
      `${sansReponse} question(s) sans bonne réponse trouvée dans le corrigé : elles partent en relecture, la réponse est à compléter à la main. Aucune n’est inventée.`,
    )
  }

  if (questions.length === 0) {
    avertissements.push(
      'Aucune question détectée. Le document n’a peut-être pas la structure attendue (« Question N. » suivi de propositions A) à E)).',
    )
  }

  return {
    questions,
    figures,
    sansReponse,
    parSection: questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.section] = (acc[q.section] ?? 0) + 1
      return acc
    }, {}),
    avertissements,
  }
}

/** Extrait le texte d'un PDF. Isolé pour rester testable sans binaire. */
export async function texteDuPdf(donnees: Uint8Array): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  // pdfjs transfère le tampon à son worker, ce qui le détache : sans copie, un
  // second passage sur le même document (l'extraction des figures) échouerait.
  const parseur = new PDFParse({ data: donnees.slice() })
  try {
    const r = await parseur.getText()
    return r.text
  } finally {
    await parseur.destroy()
  }
}
