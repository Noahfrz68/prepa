import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { entreesCarnet, marquerCompris, noterItem, resumeCarnet } from '@/core/db/carnet'

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

  return NextResponse.json({
    entrees: entreesCarnet({ section: section || undefined, skillId, ordre, inclureComprises }),
    resume: resumeCarnet(),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'noter' | 'compris'
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

    if (body.action === 'compris') {
      marquerCompris(id, body.compris !== false)
      return NextResponse.json({ ok: true, resume: resumeCarnet() })
    }

    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
