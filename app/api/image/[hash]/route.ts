import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Sert une figure extraite d'un PDF, stockée hors de `public/`. */
export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params

  if (!/^[a-f0-9]{8,64}$/.test(hash)) {
    return new Response('Identifiant invalide.', { status: 400 })
  }

  const l = db()
    .prepare(`SELECT chemin_fichier FROM media WHERE hash_script = ? AND type = 'image'`)
    .get(hash) as { chemin_fichier: string | null } | undefined

  if (!l?.chemin_fichier) return new Response('Image introuvable.', { status: 404 })

  const complet = path.join(process.cwd(), 'data', l.chemin_fichier)
  if (!fs.existsSync(complet)) return new Response('Image introuvable.', { status: 404 })

  const donnees = fs.readFileSync(complet)
  return new Response(new Uint8Array(donnees), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(donnees.length),
      // Le nom du fichier est le hash de son contenu : immuable.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
