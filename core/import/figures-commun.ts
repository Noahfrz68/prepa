/**
 * Extraction des figures d'un PDF — la partie commune au PC et à l'iPhone.
 *
 * Certaines questions — la logique surtout — ont un énoncé graphique : une
 * matrice de figures, une intersection de séries. Une extraction textuelle n'en
 * voit rien, et le lot 9 les écartait purement et simplement, laissant un
 * sous-test entier vide.
 *
 * On rend donc la page, puis on la découpe : la bande verticale qui va d'un
 * en-tête « Question N » au suivant est l'image de cette question. Les
 * positions viennent de pdfjs, pas d'une estimation de mise en page.
 *
 * Ce module repère les questions et calcule les bandes. Le rendu et la
 * découpe dépendent de l'appareil : sharp sur le PC (figures.ts), canvas sur
 * l'iPhone (figures-navigateur.ts).
 */

import type { SectionTageMage } from '@/exams/tagemage'

const RE_QUESTION_LABEL = /^\s*Question\s+(\d{1,3})\s*[.:)]?/i
const RE_SOUS_TEST_LABEL = /^\s*SOUS[-\s]?TEST\s*\d*\s*[:.]?\s*(.+)$/i

const SECTIONS: Array<{ motif: RegExp; id: SectionTageMage }> = [
  { motif: /COMPR[ÉE]HENSION\s+DE\s+TEXTES?/i, id: 'comprehension' },
  { motif: /RAISONNEMENT\s+ET\s+ARGUMENTATION/i, id: 'raisonnement' },
  { motif: /CONDITIONS\s+MINIMALES/i, id: 'conditions_minimales' },
  { motif: /EXPRESSION/i, id: 'expression' },
  { motif: /LOGIQUE/i, id: 'logique' },
  { motif: /CALCUL/i, id: 'calcul' },
]

/**
 * Marges, en points PDF.
 *
 * L'ordonnée d'un fragment est celle de sa ligne de base : sans marge haute,
 * l'en-tête « Question N » est coupé en deux. La marge basse s'arrête avant
 * l'en-tête suivant, pour qu'une bande ne montre pas la question d'après.
 */
const MARGE_HAUT = 18
const AVANT_SUIVANTE = 24
/** Bas de page utile : au-dessus du pied de page. */
const PIED_DE_PAGE = 60
/** Bandes rendues à cette échelle : lisible sans être démesuré. */
export const ECHELLE = 2
/** Marge blanche rendue autour d'une figure recadrée sur son encre, en pixels. */
export const MARGE_FIGURE = 14
/** Écart au blanc en deçà duquel un pixel compte comme du fond (recadrage). */
export const SEUIL_BLANC = 12

export interface Figure {
  section: SectionTageMage
  numero: number
  png: Uint8Array
  largeur: number
  hauteur: number
}

interface Ancre {
  section: SectionTageMage
  numero: number
  page: number
  /** Distance depuis le haut de la page, en points PDF. */
  yHaut: number
}

export interface FragmentPdf {
  str?: string
  /** Matrice pdfjs : [, , , , x, y] — l'origine est en bas à gauche. */
  transform?: number[]
}

/** Ce que ce module demande d'un document pdfjs. */
export interface DocumentPdf {
  numPages: number
  getPage(n: number): Promise<{
    getViewport(o: { scale: number }): { height: number }
    getTextContent(): Promise<{ items: unknown[] }>
  }>
}

/** Une bande à découper : une question, sur sa page, en points PDF. */
export interface Bande {
  cle: string
  section: SectionTageMage
  numero: number
  page: number
  haut: number
  bas: number
}

/**
 * Recompose les lignes d'une page à partir des fragments de pdfjs.
 *
 * pdfjs ne rend pas des lignes mais des morceaux : « SOUS-TEST 6 : LOGIQUE »
 * arrive en cinq fragments. Les reconnaître un par un ne repère aucun en-tête —
 * c'est ce qui laissait le sous-test de logique introuvable, et donc vide.
 */
export function assemblerLignes(
  fragments: FragmentPdf[],
  hauteurPage: number,
): Array<{ yHaut: number; texte: string }> {
  const parLigne = new Map<number, Array<{ x: number; texte: string }>>()

  for (const f of fragments) {
    if (!f.str || !f.transform) continue
    // On repasse d'une origine en bas à gauche à une distance depuis le haut.
    const yHaut = Math.round(hauteurPage - f.transform[5])
    const l = parLigne.get(yHaut)
    if (l) l.push({ x: f.transform[4], texte: f.str })
    else parLigne.set(yHaut, [{ x: f.transform[4], texte: f.str }])
  }

  return [...parLigne.entries()]
    .map(([yHaut, morceaux]) => ({
      yHaut,
      texte: morceaux
        .sort((a, b) => a.x - b.x)
        .map((m) => m.texte)
        .join('')
        .trim(),
    }))
    .filter((l) => l.texte.length > 0)
    .sort((a, b) => a.yHaut - b.yHaut)
}

