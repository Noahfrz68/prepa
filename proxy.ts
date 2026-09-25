import { NextResponse, type NextRequest } from 'next/server'

/**
 * Garde d'accès : l'application ne répond qu'à cette machine, et ses API
 * n'acceptent d'écriture que depuis ses propres pages.
 *
 * Les API n'ont aucune authentification — il n'y a qu'un utilisateur. Deux
 * voies permettaient pourtant de les appeler de l'extérieur :
 *
 *   — le réseau : le serveur écoutait sur toutes les interfaces, et n'importe
 *     quel appareil du même wifi pouvait supprimer des questions ou lancer
 *     des débriefs payés avec tes clés. `npm run dev` écoute désormais sur
 *     127.0.0.1 ; ce contrôle de l'en-tête Host le double, et bloque aussi le
 *     « DNS rebinding » (un nom de domaine qui pointe vers 127.0.0.1) ;
 *
 *   — ton propre navigateur : une page web quelconque peut envoyer un POST à
 *     http://localhost:3000. Le navigateur marque ces requêtes (Origin,
 *     Sec-Fetch-Site) : on refuse toute écriture qui ne vient pas d'ici.
 */
const HOTES_LOCAUX = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hote = host.replace(/:\d+$/, '').toLowerCase()

  if (!HOTES_LOCAUX.has(hote)) {
    return new NextResponse('Accès réservé à cette machine.', { status: 403 })
  }

  const lecture = request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS'
  if (!lecture) {
    if (request.headers.get('sec-fetch-site') === 'cross-site') {
      return NextResponse.json({ erreur: 'Requête d’un autre site refusée.' }, { status: 403 })
    }
    const origine = request.headers.get('origin')
    if (origine && origine !== 'null') {
      let hoteOrigine = ''
      try {
        hoteOrigine = new URL(origine).hostname.toLowerCase()
      } catch {
        /* origine illisible : refusée ci-dessous */
      }
      if (!HOTES_LOCAUX.has(hoteOrigine) && !HOTES_LOCAUX.has(`[${hoteOrigine}]`)) {
        return NextResponse.json({ erreur: 'Requête d’un autre site refusée.' }, { status: 403 })
      }
    }
  }

  return NextResponse.next()
}
