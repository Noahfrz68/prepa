import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { enregistrerObjectif } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BORNES: Record<string, number> = { tagemage: 600, toeic_lr: 990 }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      examId?: string
      dateExamen?: string | null
      dateProvisoire?: boolean
      scoreCible?: number | null
      motif?: string | null
    }

    const max = BORNES[body.examId ?? '']
    if (!max) return NextResponse.json({ erreur: 'Examen inconnu.' }, { status: 400 })

    const cible = body.scoreCible == null || body.scoreCible === 0 ? null : Number(body.scoreCible)
    if (cible !== null && (!Number.isFinite(cible) || cible < 0 || cible > max)) {
      return NextResponse.json(
        { erreur: `Le score cible doit être compris entre 0 et ${max}.` },
        { status: 400 },
      )
    }

    const date = body.dateExamen?.trim() || null
    if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ erreur: 'Date attendue au format AAAA-MM-JJ.' }, { status: 400 })
    }

    enregistrerObjectif({
      examId: body.examId!,
      dateExamen: date,
      dateProvisoire: body.dateProvisoire !== false,
      scoreCible: cible,
      motif: body.motif?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return reponseErreur(e)
  }
}
