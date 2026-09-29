import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { assemblerLignes, type FragmentPdf } from './figures'
import { SEUIL_BLANC, cadreEncre } from './figures-commun'

/** Fragment à la position (x, y) exprimée depuis le bas, comme pdfjs. */
function f(str: string, x: number, yBas: number): FragmentPdf {
  return { str, transform: [1, 0, 0, 1, x, yBas] }
}

describe('assemblerLignes', () => {
  // L'en-tête arrive éclaté dans l'annale réelle. Tant qu'on comparait les
  // fragments un par un, aucun sous-test n'était reconnu et la logique
  // restait vide.
  it('recompose un en-tête éclaté en fragments', () => {
    const lignes = assemblerLignes(
      [
        f('LOGIQUE', 300, 725),
        f('SOUS', 100, 725),
        f(':', 280, 725),
        f('-', 150, 725),
        f('TEST 6', 160, 725),
      ],
      842,
    )

    // Les fragments sont recollés tels quels, dans l'ordre des abscisses : le
    // PDF porte ses propres espaces, on n'en invente pas.
    expect(lignes).toHaveLength(1)
    expect(lignes[0].texte).toBe('SOUS-TEST 6:LOGIQUE')
  })

  it('ordonne les lignes du haut vers le bas', () => {
    const lignes = assemblerLignes([f('bas', 50, 200), f('haut', 50, 700)], 842)
    expect(lignes.map((l) => l.texte)).toEqual(['haut', 'bas'])
    expect(lignes[0].yHaut).toBe(142)
  })

  it('ignore les fragments vides et ceux sans position', () => {
    const lignes = assemblerLignes([f('   ', 50, 700), { str: 'perdu' }], 842)
    expect(lignes).toEqual([])
  })
})

/** Image blanche avec des pixels posés à la main. */
function image(largeur: number, hauteur: number, points: Array<[number, number, number]>): Uint8ClampedArray {
  const p = new Uint8ClampedArray(largeur * hauteur * 4).fill(255)
  for (const [x, y, gris] of points) {
    const i = (y * largeur + x) * 4
    p[i] = p[i + 1] = p[i + 2] = gris
  }
  return p
}

describe('cadreEncre — le recadrage des figures sur iPhone', () => {
  it('rend le plus petit rectangle qui contient l’encre', () => {
    const p = image(20, 10, [
      [3, 2, 0],
      [15, 7, 100],
    ])
    expect(cadreEncre(p, 20, 10)).toEqual({ x: 3, y: 2, largeur: 13, hauteur: 6 })
  })

  it('ignore le presque-blanc, en deçà du seuil', () => {
    const p = image(10, 10, [
      [1, 1, 255 - SEUIL_BLANC],
      [5, 5, 255 - SEUIL_BLANC - 1],
    ])
    expect(cadreEncre(p, 10, 10)).toEqual({ x: 5, y: 5, largeur: 1, hauteur: 1 })
  })

  it('rend null pour une bande toute blanche', () => {
    expect(cadreEncre(image(8, 8, []), 8, 8)).toBeNull()
  })

  // sharp (libvips) filtre l'image avant de recadrer, ce qui efface les traits
  // d'un pixel : on compare donc sur des tracés épais, comme ceux d'une page
  // rendue à l'échelle 2.
  it('recadre au même endroit que sharp, qui fait ce travail sur le PC', async () => {
    const largeur = 60
    const hauteur = 40
    const points: Array<[number, number, number]> = []
    for (let x = 12; x <= 40; x++) for (let e = 0; e < 4; e++) points.push([x, 9 + e, 0])
    for (let y = 9; y <= 30; y++) for (let e = 0; e < 4; e++) points.push([25 + e, y, 60])
    const p = image(largeur, hauteur, points)

    const { info } = await sharp(Buffer.from(p), { raw: { width: largeur, height: hauteur, channels: 4 } })
      .trim({ background: '#ffffff', threshold: SEUIL_BLANC })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const cadre = cadreEncre(p, largeur, hauteur)!
    expect({ x: cadre.x, y: cadre.y, largeur: cadre.largeur, hauteur: cadre.hauteur }).toEqual({
      x: -(info.trimOffsetLeft ?? 0),
      y: -(info.trimOffsetTop ?? 0),
      largeur: info.width,
      hauteur: info.height,
    })
  })
})
