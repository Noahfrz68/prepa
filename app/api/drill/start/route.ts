import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { demarrerDrill } from '@/core/db/queries'
import { itemsARejouer } from '@/core/db/carnet'
import { rangerSessionsAbandonnees } from '@/core/db/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { section, taille, skills, carnet } = (await request.json()) as {
      section?: string
      taille?: number
      skills?: string[]
      /** Rejouer ce qui a été raté, plutôt que de tirer dans la banque. */
      carnet?: boolean
    }
    if (!section) {
      return NextResponse.json({ erreur: 'Section manquante.' }, { status: 400 })
    }

    // Chaque lancement range ce qui a été quitté en route (voir sessions.ts).
    rangerSessionsAbandonnees()

    const n = Math.max(1, Math.min(90, Number(taille) || 15))

    // Le carnet impose ses questions : `section` sert alors de filtre, et
    // « toutes » signifie qu'on rejoue les erreurs de tous les sous-tests.
    const imposes = carnet ? itemsARejouer(section === 'toutes' ? null : section, n) : []
    if (carnet && imposes.length === 0) {
      return NextResponse.json(
        { erreur: 'Rien à rejouer : aucune erreur en attente pour ce filtre.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      demarrerDrill(section, n, Array.isArray(skills) ? skills : [], imposes),
    )
  } catch (e) {
    return reponseErreur(e)
  }
}
