import { NextResponse } from 'next/server'
import { etatSynthese, synthetiserEnAttente } from '@/core/db/listening'
import { etatAudio } from '@/core/audio/moteurs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ audio: etatAudio(), synthese: etatSynthese() })
}

export async function POST(request: Request) {
  try {
    const { limite } = (await request.json().catch(() => ({}))) as { limite?: number }
    const r = await synthetiserEnAttente(Math.max(1, Math.min(100, Number(limite) || 20)))
    return NextResponse.json({ ...r, synthese: etatSynthese() })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
