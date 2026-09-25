import { NextResponse } from 'next/server'
import { noterProduction } from '@/core/ia/notation'
import { production } from '@/core/db/writing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ erreur: 'Identifiant invalide.' }, { status: 400 })
  }
  return NextResponse.json({ production: production(id) })
}

export async function POST(request: Request) {
  const { id } = (await request.json()) as { id?: number }
  if (!id) return NextResponse.json({ erreur: 'Identifiant manquant.' }, { status: 400 })

  // noterProduction ne lève jamais : un échec est un état, pas une exception.
  return NextResponse.json({
    resultat: await noterProduction(Number(id)),
    production: production(Number(id)),
  })
}
