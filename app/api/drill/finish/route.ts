import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { terminerDrill } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId } = (await request.json()) as { sessionId?: number }
    if (!sessionId) {
      return NextResponse.json({ erreur: 'Session manquante.' }, { status: 400 })
    }
    return NextResponse.json(terminerDrill(Number(sessionId)))
  } catch (e) {
    return reponseErreur(e)
  }
}
