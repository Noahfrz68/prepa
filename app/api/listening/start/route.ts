import { NextResponse } from 'next/server'
import { demarrerSerieListening } from '@/core/db/listening'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { part, groupes } = (await request.json()) as { part?: string; groupes?: number }
    if (!part) return NextResponse.json({ erreur: 'Part manquante.' }, { status: 400 })

    const n = Math.max(1, Math.min(20, Number(groupes) || 5))
    return NextResponse.json(demarrerSerieListening(part, n))
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
