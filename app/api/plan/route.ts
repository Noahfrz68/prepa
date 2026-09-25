import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import {
  marquerLeconEtudiee,
  marquerTache,
  oublierLecon,
  planDeLaSemaine,
} from '@/core/db/semaine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ plan: planDeLaSemaine() })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'cocher' | 'refaire' | 'lecon'
      id?: number
      fait?: boolean
      skillId?: string
      minutes?: number
      etudiee?: boolean
    }

    if (body.action === 'refaire') {
      // Refaire efface l'avancement coché : un plan refait n'est pas le même plan.
      return NextResponse.json({ plan: planDeLaSemaine(true) })
    }

    if (body.action === 'cocher') {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ erreur: 'Tâche inconnue.' }, { status: 400 })
      }
      marquerTache(id, body.fait !== false)
      return NextResponse.json({ plan: planDeLaSemaine() })
    }

    if (body.action === 'lecon') {
      const skillId = String(body.skillId ?? '')
      if (!skillId.startsWith('tm.')) {
        return NextResponse.json({ erreur: 'Leçon inconnue.' }, { status: 400 })
      }
      if (body.etudiee === false) oublierLecon(skillId)
      else marquerLeconEtudiee(skillId, Number(body.minutes) || 0)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
