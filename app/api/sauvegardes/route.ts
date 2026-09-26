import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { rangerSauvegardesNommees } from '@/core/db/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ranger les copies nommées (« avant-… ») : `apercu` dit ce qui serait
 * supprimé, `ranger` le supprime. Les sauvegardes quotidiennes ne sont jamais
 * touchées ici — elles tournent seules.
 */
export async function POST(request: Request) {
  try {
    const { action, jours } = (await request.json()) as { action?: 'apercu' | 'ranger'; jours?: number }
    const j = Number(jours)
    if (!Number.isInteger(j) || j < 1) {
      return NextResponse.json({ erreur: 'Âge minimal en jours attendu.' }, { status: 400 })
    }
    if (action === 'apercu') return NextResponse.json({ fichiers: rangerSauvegardesNommees(j, true) })
    if (action === 'ranger') return NextResponse.json({ fichiers: rangerSauvegardesNommees(j, false) })
    return NextResponse.json({ erreur: 'Action inconnue.' }, { status: 400 })
  } catch (e) {
    return reponseErreur(e)
  }
}
