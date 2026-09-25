import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { enregistrerTentative } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: number
      itemId?: number
      reponse?: string | null
      aSaute?: boolean
      tempsMs?: number
      confiance?: number
      /** Temps de lecture du texte support, porté par la 1ʳᵉ question du groupe. */
      tempsPreparationMs?: number | null
    }

    // La confiance et le temps sont obligatoires côté base ; on refuse aussi ici
    // pour renvoyer une erreur lisible plutôt qu'une violation de contrainte.
    const confiance = Number(body.confiance)
    if (!Number.isInteger(confiance) || confiance < 1 || confiance > 4) {
      return NextResponse.json({ erreur: 'Confiance attendue entre 1 et 4.' }, { status: 400 })
    }
    if (!body.sessionId || !body.itemId || !Number.isFinite(Number(body.tempsMs))) {
      return NextResponse.json({ erreur: 'Tentative incomplète.' }, { status: 400 })
    }

    enregistrerTentative({
      sessionId: Number(body.sessionId),
      itemId: Number(body.itemId),
      reponse: body.reponse ?? null,
      aSaute: Boolean(body.aSaute),
      tempsMs: Number(body.tempsMs),
      confiance,
      tempsPreparationMs:
        body.tempsPreparationMs == null ? null : Number(body.tempsPreparationMs),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return reponseErreur(e)
  }
}
