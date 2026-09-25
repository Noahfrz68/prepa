import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import {
  detecterSuspects,
  envoyerEnRelecture,
  fileRelecture,
  marquerVerifiee,
  questionsAVerifier,
  supprimerItem,
  validerItem,
} from '@/core/db/contenu'
import { classerItemsSansSkill } from '@/core/db/classement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ file: fileRelecture(20) })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'valider' | 'supprimer' | 'detecter' | 'classer' | 'verifiee' | 'relecture'
      id?: number
      correction?: {
        enonce?: string
        options?: string[]
        bonneReponse?: string
        explication?: string | null
        skillId?: string | null
      }
    }

    if (body.action === 'classer') {
      const r = classerItemsSansSkill()
      return NextResponse.json({ ...r, file: fileRelecture(20) })
    }

    if (body.action === 'detecter') {
      return NextResponse.json({ suspects: detecterSuspects(), file: fileRelecture(20) })
    }

    if (!body.id) return NextResponse.json({ erreur: 'Identifiant manquant.' }, { status: 400 })

    if (body.action === 'verifiee') {
      marquerVerifiee(Number(body.id))
      return NextResponse.json({ aVerifier: questionsAVerifier(), file: fileRelecture(20) })
    }

    if (body.action === 'relecture') {
      envoyerEnRelecture(Number(body.id))
      return NextResponse.json({ aVerifier: questionsAVerifier(), file: fileRelecture(20) })
    }

    if (body.action === 'supprimer') {
      const r = supprimerItem(Number(body.id))
      return NextResponse.json({ ...r, file: fileRelecture(20) })
    }

    validerItem(Number(body.id), body.correction)
    return NextResponse.json({ ok: true, file: fileRelecture(20) })
  } catch (e) {
    return reponseErreur(e)
  }
}
