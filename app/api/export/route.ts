import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { copieBase, exportJson } from '@/core/db/export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Téléchargement de toutes les données : `?format=sqlite` (défaut) ou `?format=json`. */
export async function GET(request: Request) {
  try {
    const format = new URL(request.url).searchParams.get('format') === 'json' ? 'json' : 'sqlite'
    const jour = new Date().toLocaleDateString('sv-SE')

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportJson(), null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="prepa-${jour}.json"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const copie = await copieBase()
    return new NextResponse(new Uint8Array(copie), {
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="prepa-${jour}.db"`,
        'Content-Length': String(copie.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return reponseErreur(e)
  }
}
