import { NextResponse } from 'next/server'
import { enregistrerLotListening, type TentativeListening } from '@/core/db/listening'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId, tentatives } = (await request.json()) as {
      sessionId?: number
      tentatives?: TentativeListening[]
    }
    if (!sessionId || !Array.isArray(tentatives)) {
      return NextResponse.json({ erreur: 'Lot incomplet.' }, { status: 400 })
    }

    for (const t of tentatives) {
      if (!Number.isInteger(t.confiance) || t.confiance < 1 || t.confiance > 4) {
        return NextResponse.json({ erreur: `Confiance invalide sur l'item ${t.itemId}.` }, { status: 400 })
      }
    }

    return NextResponse.json({ enregistrees: enregistrerLotListening(Number(sessionId), tentatives) })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
