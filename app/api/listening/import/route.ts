import { NextResponse } from 'next/server'
import { parserListening } from '@/core/import/listening'
import { insererGroupesListening } from '@/core/db/listening'
import { ACCENTS, type Accent } from '@/exams/toeic/listening'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      texte?: string
      part?: string
      accentDefaut?: string
      skillId?: string | null
      apercuSeulement?: boolean
    }

    if (!body.texte?.trim()) {
      return NextResponse.json({ erreur: 'Rien à importer.' }, { status: 400 })
    }
    if (!body.part) {
      return NextResponse.json({ erreur: 'Part manquante.' }, { status: 400 })
    }

    const accent = (
      ACCENTS.includes(body.accentDefaut as Accent) ? body.accentDefaut : 'US'
    ) as Accent

    const { groupes, avertissements } = parserListening(body.texte, accent)

    if (body.apercuSeulement) {
      return NextResponse.json({ groupes, avertissements, medias: 0, questions: 0 })
    }

    const r =
      groupes.length > 0
        ? insererGroupesListening(groupes, body.part, body.skillId ?? null)
        : { medias: 0, questions: 0 }

    return NextResponse.json({ groupes, avertissements, ...r })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
