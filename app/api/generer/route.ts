import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { etatGeneration, genererEtInserer, supprimerGenerees } from '@/core/db/generation'
import { SECTIONS_GENERABLES, type SectionGenerable } from '@/core/generation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Au-delà, la fabrication devient longue sans qu'aucune série n'en profite. */
const MAX_PAR_APPEL = 500

function estSection(v: unknown): v is SectionGenerable {
  return typeof v === 'string' && (SECTIONS_GENERABLES as string[]).includes(v)
}

export async function GET() {
  return NextResponse.json({ etat: etatGeneration() })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'generer' | 'supprimer'
      section?: unknown
      cible?: unknown
      graine?: unknown
    }

    if (!estSection(body.section)) {
      return NextResponse.json(
        { erreur: `Sous-test inconnu ou non générable : ${String(body.section)}.` },
        { status: 400 },
      )
    }

    if (body.action === 'supprimer') {
      const supprimes = supprimerGenerees(body.section)
      return NextResponse.json({ supprimes, etat: etatGeneration() })
    }

    // `cible` est un volume TOTAL visé pour le sous-test, pas un nombre de
    // questions à ajouter : demander « 200 » deux fois de suite doit laisser
    // 200 questions, pas 400.
    const cible = Number(body.cible)
    if (!Number.isInteger(cible) || cible < 1 || cible > 2000) {
      return NextResponse.json({ erreur: 'Volume visé attendu entre 1 et 2000.' }, { status: 400 })
    }

    const avant = etatGeneration().find((e) => e.section === body.section)!
    const manque = Math.min(MAX_PAR_APPEL, cible - (avant.annales + avant.engendrees))

    if (manque <= 0) {
      return NextResponse.json({
        section: body.section,
        demande: 0,
        produites: 0,
        inseres: 0,
        doublons: 0,
        rejets: 0,
        parFamille: {},
        total: avant.annales + avant.engendrees,
        avertissements: [`Le volume de ${cible} est déjà atteint : rien n'a été fabriqué.`],
        etat: etatGeneration(),
      })
    }

    const graine = Number.isInteger(Number(body.graine)) ? Number(body.graine) : Date.now()
    const resultat = genererEtInserer(body.section, manque, graine)

    return NextResponse.json({ ...resultat, graine, etat: etatGeneration() })
  } catch (e) {
    return reponseErreur(e)
  }
}
