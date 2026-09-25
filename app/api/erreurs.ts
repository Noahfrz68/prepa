import { NextResponse } from 'next/server'
import { ErreurRequete } from '@/core/erreurs'

/**
 * Réponse HTTP d'une exception levée dans une route.
 *
 *   — ErreurRequete : son statut et son message, destinés à l'écran ;
 *   — corps de requête illisible : 400 ;
 *   — clé étrangère manquante : la séance a disparu (409), dit en français ;
 *   — base occupée : 503, que le navigateur reprendra de lui-même ;
 *   — tout le reste : 500, avec un message générique. Le détail technique
 *     part dans le terminal où tourne l'application, pas à l'écran.
 */
export function reponseErreur(e: unknown): NextResponse {
  if (e instanceof ErreurRequete) {
    return NextResponse.json({ erreur: e.message }, { status: e.statut })
  }

  if (e instanceof SyntaxError) {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 })
  }

  const code = (e as { code?: unknown })?.code
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return NextResponse.json(
      {
        erreur:
          'Cette séance n’existe plus en base : la réponse ne peut pas être enregistrée. Relance une série.',
      },
      { status: 409 },
    )
  }
  if (code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED') {
    return NextResponse.json(
      { erreur: 'La base est occupée par un autre programme. Nouvel essai en cours…' },
      { status: 503 },
    )
  }

  console.error('[api] erreur inattendue :', e)
  return NextResponse.json(
    {
      erreur:
        'Erreur interne du serveur local. Le détail est affiché dans le terminal où tourne l’application.',
    },
    { status: 500 },
  )
}
