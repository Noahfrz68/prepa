import { db } from '@/core/db/queries'
import { lireFichier } from '@/core/fichiers/stockage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert un audio synthétisé : depuis `data/audio/` sur le PC (Next ne sert pas
 * ce dossier, hors de `public/` à dessein : c'est une donnée de travail, pas un
 * actif du projet), depuis le stockage du téléphone sur l'iPhone, où il arrive
 * par la synchronisation.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params

  if (!/^[a-f0-9]{8,64}$/.test(hash)) {
    return new Response('Identifiant invalide.', { status: 400 })
  }

  const l = db()
    .prepare(`SELECT chemin_fichier FROM media WHERE hash_script = ?`)
    .get(hash) as { chemin_fichier: string | null } | undefined

  if (!l?.chemin_fichier) return new Response('Audio introuvable.', { status: 404 })

  const donnees = await lireFichier(l.chemin_fichier)
  if (!donnees) return new Response('Audio introuvable.', { status: 404 })

  return new Response(new Uint8Array(donnees), {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(donnees.length),
      // Le fichier est immuable : son nom est le hash de son script.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
