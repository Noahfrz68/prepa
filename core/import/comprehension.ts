/**
 * Import des séries de compréhension de textes au format Markdown.
 *
 * Le sous-test 1 est le seul qu'aucun générateur ne peut fabriquer : il lui
 * faut de vrais textes. Ce module lit un format structuré — trois textes, des
 * questions numérotées, un corrigé — et en tire des items complets, texte
 * support compris.
 *
 * La différence avec l'extraction PDF tient au risque : ici la structure est
 * explicite, et ce qui peut casser n'est pas la lecture des caractères mais la
 * MISE EN CORRESPONDANCE — une question rattachée au mauvais texte, une réponse
 * décalée d'un rang. C'est donc cela que les contrôles vérifient, et non la
 * forme des lignes.
 */

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
export type Lettre = (typeof LETTRES)[number]

const RE_TITRE_TEXTE = /^##\s+TEXTE\s+(.+?)\s*$/i
const RE_QUESTION = /^\*\*Questions?\s+(\d{1,3})\.?\*\*\s*(.*)$/i
const RE_OPTION = /^([A-E])\.\s+(.+)$/
const RE_CORRIGE_ENTETE = /^#\s+CORRIG/i
const RE_CORRIGE_ITEM = /^\*\*(\d{1,3})\s*[—–-]\s*([A-E])\.?\*\*\s*(.*)$/
const RE_REGLE = /^>\s*\*?(.*?)\*?\s*$/
const RE_SEPARATEUR = /^-{3,}$/

export interface TexteSupport {
  /** Étiquette d'origine : « A », « 1 »… Sert à tracer une erreur jusqu'au fichier. */
  cle: string
  contenu: string
}

export interface QuestionComprehension {
  numero: number
  texteCle: string
  contexte: string
  enonce: string
  options: string[]
  bonneReponse?: Lettre
  explication?: string
}

export interface ResultatComprehension {
  fichier: string
  textes: TexteSupport[]
  questions: QuestionComprehension[]
  avertissements: string[]
}

