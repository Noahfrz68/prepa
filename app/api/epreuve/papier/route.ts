import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { composerEpreuvePapier, enregistrerEpreuvePapier, type SaisiePapier } from '@/core/db/epreuve'
import type { ModeEpreuve } from '@/exams/tagemage/epreuve'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * L'épreuve sur papier : composer (sans ouvrir de séance), puis enregistrer
 * la feuille de réponses d'un bloc. Voir core/db/epreuve.ts.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'composer' | 'enregistrer'
      mode?: string
      sousTests?: SaisiePapier[]
    }
    if (body.mode !== 'blanc' && body.mode !== 'diagnostic') {
      return NextResponse.json({ erreur: 'Mode invalide.' }, { status: 400 })
    }
    const mode = body.mode as ModeEpreuve

    if (body.action === 'composer') return NextResponse.json(composerEpreuvePapier(mode))

    if (body.action === 'enregistrer') {
      if (!Array.isArray(body.sousTests)) {
        return NextResponse.json({ erreur: 'Feuille de réponses manquante.' }, { status: 400 })
      }
      return NextResponse.json({ sessionId: enregistrerEpreuvePapier(mode, body.sousTests) })
    }

    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
