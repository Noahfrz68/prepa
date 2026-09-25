/**
 * Typographie des énoncés importés.
 *
 * Les annales en PDF écrivent la multiplication avec la lettre x (« 36 x 25 »),
 * faute de signe ×. Entre deux nombres, la lettre se lit mal — on cherche une
 * inconnue — et elle détonne à côté des questions fabriquées, qui écrivent ×.
 * On ne remplace que le x pris entre deux chiffres : « x années » ou « 3x + 2 »
 * restent tels quels.
 */
const RE_MULTIPLICATION = /(\d)\s?[xX]\s?(?=\d)/g

export function normaliserMultiplication(texte: string): string {
  return texte.replace(RE_MULTIPLICATION, '$1 × ')
}

/** Même normalisation, appliquée à un champ facultatif. */
export function normaliserMultiplicationSi<T extends string | null | undefined>(texte: T): T {
  return (typeof texte === 'string' ? normaliserMultiplication(texte) : texte) as T
}
