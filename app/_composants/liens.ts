/**
 * Adresses des pages qui portent un identifiant.
 *
 * Sur le PC, l'identifiant est dans le chemin (`/tagemage/epreuve/12`) et le
 * serveur rend la page à la demande. Le site statique de l'iPhone ne peut
 * produire au build que des pages dont il connaît l'adresse : l'identifiant
 * y passe donc en paramètre (`/tagemage/epreuve/bilan?id=12`).
 */
const IPHONE = process.env.NEXT_PUBLIC_CIBLE === 'iphone'

export function lienBilanEpreuve(sessionId: number): string {
  return IPHONE ? `/tagemage/epreuve/bilan?id=${sessionId}` : `/tagemage/epreuve/${sessionId}`
}

export function lienBilanReading(sessionId: number): string {
  return IPHONE ? `/toeic/reading/bilan?id=${sessionId}` : `/toeic/reading/${sessionId}`
}
