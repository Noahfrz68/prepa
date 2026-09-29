/**
 * Un petit PDF d'annale fabriqué de toutes pièces, pour les tests : une
 * question de calcul, une question de logique dont l'énoncé est une figure
 * (des carrés dessinés), et le corrigé. Aucun contenu tiers.
 *
 * Écrit à la main, sans bibliothèque : un PDF d'une ou deux pages est un
 * texte simple, dont seule la table des positions (xref) demande du soin.
 */

function echapper(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Contenu d'une page : des lignes de texte (x, y depuis le bas) et des rectangles pleins. */
function flux(lignes: Array<[number, number, string]>, rectangles: Array<[number, number, number, number]> = []): string {
  const texte = lignes.map(([x, y, t]) => `BT /F1 12 Tf ${x} ${y} Td (${echapper(t)}) Tj ET`).join('\n')
  const dessins = rectangles.map(([x, y, l, h]) => `0 0 0 rg ${x} ${y} ${l} ${h} re f`).join('\n')
  return `${texte}\n${dessins}\n`
}

export function pdfEssai(): Uint8Array {
  const page1 = flux(
    [
      [60, 790, 'SOUS-TEST 2 : CALCUL'],
      [60, 760, 'Question 1. Combien font 2 + 2 ?'],
      [60, 740, 'A) 3 B) 4 C) 5 D) 6 E) 7'],
      [60, 700, 'SOUS-TEST 6 : LOGIQUE'],
      [60, 670, 'Question 1.'],
      [60, 540, 'A) MIF B) ABJ C) NBC D) NOG E) KDS'],
      [60, 480, 'Question 2. Combien font 3 + 3 ?'],
      [60, 460, 'A) 5 B) 6 C) 7 D) 8 E) 9'],
    ],
    // La figure de la question 1 de logique : trois carrés.
    [
      [80, 580, 40, 40],
      [150, 580, 40, 40],
      [220, 580, 40, 40],
    ],
  )
  const page2 = flux([
    [60, 790, 'CORRIGE'],
    [60, 770, 'CALCUL'],
    [60, 750, 'Corrige 1.'],
    [60, 730, 'Reponse B'],
    [60, 710, 'LOGIQUE'],
    [60, 690, 'Corrige 1.'],
    [60, 670, 'Reponse C'],
    [60, 650, 'Corrige 2.'],
    [60, 630, 'Reponse B'],
  ])

  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${page1.length} >>\nstream\n${page1}endstream`,
    `<< /Length ${page2.length} >>\nstream\n${page2}endstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const positions: number[] = []
  objets.forEach((o, i) => {
    positions.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
  for (const p of positions) pdf += `${String(p).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  return new TextEncoder().encode(pdf)
}
