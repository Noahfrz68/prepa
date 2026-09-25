import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { insererItems } from '@/core/db/queries'
import { parserCsv, parserTexteColle } from '@/core/import/parse'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      texte?: string
      format?: 'colle' | 'csv'
      examId?: string
      section?: string
      skillId?: string | null
      apercuSeulement?: boolean
    }

    if (!body.texte?.trim()) {
      return NextResponse.json({ erreur: 'Rien à importer.' }, { status: 400 })
    }
    if (!body.section) {
      return NextResponse.json({ erreur: 'Section manquante.' }, { status: 400 })
    }

    const { items, avertissements } =
      body.format === 'csv' ? parserCsv(body.texte) : parserTexteColle(body.texte)

    if (body.apercuSeulement) {
      return NextResponse.json({ items, avertissements, inseres: 0 })
    }

    const inseres =
      items.length > 0
        ? insererItems(items, {
            examId: body.examId ?? 'tagemage',
            section: body.section,
            skillId: body.skillId ?? null,
            source: 'importe',
          })
        : 0

    return NextResponse.json({ items, avertissements, inseres })
  } catch (e) {
    return reponseErreur(e)
  }
}
