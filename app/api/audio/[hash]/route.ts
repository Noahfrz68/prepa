import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/core/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Chemin sur le disque de l'audio synthétisé pour ce script, s'il existe.
 * Ici plutôt que dans core/db/listening.ts : c'est la seule lecture du disque
 * du module, et le reste tourne aussi dans le navigateur (version iPhone).
 */
function cheminAudio(hash: string): string | null {
  const l = db()
    .prepare(`SELECT chemin_fichier FROM media WHERE hash_script = ?`)
    .get(hash) as { chemin_fichier: string | null } | undefined

  if (!l?.chemin_fichier) return null

  const complet = path.join(process.cwd(), 'data', l.chemin_fichier)
  return fs.existsSync(complet) ? complet : null
}

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
