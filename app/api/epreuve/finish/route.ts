import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { terminerEpreuve } from '@/core/db/epreuve'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId } = (await request.json()) as { sessionId?: number }
    if (!sessionId) {
      return NextResponse.json({ erreur: 'Session manquante.' }, { status: 400 })
    }
    terminerEpreuve(Number(sessionId))
    return NextResponse.json({ ok: true, sessionId: Number(sessionId) })
  } catch (e) {
    return reponseErreur(e)
  }
}
