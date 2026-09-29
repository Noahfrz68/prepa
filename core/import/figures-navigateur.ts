/**
 * Extraction des figures d'un PDF, version iPhone : remplace figures.ts dans
 * le build `PREPA_CIBLE=iphone` (resolveAlias de next.config.ts). sharp est
 * un binaire du PC : ici, pdfjs rend la page dans un canvas, et la découpe
 * et le recadrage se font au canvas, avec les mêmes règles (figures-commun.ts).
 */

import type { SectionTageMage } from '@/exams/tagemage'
import {
  ECHELLE,
  MARGE_FIGURE,
  bandesAExtraire,
  cadreEncre,
  type DocumentPdf,
  type Figure,
} from './figures-commun'

export { assemblerLignes, type Figure, type FragmentPdf } from './figures-commun'

/** Worker de pdfjs, copié dans le site par scripts/iphone.mjs. */
export const URL_WORKER_PDF = `${process.env.NEXT_PUBLIC_CHEMIN_BASE ?? ''}/pdf.worker.min.mjs`

type Canvas = HTMLCanvasElement

function canvas(largeur: number, hauteur: number): Canvas {
  const c = document.createElement('canvas')
  c.width = largeur
  c.height = hauteur
  return c
}

function png(c: Canvas): Promise<Uint8Array> {
  return new Promise((ok, ko) =>
    c.toBlob(
      (b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), ko) : ko(new Error('Rendu PNG impossible.'))),
      'image/png',
    ),
  )
}

/** Extrait une image par question demandée. */
export async function extraireFigures(
  donneesPdf: Uint8Array,
  cibles: Array<{ section: SectionTageMage; numero: number }>,
): Promise<Map<string, Figure>> {
  const resultat = new Map<string, Figure>()
  if (cibles.length === 0) return resultat

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = URL_WORKER_PDF
  // Copie délibérée : pdfjs détache le tampon qu'on lui confie.
  const doc = await pdfjs.getDocument({ data: donneesPdf.slice(), useSystemFonts: true }).promise

  try {
    const bandes = await bandesAExtraire(doc as unknown as DocumentPdf, cibles)
    const rendues = new Map<number, Canvas>()

    for (const bande of bandes) {
      let pageRendue = rendues.get(bande.page)
      if (!pageRendue) {
        const page = await doc.getPage(bande.page)
        const vue = page.getViewport({ scale: ECHELLE })
        pageRendue = canvas(Math.ceil(vue.width), Math.ceil(vue.height))
        const ctx = pageRendue.getContext('2d')!
        // Fond blanc : sans lui, le recadrage lirait le transparent comme de l'encre.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageRendue.width, pageRendue.height)
        // Rendu « impression » : le rendu « écran » de pdfjs avance au rythme
        // de requestAnimationFrame, qui s'arrête quand la page n'est pas
        // affichée — changer d'app pendant un import le figeait.
        await page.render({ canvas: pageRendue, canvasContext: ctx, viewport: vue, intent: 'print' }).promise
        rendues.set(bande.page, pageRendue)
      }

      const top = Math.round(bande.haut * ECHELLE)
      const hauteur = Math.min(Math.round((bande.bas - bande.haut) * ECHELLE), pageRendue.height - top)
      if (hauteur < 40) continue

      // La bande va jusqu'à la question suivante ; la dernière d'une page
      // traîne donc tout le blanc du bas. On la recadre sur son encre, puis on
      // rend une marge : sans elle, la figure toucherait le bord du cadre.
      const pixels = pageRendue.getContext('2d')!.getImageData(0, top, pageRendue.width, hauteur)
      const encre = cadreEncre(pixels.data, pixels.width, pixels.height)
      if (!encre) continue

      const sortie = canvas(encre.largeur + 2 * MARGE_FIGURE, encre.hauteur + 2 * MARGE_FIGURE)
      const ctx = sortie.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sortie.width, sortie.height)
      ctx.drawImage(
        pageRendue,
        encre.x,
        top + encre.y,
        encre.largeur,
        encre.hauteur,
        MARGE_FIGURE,
        MARGE_FIGURE,
        encre.largeur,
        encre.hauteur,
      )

      resultat.set(bande.cle, {
        section: bande.section,
        numero: bande.numero,
        png: await png(sortie),
        largeur: sortie.width,
        hauteur: sortie.height,
      })
    }
  } finally {
    await doc.destroy()
  }

  return resultat
}
