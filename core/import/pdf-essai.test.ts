import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { parserPdf, texteDuPdf } from './pdf'
import { extraireFigures } from './figures'
import { pdfEssai } from './pdf-essai'

/**
 * L'import d'une annale de bout en bout, sur un PDF fabriqué pour l'occasion
 * (pdf-essai.ts) : extraction du texte, découpage en questions, et rendu de la
 * figure d'une question de logique. La version iPhone refait le rendu au
 * canvas, avec les mêmes bandes (figures-commun.ts).
 */
describe('import d’une annale PDF', () => {
  it('lit les questions, le corrigé, et repère la question à figure', async () => {
    const r = parserPdf(await texteDuPdf(pdfEssai()))

    const calcul = r.questions.filter((q) => q.section === 'calcul')
    expect(calcul).toHaveLength(1)
    expect(calcul[0].options).toEqual(['3', '4', '5', '6', '7'])
    expect(calcul[0].bonneReponse).toBe('B')

    expect(r.figures).toHaveLength(1)
    expect(r.figures[0]).toMatchObject({ section: 'logique', numero: 1, bonneReponse: 'C' })
    expect(r.figures[0].options).toEqual(['MIF', 'ABJ', 'NBC', 'NOG', 'KDS'])
  })

  it('rend la figure de la question, recadrée sur son dessin', async () => {
    const figures = await extraireFigures(pdfEssai(), [{ section: 'logique', numero: 1 }])
    const f = figures.get('logique#1')!
    expect(f).toBeDefined()

    // Un PNG, qui contient l'en-tête, les trois carrés et les propositions,
    // mais s'arrête avant la question suivante.
    const meta = await sharp(Buffer.from(f.png)).metadata()
    expect(meta.format).toBe('png')
    expect(f.largeur).toBe(meta.width)
    expect(f.hauteur).toBe(meta.height)
    // Rendu à l'échelle 2 : de « Question 1. » (y = 670) aux propositions
    // (y = 540), soit environ 130 points, 260 pixels, plus les marges.
    expect(f.hauteur).toBeGreaterThan(250)
    expect(f.hauteur).toBeLessThan(400)
  })
})
