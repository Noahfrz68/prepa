/**
 * Atelier d'import — parseurs.
 *
 * Le contenu est un consommable (principe P1) : ces parseurs existent pour
 * avaler vite du texte que l'utilisateur colle, ou un CSV qu'il fournit.
 * Ils sont volontairement tolérants sur la forme et stricts sur la validation :
 * mieux vaut signaler un bloc douteux que d'insérer un item faux.
 *
 * Ils ne vont RIEN chercher sur Internet (spécification §9.7).
 */

export const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
export type Lettre = (typeof LETTRES)[number]

export interface ItemParse {
  enonce: string
  options: string[]
  bonneReponse: Lettre
  typeItem: 'qcm' | 'conditions_minimales'
  info1?: string
  info2?: string
  contexteTexte?: string
  explication?: string
  difficulte?: number
}

export interface ResultatParse {
  items: ItemParse[]
  avertissements: string[]
}

const RE_DEBUT_QUESTION = /^\s*(?:question\s*)?(\d{1,3})\s*[.)\]:-]\s+/i
const RE_OPTION = /^\s*\(?([A-Ea-e])\s*[).\]:-]\s*(.+)$/
const RE_REPONSE = /^\s*(?:bonne\s+)?(?:r[ée]ponse|correction|solution)\s*[:.\-]?\s*\(?([A-Ea-e])\)?\s*$/i
const RE_EXPLICATION = /^\s*(?:explication|justification|corrig[ée])\s*[:.\-]?\s*(.*)$/i
const RE_INFO_1 = /^\s*\(?1\)\s*(.+)$/
const RE_INFO_2 = /^\s*\(?2\)\s*(.+)$/

/**
 * Découpe un texte collé en blocs. Deux stratégies, dans cet ordre :
 * les lignes vides si elles séparent effectivement les questions, sinon la
 * numérotation des questions.
 */
export function decouperBlocs(texte: string): string[] {
  const normalise = texte.replace(/\r\n?/g, '\n').trim()
  if (!normalise) return []

  const parLignesVides = normalise
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  if (parLignesVides.length > 1) return parLignesVides

  // Pas de ligne vide exploitable : on retombe sur la numérotation.
  const lignes = normalise.split('\n')
  const blocs: string[] = []
  let courant: string[] = []

  for (const ligne of lignes) {
    // Une ligne d'option ne doit pas être confondue avec un début de question.
    if (RE_DEBUT_QUESTION.test(ligne) && !RE_OPTION.test(ligne) && courant.length > 0) {
      blocs.push(courant.join('\n').trim())
      courant = []
    }
    courant.push(ligne)
  }
  if (courant.length > 0) blocs.push(courant.join('\n').trim())

  return blocs.filter(Boolean)
}

