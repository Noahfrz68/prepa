import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import {
  CAUSES,
  declarerCause,
  entreesCarnet,
  marquerCompris,
  noterItem,
  resumeCarnet,
  type CauseErreur,
} from '@/core/db/carnet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Une note tient en quelques lignes ; au-delà, c'est un cours, et il a sa place ailleurs. */
const NOTE_MAX = 2000

export async function GET(request: Request) {
  const url = new URL(request.url)
  const section = url.searchParams.get('section') ?? undefined
  const inclureComprises = url.searchParams.get('comprises') === '1'
  const skillId = url.searchParams.get('type') || undefined
  const ordre = url.searchParams.get('ordre') === 'recentes' ? 'recentes' : 'priorite'
  const causeDemandee = url.searchParams.get('cause')
  const cause = CAUSES.includes(causeDemandee as CauseErreur) ? (causeDemandee as CauseErreur) : undefined
  const dues = url.searchParams.get('dues') === '1'

  return NextResponse.json({
    entrees: entreesCarnet({ section: section || undefined, skillId, ordre, cause, dues, inclureComprises }),
    resume: resumeCarnet(),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'noter' | 'compris' | 'cause'
      cause?: string | null
      itemId?: number
      note?: string
      compris?: boolean
    }

    const id = Number(body.itemId)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ erreur: 'Question inconnue.' }, { status: 400 })
    }

    if (body.action === 'noter') {
      const note = String(body.note ?? '')
      if (note.length > NOTE_MAX) {
        return NextResponse.json(
          { erreur: `Note trop longue (${note.length} caractères, maximum ${NOTE_MAX}).` },
          { status: 400 },
        )
      }
      noterItem(id, note)
      return NextResponse.json({ ok: true, resume: resumeCarnet() })
    }

    if (body.action === 'cause') {
      const c = body.cause ?? null
      if (c !== null && !CAUSES.includes(c as CauseErreur)) {
        return NextResponse.json({ erreur: 'Cause inconnue.' }, { status: 400 })
      }
      declarerCause(id, c as CauseErreur | null)
      return NextResponse.json({ ok: true, resume: resumeCarnet() })
    }

    if (body.action === 'compris') {
      marquerCompris(id, body.compris !== false)
      return NextResponse.json({ ok: true, resume: resumeCarnet() })
    }

    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
