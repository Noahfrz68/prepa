import { NextResponse } from 'next/server'
import { enregistrerRevision } from '@/core/db/vocabulaire'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { cardId, su, tempsMs } = (await request.json()) as {
      cardId?: number
      su?: boolean
      tempsMs?: number
    }
    if (!cardId || typeof su !== 'boolean') {
      return NextResponse.json({ erreur: 'Révision incomplète.' }, { status: 400 })
    }
    enregistrerRevision(Number(cardId), su, Number(tempsMs) || 0)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
