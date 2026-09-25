import { NextResponse } from 'next/server'
import { enregistrerProduction } from '@/core/db/writing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { promptTaskId, contenu, tempsMs } = (await request.json()) as {
      promptTaskId?: number
      contenu?: string
      tempsMs?: number
    }

    if (!promptTaskId || !contenu?.trim()) {
      return NextResponse.json({ erreur: 'Production incomplète.' }, { status: 400 })
    }

    const id = enregistrerProduction({
      promptTaskId: Number(promptTaskId),
      contenu,
      tempsMs: Number(tempsMs) || 0,
    })

    return NextResponse.json({ id })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
