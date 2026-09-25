import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { demarrerEpreuve } from '@/core/db/epreuve'
import type { ModeEpreuve } from '@/exams/tagemage/epreuve'
import { rangerSessionsAbandonnees } from '@/core/db/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { mode } = (await request.json()) as { mode?: string }
    if (mode !== 'blanc' && mode !== 'diagnostic') {
      return NextResponse.json({ erreur: 'Mode invalide.' }, { status: 400 })
    }
    rangerSessionsAbandonnees()
    return NextResponse.json(demarrerEpreuve(mode as ModeEpreuve))
  } catch (e) {
    return reponseErreur(e)
  }
}
