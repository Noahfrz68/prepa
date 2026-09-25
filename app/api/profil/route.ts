import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { enregistrerProfil } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { heuresDispoSemaine } = (await request.json()) as { heuresDispoSemaine?: number | null }

    if (heuresDispoSemaine == null) {
      enregistrerProfil(null)
      return NextResponse.json({ ok: true })
    }

    const h = Number(heuresDispoSemaine)
    if (!Number.isFinite(h) || h <= 0 || h > 80) {
      return NextResponse.json(
        { erreur: 'Le volume hebdomadaire doit être compris entre 1 et 80 heures.' },
        { status: 400 },
      )
    }

    enregistrerProfil(h)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return reponseErreur(e)
  }
}
