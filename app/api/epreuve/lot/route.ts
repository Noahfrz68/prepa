import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { enregistrerLot, type TentativeLot } from '@/core/db/epreuve'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId, tentatives } = (await request.json()) as {
      sessionId?: number
      tentatives?: TentativeLot[]
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

    return NextResponse.json({ enregistrees: enregistrerLot(Number(sessionId), tentatives) })
  } catch (e) {
    return reponseErreur(e)
  }
}
