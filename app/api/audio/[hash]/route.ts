import fs from 'node:fs'
import { cheminAudio } from '@/core/db/listening'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert un audio synthétisé depuis `data/audio/`.
 *
 * Next ne sert pas ce dossier : il est hors de `public/` à dessein, parce que
 * son contenu est une donnée de travail, pas un actif du projet.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params

  if (!/^[a-f0-9]{8,64}$/.test(hash)) {
    return new Response('Identifiant invalide.', { status: 400 })
  }

  const chemin = cheminAudio(hash)
  if (!chemin) return new Response('Audio introuvable.', { status: 404 })

  const donnees = fs.readFileSync(chemin)
  return new Response(new Uint8Array(donnees), {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(donnees.length),
      // Le fichier est immuable : son nom est le hash de son script.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
