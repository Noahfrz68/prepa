import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { abandonnerSession, ajouterCoupure, ajouterTempsCorrection, etatSession } from '@/core/db/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * État et abandon d'une session. Sert à la reprise d'une épreuve après un
 * rechargement : le navigateur garde les réponses du sous-test en cours, le
 * serveur dit si la session est encore reprenable et quels sous-tests il a
 * déjà reçus.
 */
export async function POST(request: Request) {
  try {
    const { action, sessionId, ms } = (await request.json()) as {
      action?: 'etat' | 'abandonner' | 'correction' | 'coupure'
      sessionId?: number
      /** Temps de lecture des corrections (« correction ») ou durée d'une coupure (« coupure »). */
      ms?: number
    }
    const id = Number(sessionId)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ erreur: 'Session manquante.' }, { status: 400 })
    }

    if (action === 'etat') return NextResponse.json(etatSession(id))
    if (action === 'correction') {
      ajouterTempsCorrection(id, Number(ms))
      return NextResponse.json({ ok: true })
    }
    if (action === 'coupure') {
      ajouterCoupure(id, Number(ms))
      return NextResponse.json({ ok: true })
    }
    if (action === 'abandonner') {
      abandonnerSession(id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
