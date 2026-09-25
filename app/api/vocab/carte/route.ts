import { NextResponse } from 'next/server'
import { completerCarte, creerOuCompleterCarte, supprimerCarte } from '@/core/db/vocabulaire'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.terme?.trim()) {
      return NextResponse.json({ erreur: 'Terme manquant.' }, { status: 400 })
    }
    return NextResponse.json(creerOuCompleterCarte(body))
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...champs } = await request.json()
    if (!id) return NextResponse.json({ erreur: 'Identifiant manquant.' }, { status: 400 })
    completerCarte(Number(id), champs)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ erreur: 'Identifiant manquant.' }, { status: 400 })
    supprimerCarte(Number(id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ erreur: (e as Error).message }, { status: 400 })
  }
}
