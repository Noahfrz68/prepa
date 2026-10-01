import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { enregistrerPartie, type PartieEnvoyee } from '@/core/db/automatismes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Une partie d'automatismes, envoyée en une fois à la fin : le jeu tourne
 * sans aucun appel, donc sans attente entre deux questions. L'uid posé par le
 * navigateur rend l'envoi rejouable sans doublon.
 */
export async function POST(request: Request) {
  try {
    const partie = (await request.json()) as PartieEnvoyee
    return NextResponse.json(enregistrerPartie(partie))
  } catch (e) {
    return reponseErreur(e)
  }
}
