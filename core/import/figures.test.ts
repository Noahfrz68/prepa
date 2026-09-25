import { describe, expect, it } from 'vitest'
import { assemblerLignes, type FragmentPdf } from './figures'

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
