import { NextResponse } from 'next/server'
import { enregistrerLotReading, type TentativeReading } from '@/core/db/toeic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId, tentatives } = (await request.json()) as {
      sessionId?: number
      tentatives?: TentativeReading[]
    }
    if (!sessionId || !Array.isArray(tentatives)) {
      return NextResponse.json({ erreur: 'Lot incomplet.' }, { status: 400 })
    }

    for (const t of tentatives) {
      if (!Number.isInteger(t.confiance) || t.confiance < 1 || t.confiance > 4) {
        return NextResponse.json(
          { erreur: `Confiance invalide sur l'item ${t.itemId}.` },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ enregistrees: enregistrerLotReading(Number(sessionId), tentatives) })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
