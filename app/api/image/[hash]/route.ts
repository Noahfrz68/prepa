import { db } from '@/core/db/queries'
import { lireFichier } from '@/core/fichiers/stockage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert une figure extraite d'un PDF, stockée hors de `public/` : dans data/
 * sur le PC, dans le stockage du téléphone sur l'iPhone.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params

  if (!/^[a-f0-9]{8,64}$/.test(hash)) {
    return new Response('Identifiant invalide.', { status: 400 })
  }

  const l = db()
    .prepare(`SELECT chemin_fichier FROM media WHERE hash_script = ? AND type = 'image'`)
    .get(hash) as { chemin_fichier: string | null } | undefined

  if (!l?.chemin_fichier) return new Response('Image introuvable.', { status: 404 })

  const donnees = await lireFichier(l.chemin_fichier)
  if (!donnees) return new Response('Image introuvable.', { status: 404 })

  return new Response(new Uint8Array(donnees), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(donnees.length),
      // Le nom du fichier est le hash de son contenu : immuable.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
