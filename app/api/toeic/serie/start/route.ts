import { NextResponse } from 'next/server'
import { demarrerSerieReading } from '@/core/db/toeic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { part, taille } = (await request.json()) as { part?: string; taille?: number }
    if (!part) return NextResponse.json({ erreur: 'Part manquante.' }, { status: 400 })

    const n = Math.max(1, Math.min(100, Number(taille) || 15))
    return NextResponse.json(demarrerSerieReading(part, n))
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
