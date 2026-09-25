/**
 * Extraction des figures d'un PDF.
 *
 * Certaines questions — la logique surtout — ont un énoncé graphique : une
 * matrice de figures, une intersection de séries. Une extraction textuelle n'en
 * voit rien, et le lot 9 les écartait purement et simplement, laissant un
 * sous-test entier vide.
 *
 * On rend donc la page, puis on la découpe : la bande verticale qui va d'un
 * en-tête « Question N » au suivant est l'image de cette question. Les
 * positions viennent de pdfjs, pas d'une estimation de mise en page.
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
const ECHELLE = 2

export interface Figure {
  section: SectionTageMage
  numero: number
  png: Buffer
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
async function reperer(
  donneesPdf: Uint8Array,
): Promise<{ ancres: Ancre[]; hauteurs: Map<number, number> }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Copie délibérée : pdfjs détache le tampon qu'on lui confie.
  const doc = await pdfjs.getDocument({ data: donneesPdf.slice(), useSystemFonts: true }).promise

  const ancres: Ancre[] = []
  const hauteurs = new Map<number, number>()
  let section: SectionTageMage | null = null
  let fini = false

  for (let n = 1; n <= doc.numPages && !fini; n++) {
    const page = await doc.getPage(n)
    const vue = page.getViewport({ scale: 1 })
    hauteurs.set(n, vue.height)

    const contenu = await page.getTextContent()

    const lignes = assemblerLignes(
      contenu.items as FragmentPdf[],
      vue.height,
    )

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

  await doc.destroy()
  return { ancres, hauteurs }
}

/**
 * Extrait une image par question demandée.
 *
 * `cibles` limite le travail : rendre toutes les pages d'un document de
 * cinquante pages pour n'en garder que quinze bandes serait du gaspillage.
 */
export async function extraireFigures(
  donneesPdf: Uint8Array,
  cibles: Array<{ section: SectionTageMage; numero: number }>,
): Promise<Map<string, Figure>> {
  const resultat = new Map<string, Figure>()
  if (cibles.length === 0) return resultat

  const voulu = new Set(cibles.map((c) => `${c.section}#${c.numero}`))
  const { ancres, hauteurs } = await reperer(donneesPdf)

  const aRendre = [
    ...new Set(ancres.filter((a) => voulu.has(`${a.section}#${a.numero}`)).map((a) => a.page)),
  ].sort((a, b) => a - b)

  if (aRendre.length === 0) return resultat

  const { PDFParse } = await import('pdf-parse')
  const sharp = (await import('sharp')).default

  const parseur = new PDFParse({ data: donneesPdf.slice() })

  try {
    const rendu = await parseur.getScreenshot({
      first: aRendre[0],
      last: aRendre[aRendre.length - 1],
      scale: ECHELLE,
    })

    const pages = new Map(
      ((rendu.pages ?? []) as Array<{ pageNumber: number; dataUrl?: string; data?: unknown }>).map(
        (p) => [p.pageNumber, p],
      ),
    )

    for (const ancre of ancres) {
      const cle = `${ancre.section}#${ancre.numero}`
      if (!voulu.has(cle) || resultat.has(cle)) continue

      const page = pages.get(ancre.page)
      const url = page?.dataUrl
      if (typeof url !== 'string' || !url.startsWith('data:')) continue

      // La bande s'arrête à la question suivante de la même page, ou au bas
      // de la page moins son pied.
      const suivante = ancres
        .filter((a) => a.page === ancre.page && a.yHaut > ancre.yHaut)
        .sort((a, b) => a.yHaut - b.yHaut)[0]

      const hauteurPage = hauteurs.get(ancre.page) ?? 842
      const haut = Math.max(0, ancre.yHaut - MARGE_HAUT)
      const bas = suivante ? suivante.yHaut - AVANT_SUIVANTE : hauteurPage - PIED_DE_PAGE

      if (bas - haut < 40) continue

      const source = sharp(Buffer.from(url.split(',')[1], 'base64'))
      const meta = await source.metadata()

      const top = Math.round(haut * ECHELLE)
      const height = Math.min(Math.round((bas - haut) * ECHELLE), (meta.height ?? 0) - top)
      if (height < 40) continue

      // La bande va jusqu'à la question suivante ; la dernière d'une page
      // traîne donc tout le blanc du bas. On la recadre sur son encre, puis on
      // rend une marge : sans elle, la figure toucherait le bord du cadre.
      const decoupe = sharp(
        await source.extract({ left: 0, top, width: meta.width ?? 0, height }).png().toBuffer(),
      )
        .trim({ background: '#ffffff', threshold: 12 })
        .extend({
          top: 14,
          bottom: 14,
          left: 14,
          right: 14,
          background: '#ffffff',
        })

      const png = await decoupe.png().toBuffer()
      const dims = await sharp(png).metadata()

      resultat.set(cle, {
        section: ancre.section,
        numero: ancre.numero,
        png,
        largeur: dims.width ?? 0,
        hauteur: dims.height ?? 0,
      })
    }
  } finally {
    await parseur.destroy()
  }

  return resultat
}
