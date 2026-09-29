/**
 * Extraction des figures d'un PDF, version PC : rendu des pages par
 * pdf-parse, découpe et recadrage par sharp. Le repérage des questions et le
 * calcul des bandes sont dans figures-commun.ts ; l'iPhone a sa propre
 * découpe, au canvas (figures-navigateur.ts).
 */

import type { SectionTageMage } from '@/exams/tagemage'
import { ECHELLE, MARGE_FIGURE, SEUIL_BLANC, bandesAExtraire, type DocumentPdf, type Figure } from './figures-commun'

export { assemblerLignes, type Figure, type FragmentPdf } from './figures-commun'

/** Extrait une image par question demandée. */
export async function extraireFigures(
  donneesPdf: Uint8Array,
  cibles: Array<{ section: SectionTageMage; numero: number }>,
): Promise<Map<string, Figure>> {
  const resultat = new Map<string, Figure>()
  if (cibles.length === 0) return resultat

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Copie délibérée : pdfjs détache le tampon qu'on lui confie.
  const doc = await pdfjs.getDocument({ data: donneesPdf.slice(), useSystemFonts: true }).promise
  let bandes
  try {
    bandes = await bandesAExtraire(doc as unknown as DocumentPdf, cibles)
  } finally {
    await doc.destroy()
  }
  if (bandes.length === 0) return resultat

  const pagesARendre = bandes.map((b) => b.page)
  const { PDFParse } = await import('pdf-parse')
  const sharp = (await import('sharp')).default

  const parseur = new PDFParse({ data: donneesPdf.slice() })

  try {
    const rendu = await parseur.getScreenshot({
      first: Math.min(...pagesARendre),
      last: Math.max(...pagesARendre),
      scale: ECHELLE,
    })

    const pages = new Map(
      ((rendu.pages ?? []) as Array<{ pageNumber: number; dataUrl?: string; data?: unknown }>).map(
        (p) => [p.pageNumber, p],
      ),
    )

    for (const bande of bandes) {
      const url = pages.get(bande.page)?.dataUrl
      if (typeof url !== 'string' || !url.startsWith('data:')) continue

      const source = sharp(Buffer.from(url.split(',')[1], 'base64'))
      const meta = await source.metadata()

      const top = Math.round(bande.haut * ECHELLE)
      const height = Math.min(Math.round((bande.bas - bande.haut) * ECHELLE), (meta.height ?? 0) - top)
      if (height < 40) continue

      // La bande va jusqu'à la question suivante ; la dernière d'une page
      // traîne donc tout le blanc du bas. On la recadre sur son encre, puis on
      // rend une marge : sans elle, la figure toucherait le bord du cadre.
      const decoupe = sharp(
        await source.extract({ left: 0, top, width: meta.width ?? 0, height }).png().toBuffer(),
      )
        .trim({ background: '#ffffff', threshold: SEUIL_BLANC })
        .extend({
          top: MARGE_FIGURE,
          bottom: MARGE_FIGURE,
          left: MARGE_FIGURE,
          right: MARGE_FIGURE,
          background: '#ffffff',
        })

      const png = await decoupe.png().toBuffer()
      const dims = await sharp(png).metadata()

      resultat.set(bande.cle, {
        section: bande.section,
        numero: bande.numero,
        png: new Uint8Array(png),
        largeur: dims.width ?? 0,
        hauteur: dims.height ?? 0,
      })
    }
  } finally {
    await parseur.destroy()
  }

  return resultat
}
