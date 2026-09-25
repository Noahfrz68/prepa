import { redirect } from 'next/navigation'

/**
 * L'import par texte collé ou CSV vit désormais dans l'atelier
 * (`/atelier/import`) : deux écrans d'import séparés, chacun sans lien clair
 * vers l'autre, laissaient chercher où ajouter des questions. Cette route
 * garde les anciens liens valides, paramètres compris.
 */
export default async function AncienImport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === 'string') p.set(k, v)
  }
  const q = p.toString()
  redirect(`/atelier/import${q ? `?${q}` : ''}`)
}