/**
 * Repère chaque en-tête « Question N » avec sa page et sa position verticale.
 *
 * On s'arrête au corrigé : ses figures ne servent à rien pour l'entraînement.
 */
async function reperer(doc: DocumentPdf): Promise<{ ancres: Ancre[]; hauteurs: Map<number, number> }> {
  const ancres: Ancre[] = []
  const hauteurs = new Map<number, number>()
  let section: SectionTageMage | null = null
  let fini = false

  for (let n = 1; n <= doc.numPages && !fini; n++) {
    const page = await doc.getPage(n)
    const vue = page.getViewport({ scale: 1 })
    hauteurs.set(n, vue.height)

    const contenu = await page.getTextContent()
    const lignes = assemblerLignes(contenu.items as FragmentPdf[], vue.height)

    for (const ligne of lignes) {
      if (/^\s*CORRIG[ÉE]\s*$/i.test(ligne.texte)) {
        fini = true
        break
      }

      const mSousTest = ligne.texte.match(RE_SOUS_TEST_LABEL)
      if (mSousTest && !/_{5,}/.test(ligne.texte)) {
        const trouve = SECTIONS.find((s) => s.motif.test(mSousTest[1]))
        if (trouve) section = trouve.id
        continue
      }

      const mQuestion = ligne.texte.match(RE_QUESTION_LABEL)
      if (mQuestion && section) {
        ancres.push({ section, numero: Number(mQuestion[1]), page: n, yHaut: ligne.yHaut })
      }
    }
  }

  return { ancres, hauteurs }
}

/**
 * Les bandes à découper pour les questions demandées, une par question.
 *
 * La bande s'arrête à la question suivante de la même page, ou au bas de la
 * page moins son pied. `cibles` limite le travail : rendre toutes les pages
 * d'un document de cinquante pages pour n'en garder que quinze bandes serait
 * du gaspillage.
 */
export async function bandesAExtraire(
  doc: DocumentPdf,
  cibles: Array<{ section: SectionTageMage; numero: number }>,
): Promise<Bande[]> {
  const voulu = new Set(cibles.map((c) => `${c.section}#${c.numero}`))
  const { ancres, hauteurs } = await reperer(doc)
  const bandes: Bande[] = []
  const vues = new Set<string>()

  for (const ancre of ancres) {
    const cle = `${ancre.section}#${ancre.numero}`
    if (!voulu.has(cle) || vues.has(cle)) continue

    const suivante = ancres
      .filter((a) => a.page === ancre.page && a.yHaut > ancre.yHaut)
      .sort((a, b) => a.yHaut - b.yHaut)[0]

    const hauteurPage = hauteurs.get(ancre.page) ?? 842
    const haut = Math.max(0, ancre.yHaut - MARGE_HAUT)
    const bas = suivante ? suivante.yHaut - AVANT_SUIVANTE : hauteurPage - PIED_DE_PAGE
    if (bas - haut < 40) continue

    vues.add(cle)
    bandes.push({ cle, section: ancre.section, numero: ancre.numero, page: ancre.page, haut, bas })
  }

  return bandes
}

/**
 * Cadre de l'encre dans une image RVBA : le plus petit rectangle qui contient
 * tous les pixels s'écartant du blanc de plus de SEUIL_BLANC. `null` si
 * l'image est entièrement blanche. C'est le `trim` de sharp, refait pour le
 * canvas du navigateur.
 */
export function cadreEncre(
  pixels: Uint8ClampedArray | Uint8Array,
  largeur: number,
  hauteur: number,
): { x: number; y: number; largeur: number; hauteur: number } | null {
  let x0 = largeur
  let y0 = hauteur
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = (y * largeur + x) * 4
      const a = pixels[i + 3] / 255
      // Un pixel transparent se lit sur fond blanc.
      const ecart = Math.max(
        (255 - pixels[i]) * a,
        (255 - pixels[i + 1]) * a,
        (255 - pixels[i + 2]) * a,
      )
      if (ecart > SEUIL_BLANC) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, largeur: x1 - x0 + 1, hauteur: y1 - y0 + 1 }
}