function parserBloc(bloc: string, index: number): { item?: ItemParse; avertissement?: string } {
  const lignes = bloc
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const enonceLignes: string[] = []
  const options: (string | undefined)[] = []
  let bonneReponse: Lettre | undefined
  let explication: string | undefined
  let info1: string | undefined
  let info2: string | undefined
  let dansExplication = false
  /**
   * La proposition en cours, quand elle court sur plusieurs lignes.
   *
   * Sans ce suivi, seule la PREMIÈRE ligne d'une proposition était retenue et
   * la suite tombait dans l'énoncé. Sur un sous-test d'orthographe, où les cinq
   * propositions sont la même phrase à quelques lettres près, la coupure les
   * rendait identiques — et la question n'avait plus de réponse.
   */
  let optionCourante: number | null = null

  for (const ligne of lignes) {
    const mReponse = ligne.match(RE_REPONSE)
    if (mReponse) {
      bonneReponse = mReponse[1].toUpperCase() as Lettre
      dansExplication = false
      optionCourante = null
      continue
    }

    const mExplication = ligne.match(RE_EXPLICATION)
    if (mExplication) {
      explication = mExplication[1] || ''
      dansExplication = true
      optionCourante = null
      continue
    }

    const mOption = ligne.match(RE_OPTION)
    if (mOption) {
      const rang = LETTRES.indexOf(mOption[1].toUpperCase() as Lettre)
      if (rang >= 0) {
        options[rang] = mOption[2].trim()
        optionCourante = rang
        dansExplication = false
        continue
      }
    }

    const mInfo1 = ligne.match(RE_INFO_1)
    if (mInfo1 && options.length === 0) {
      info1 = mInfo1[1].trim()
      dansExplication = false
      optionCourante = null
      continue
    }

    const mInfo2 = ligne.match(RE_INFO_2)
    if (mInfo2 && options.length === 0) {
      info2 = mInfo2[1].trim()
      dansExplication = false
      optionCourante = null
      continue
    }

    if (dansExplication) {
      explication = [explication, ligne].filter(Boolean).join(' ')
      continue
    }

    // Une ligne qui suit une proposition la CONTINUE : elle n'appartient pas à
    // l'énoncé, qui est déjà clos dès que la première proposition est apparue.
    if (optionCourante !== null) {
      options[optionCourante] = `${options[optionCourante]} ${ligne}`.trim()
      continue
    }

    enonceLignes.push(ligne.replace(RE_DEBUT_QUESTION, ''))
  }

  const enonce = enonceLignes.join(' ').trim()
  const estConditionsMinimales = Boolean(info1 && info2)
  const optionsPleines = options.filter((o): o is string => Boolean(o))

  if (!enonce) {
    return { avertissement: `Bloc ${index + 1} ignoré : énoncé introuvable.` }
  }
  if (!bonneReponse) {
    return {
      avertissement: `Bloc ${index + 1} ignoré : aucune bonne réponse détectée (attendu « Réponse : C »). Énoncé : « ${apercu(enonce)} »`,
    }
  }
  if (!estConditionsMinimales && optionsPleines.length < 2) {
    return {
      avertissement: `Bloc ${index + 1} ignoré : moins de deux propositions détectées. Énoncé : « ${apercu(enonce)} »`,
    }
  }
  if (!estConditionsMinimales && LETTRES.indexOf(bonneReponse) >= optionsPleines.length) {
    return {
      avertissement: `Bloc ${index + 1} ignoré : la réponse ${bonneReponse} ne correspond à aucune proposition. Énoncé : « ${apercu(enonce)} »`,
    }
  }

  return {
    item: {
      enonce,
      options: estConditionsMinimales ? [] : optionsPleines,
      bonneReponse,
      typeItem: estConditionsMinimales ? 'conditions_minimales' : 'qcm',
      info1,
      info2,
      explication: explication?.trim() || undefined,
    },
  }
}

