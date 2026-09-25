import { NextResponse } from 'next/server'
import { debriefExistant, produireDebrief } from '@/core/ia/tuteur'
import { iaDisponible } from '@/core/ia/fournisseurs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sessionId = Number(new URL(request.url).searchParams.get('sessionId'))
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return NextResponse.json({ erreur: 'Session invalide.' }, { status: 400 })
  }
  return NextResponse.json({
    disponible: iaDisponible(),
    debrief: debriefExistant(sessionId),
  })
}

export async function POST(request: Request) {
  const { sessionId } = (await request.json()) as { sessionId?: number }
  if (!sessionId) {
    return NextResponse.json({ erreur: 'Session manquante.' }, { status: 400 })
  }

  // produireDebrief ne lève jamais : un échec est un état, pas une exception.
  return NextResponse.json({
    disponible: iaDisponible(),
    debrief: await produireDebrief(Number(sessionId)),
  })
}