/** Enlève le balisage Markdown résiduel d'une ligne d'explication. */
function nettoyer(ligne: string): string {
  return ligne
    .replace(/^>\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim()
}

export function parserComprehension(fichier: string, contenu: string): ResultatComprehension {
  const lignes = contenu.replace(/\r\n?/g, '\n').split('\n')
  const avertissements: string[] = []

  const coupure = lignes.findIndex((l) => RE_CORRIGE_ENTETE.test(l))
  const corps = coupure < 0 ? lignes : lignes.slice(0, coupure)
  const corrige = coupure < 0 ? [] : lignes.slice(coupure)

  if (coupure < 0) avertissements.push(`${fichier} : aucun corrigé trouvé.`)

  /* ------------------------------------------------ textes et questions -- */

  const textes: TexteSupport[] = []
  const questions: QuestionComprehension[] = []

  let texteCourant: { cle: string; paragraphes: string[] } | null = null
  let questionCourante: QuestionComprehension | null = null

  const cloturerTexte = () => {
    if (!texteCourant) return
    const contenuTexte = texteCourant.paragraphes.join('\n\n').trim()
    if (contenuTexte.length > 0) textes.push({ cle: texteCourant.cle, contenu: contenuTexte })
    texteCourant = null
  }

  for (const brute of corps) {
    const ligne = brute.trim()

    const mTitre = ligne.match(RE_TITRE_TEXTE)
    if (mTitre) {
      questionCourante = null
      cloturerTexte()
      texteCourant = { cle: mTitre[1], paragraphes: [] }
      continue
    }

    const mQuestion = ligne.match(RE_QUESTION)
    if (mQuestion) {
      const texte = textes[textes.length - 1]
      questionCourante = {
        numero: Number(mQuestion[1]),
        texteCle: texteCourant?.cle ?? texte?.cle ?? '',
        // Le texte courant est refermé dès la première question : tout ce qui
        // suit appartient au questionnaire, pas au passage à lire.
        contexte: '',
        enonce: mQuestion[2].trim(),
        options: [],
      }
      cloturerTexte()
      questionCourante.contexte = textes[textes.length - 1]?.contenu ?? ''
      questions.push(questionCourante)
      continue
    }

    if (questionCourante) {
      const mOption = ligne.match(RE_OPTION)
      if (mOption) {
        const rang = LETTRES.indexOf(mOption[1] as Lettre)
        // Les propositions se suivent : une lettre hors rang signale un
        // paragraphe qui commence par « B. » plutôt qu'une proposition.
        if (rang === questionCourante.options.length) {
          questionCourante.options.push(mOption[2].trim())
          continue
        }
      }
      // Un énoncé peut déborder sur la ligne suivante tant qu'aucune
      // proposition n'a encore été lue.
      if (ligne.length > 0 && !RE_SEPARATEUR.test(ligne) && questionCourante.options.length === 0) {
        questionCourante.enonce = `${questionCourante.enonce} ${ligne}`.trim()
      }
      continue
    }

    if (texteCourant) {
      if (ligne.length === 0 || RE_SEPARATEUR.test(ligne)) continue
      if (ligne.startsWith('#') || ligne.startsWith('>') || ligne.startsWith('|')) continue
      texteCourant.paragraphes.push(ligne)
    }
  }

  cloturerTexte()

  /* -------------------------------------------------------- le corrigé -- */

  const reponses = new Map<number, { lettre: Lettre; explication: string[] }>()
  let courant: { lettre: Lettre; explication: string[] } | null = null

  for (const brute of corrige) {
    const ligne = brute.trim()

    const mItem = ligne.match(RE_CORRIGE_ITEM)
    if (mItem) {
      courant = { lettre: mItem[2] as Lettre, explication: [] }
      if (mItem[3].trim()) courant.explication.push(nettoyer(mItem[3]))
      reponses.set(Number(mItem[1]), courant)
      continue
    }

    if (!courant) continue

    // La « règle ST1 » qui suit certaines corrections est de l'enseignement,
    // pas de la décoration : on la garde dans l'explication.
    if (RE_REGLE.test(ligne) && ligne.startsWith('>')) {
      const regle = nettoyer(ligne)
      if (regle) courant.explication.push(regle)
      continue
    }

    // Une grille de score ou un bilan méthodologique ferme le corrigé.
    if (ligne.startsWith('#') || ligne.startsWith('|')) {
      courant = null
      continue
    }

    if (ligne.length > 0 && !RE_SEPARATEUR.test(ligne)) courant.explication.push(nettoyer(ligne))
  }

  for (const q of questions) {
    const r = reponses.get(q.numero)
    if (!r) continue
    q.bonneReponse = r.lettre
    q.explication = r.explication.join(' ').trim() || undefined
  }

  return { fichier, textes, questions, avertissements }
}

/* ----------------------------------------------------------- contrôles -- */

export interface AnomalieComprehension {
  fichier: string
  numero: number
  motif: string
}

/**
 * Contrôles de mise en correspondance.
 *
 * Le format est régulier : ce qui peut casser, c'est l'appariement. Une
 * question rattachée au mauvais passage ou décalée d'un rang dans le corrigé
 * produirait un item plausible et faux — le pire des cas, parce qu'il ne se
 * voit qu'en le travaillant.
 *
 * Le dernier contrôle est le plus utile : les explications du corrigé citent
 * souvent le texte entre guillemets. Retrouver ces citations dans le passage
 * rattaché vérifie l'appariement question ↔ texte pour de bon, au lieu de se
 * fier à l'ordre des lignes.
 */
export function anomaliesComprehension(r: ResultatComprehension): AnomalieComprehension[] {
  const anomalies: AnomalieComprehension[] = []
  const ajouter = (numero: number, motif: string) =>
    anomalies.push({ fichier: r.fichier, numero, motif })

  for (const q of r.questions) {
    if (q.options.length !== 5) ajouter(q.numero, `${q.options.length} proposition(s) au lieu de 5`)
    if (new Set(q.options).size !== q.options.length) ajouter(q.numero, 'propositions en double')
    if (!q.bonneReponse) ajouter(q.numero, 'aucune réponse au corrigé')
    if (q.enonce.length < 15) ajouter(q.numero, `énoncé de ${q.enonce.length} caractères`)
    if (q.contexte.length < 400) {
      ajouter(q.numero, `texte support de ${q.contexte.length} caractères, trop court pour un passage`)
    }
    if (!q.explication) ajouter(q.numero, 'aucune explication au corrigé')

    // Appariement question ↔ texte. Exiger la citation mot pour mot ne marche
    // pas : le corrigé les adapte couramment (« Elles ne sont pas plus fiables »
    // pour « Les disciplines qui n'ont pas connu de crise… »). On compare donc
    // le recouvrement lexical de la citation avec CHAQUE texte du fichier :
    // si un autre passage colle nettement mieux que celui rattaché, c'est que
    // la question est accrochée au mauvais texte — et cela, aucune relecture
    // rapide ne le verrait.
    for (const citation of citations(q.explication ?? '')) {
      const scores = r.textes.map((t) => ({ cle: t.cle, score: recouvrement(citation, t.contenu) }))
      const sien = scores.find((x) => x.cle === q.texteCle)?.score ?? 0
      const meilleur = scores.reduce((a, b) => (b.score > a.score ? b : a))

      if (meilleur.score > sien + 0.2) {
        ajouter(
          q.numero,
          `la citation « ${apercu(citation)} » correspond mieux au texte ${meilleur.cle} ` +
            `(${Math.round(meilleur.score * 100)} %) qu'au texte ${q.texteCle} (${Math.round(sien * 100)} %)`,
        )
      } else if (sien < 0.4) {
        ajouter(
          q.numero,
          `la citation « ${apercu(citation)} » ne se retrouve pas dans le texte ${q.texteCle} ` +
            `(${Math.round(sien * 100)} % de mots communs)`,
        )
      }
    }
  }

  return anomalies
}

/** Fragments cités entre guillemets français, assez longs pour être probants. */
function citations(explication: string): string[] {
  return [...explication.matchAll(/«\s*([^»]{25,300})\s*»/g)].map((m) => m[1].trim())
}

/** Part des mots pleins de la citation que l'on retrouve dans le texte. */
function recouvrement(citation: string, texte: string): number {
  const mots = [...new Set(motsPleins(citation))]
  if (mots.length === 0) return 1
  const presents = new Set(motsPleins(texte))
  return mots.filter((m) => presents.has(m)).length / mots.length
}

/**
 * Mots porteurs de sens : au moins cinq lettres, ce qui écarte les articles,
 * les auxiliaires et les prépositions sans avoir à tenir une liste d'arrêt.
 */
function motsPleins(t: string): string[] {
  return normaliser(t)
    .replace(/[^a-zà-ÿ' ]/g, ' ')
    .split(/[\s']+/)
    .filter((m) => m.length >= 5)
}

function apercu(t: string): string {
  return t.length > 60 ? `${t.slice(0, 57)}…` : t
}

/** Comparaison indifférente aux espaces et aux apostrophes typographiques. */
function normaliser(t: string): string {
  return t.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').toLowerCase()
}