function apercu(s: string, n = 60): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`
}

export function parserTexteColle(texte: string): ResultatParse {
  const blocs = decouperBlocs(texte)
  const items: ItemParse[] = []
  const avertissements: string[] = []

  blocs.forEach((bloc, i) => {
    const { item, avertissement } = parserBloc(bloc, i)
    if (item) items.push(item)
    if (avertissement) avertissements.push(avertissement)
  })

  if (blocs.length === 0) avertissements.push('Aucun bloc détecté dans le texte fourni.')

  return { items, avertissements }
}

/* ------------------------------------------------------------------ CSV -- */

/** Lecteur CSV minimal mais correct : gère les guillemets et les sauts de ligne. */
export function lireCsv(texte: string, separateur = ','): string[][] {
  const lignes: string[][] = []
  let champ = ''
  let ligne: string[] = []
  let entreGuillemets = false

  const src = texte.replace(/\r\n?/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const c = src[i]

    if (entreGuillemets) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          champ += '"'
          i++
        } else {
          entreGuillemets = false
        }
      } else {
        champ += c
      }
      continue
    }

    if (c === '"') {
      entreGuillemets = true
    } else if (c === separateur) {
      ligne.push(champ)
      champ = ''
    } else if (c === '\n') {
      ligne.push(champ)
      lignes.push(ligne)
      ligne = []
      champ = ''
    } else {
      champ += c
    }
  }

  if (champ !== '' || ligne.length > 0) {
    ligne.push(champ)
    lignes.push(ligne)
  }

  return lignes.filter((l) => l.some((c) => c.trim() !== ''))
}

function normaliserEntete(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** Devine le séparateur entre virgule et point-virgule (fréquent en France). */
export function devinerSeparateur(texte: string): string {
  const premiere = texte.replace(/\r\n?/g, '\n').split('\n')[0] ?? ''
  const virgules = (premiere.match(/,/g) ?? []).length
  const pointsVirgules = (premiere.match(/;/g) ?? []).length
  return pointsVirgules > virgules ? ';' : ','
}

const ALIAS: Record<string, string> = {
  question: 'enonce',
  intitule: 'enonce',
  enonce: 'enonce',
  a: 'option_a',
  b: 'option_b',
  c: 'option_c',
  d: 'option_d',
  e: 'option_e',
  option_a: 'option_a',
  option_b: 'option_b',
  option_c: 'option_c',
  option_d: 'option_d',
  option_e: 'option_e',
  reponse: 'bonne_reponse',
  bonne_reponse: 'bonne_reponse',
  correction: 'bonne_reponse',
  solution: 'bonne_reponse',
  explication: 'explication',
  justification: 'explication',
  contexte: 'contexte',
  texte: 'contexte',
  info_1: 'info_1',
  info1: 'info_1',
  info_2: 'info_2',
  info2: 'info_2',
  difficulte: 'difficulte',
}

export function parserCsv(texte: string): ResultatParse {
  const separateur = devinerSeparateur(texte)
  const lignes = lireCsv(texte, separateur)
  const avertissements: string[] = []

  if (lignes.length < 2) {
    return { items: [], avertissements: ['CSV vide ou sans ligne de données.'] }
  }

  const entetes = lignes[0].map((h) => ALIAS[normaliserEntete(h)] ?? normaliserEntete(h))
  const idxEnonce = entetes.indexOf('enonce')
  const idxReponse = entetes.indexOf('bonne_reponse')

  if (idxEnonce === -1 || idxReponse === -1) {
    return {
      items: [],
      avertissements: [
        `Colonnes obligatoires manquantes. Trouvé : ${entetes.join(', ') || '(aucune)'}. Attendu au minimum « enonce » et « bonne_reponse ».`,
      ],
    }
  }

  const cell = (l: string[], nom: string): string | undefined => {
    const i = entetes.indexOf(nom)
    const v = i === -1 ? undefined : l[i]?.trim()
    return v ? v : undefined
  }

  const items: ItemParse[] = []

  for (let n = 1; n < lignes.length; n++) {
    const l = lignes[n]
    const enonce = l[idxEnonce]?.trim()
    const brut = l[idxReponse]?.trim().toUpperCase().replace(/[()]/g, '')
    const bonneReponse = brut as Lettre

    if (!enonce) {
      avertissements.push(`Ligne ${n + 1} ignorée : énoncé vide.`)
      continue
    }
    if (!LETTRES.includes(bonneReponse)) {
      avertissements.push(`Ligne ${n + 1} ignorée : réponse « ${brut ?? ''} » invalide (attendu A à E).`)
      continue
    }

    const info1 = cell(l, 'info_1')
    const info2 = cell(l, 'info_2')
    const estCm = Boolean(info1 && info2)

    const options = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e']
      .map((nom) => cell(l, nom))
      .filter((o): o is string => Boolean(o))

    if (!estCm && options.length < 2) {
      avertissements.push(`Ligne ${n + 1} ignorée : moins de deux propositions.`)
      continue
    }
    if (!estCm && LETTRES.indexOf(bonneReponse) >= options.length) {
      avertissements.push(
        `Ligne ${n + 1} ignorée : la réponse ${bonneReponse} ne correspond à aucune proposition.`,
      )
      continue
    }

    const difficulteBrute = cell(l, 'difficulte')
    const difficulte = difficulteBrute ? Number(difficulteBrute) : undefined

    items.push({
      enonce,
      options: estCm ? [] : options,
      bonneReponse,
      typeItem: estCm ? 'conditions_minimales' : 'qcm',
      info1,
      info2,
      contexteTexte: cell(l, 'contexte'),
      explication: cell(l, 'explication'),
      difficulte:
        difficulte !== undefined && Number.isFinite(difficulte) && difficulte >= 1 && difficulte <= 5
          ? Math.round(difficulte)
          : undefined,
    })
  }

  return { items, avertissements }
}
