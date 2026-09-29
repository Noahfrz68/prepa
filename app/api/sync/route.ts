import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { ErreurRequete } from '@/core/erreurs'
import { creerPaquet, importerPaquet } from '@/core/sync/paquet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Au-delà, ce n'est plus un fichier de synchronisation : des mois d'audios, peut-être. */
const TAILLE_MAX = 500 * 1024 * 1024

/**
 * Synchronisation PC ↔ iPhone par fichier (core/sync/paquet.ts).
 *
 *   GET  ?complet=1  → le fichier à emporter sur l'autre appareil ;
 *   POST fichier     → fusionne le fichier venu de l'autre appareil.
 */
export async function GET(request: Request) {
  try {
    const complet = new URL(request.url).searchParams.get('complet') === '1'
    const { octets, nom } = await creerPaquet(complet)
    return new NextResponse(new Uint8Array(octets), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${nom}"`,
        'Content-Length': String(octets.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return reponseErreur(e)
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const fichier = form.get('fichier')
    if (!(fichier instanceof File)) throw new ErreurRequete('Aucun fichier reçu.')
    if (fichier.size > TAILLE_MAX) throw new ErreurRequete('Fichier trop volumineux (500 Mo maximum).')
    const resultat = await importerPaquet(new Uint8Array(await fichier.arrayBuffer()))
    return NextResponse.json(resultat)
  } catch (e) {
    return reponseErreur(e)
  }
}
