/**
 * L'énoncé d'une question, sous les trois formes qu'il peut prendre.
 *
 * Texte, disposition dessinée, ou image d'annale. Le choix se fait ici et
 * nulle part ailleurs : la question s'affiche à cinq endroits — série,
 * épreuve, récapitulatif d'épreuve, carnet d'erreurs, atelier de relecture —
 * et une règle recopiée cinq fois finit par diverger, ce qui donne une
 * question lisible à l'entraînement et illisible dans le carnet.
 */

import { CaseSeule, FigureLogique } from './Figure'
import type { Case, Figure } from '@/core/figures/types'

interface Source {
  enonce: string
  figure?: Figure | null
  imageHash?: string | null
  /** Question tirée d'une annale : sa correction vient du corrigé officiel. */
  annale?: boolean
}

/**
 * L'image porte-t-elle la question entière, ou seulement son illustration ?
 *
 * Une figure d'annale extraite en bloc contient l'énoncé, le dessin et les
 * propositions : le libellé textuel n'est alors qu'un repère, et l'afficher en
 * grand ferait doublon. Une figure recadrée sur le seul dessin accompagne au
 * contraire un énoncé qui doit se lire normalement — l'escamoter rendrait la
 * question incompréhensible.
 */
function imageSeule(enonce: string): boolean {
  return /^Figure\s+—/.test(enonce.trim())
}

/** Le cadre qui porte le dessin : centré, défilable si l'écran est étroit. */
function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-bord bg-carte px-4 py-6">
      <div className="flex min-w-fit justify-center">{children}</div>
    </div>
  )
}

/** L'énoncé en tête de question, pendant la série ou l'épreuve. */
export function EnonceQuestion({ enonce, figure, imageHash, annale, className = 'mt-8' }: Source & { className?: string }) {
  if (figure) {
    return (
      <div className={className}>
        <h2 className="whitespace-pre-line text-lg leading-relaxed">{enonce}</h2>
        <Cadre>
          <FigureLogique figure={figure} titre={enonce} />
        </Cadre>
      </div>
    )
  }

  if (imageHash) {
    const seule = imageSeule(enonce)
    return (
      <div className={className}>
        {seule ? (
          <p className="text-xs uppercase tracking-wide text-doux">
            {enonce}
            {annale && <span className="ml-2 normal-case tracking-normal">· annale</span>}
          </p>
        ) : (
          <h2 className="whitespace-pre-line text-lg leading-relaxed">{enonce}</h2>
        )}
        <div
          className={`mt-3 overflow-hidden rounded-lg border border-bord bg-white ${seule ? '' : 'mx-auto w-fit max-w-full'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image/${imageHash}`}
            alt={seule ? enonce : 'Figure de l’énoncé'}
            className={seule ? 'w-full' : 'block max-w-full'}
          />
        </div>
      </div>
    )
  }

  return <h2 className={`${className} whitespace-pre-line text-lg leading-relaxed`}>{enonce}</h2>
}

/** Le même énoncé, en petit : correction, carnet, atelier. */
export function EnonceRappel({ enonce, figure, imageHash, annale, className = 'mt-2' }: Source & { className?: string }) {
  if (figure) {
    return (
      <div className={className}>
        <p className="whitespace-pre-line text-sm leading-relaxed">{enonce}</p>
        <Cadre>
          <FigureLogique figure={figure} titre={enonce} />
        </Cadre>
      </div>
    )
  }

  if (imageHash) {
    const seule = imageSeule(enonce)
    return (
      <div className={className}>
        {seule ? (
          <p className="text-xs uppercase tracking-wide text-doux">
            {enonce}
            {annale && <span className="ml-2 normal-case tracking-normal">· annale</span>}
          </p>
        ) : (
          <p className="whitespace-pre-line text-sm leading-relaxed">{enonce}</p>
        )}
        <div
          className={`mt-2 overflow-hidden rounded-lg border border-bord bg-white ${seule ? '' : 'w-fit max-w-full'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image/${imageHash}`}
            alt={seule ? enonce : 'Figure de l’énoncé'}
            className={seule ? 'w-full' : 'block max-w-full'}
          />
        </div>
      </div>
    )
  }

  return <p className={`${className} whitespace-pre-line text-sm leading-relaxed`}>{enonce}</p>
}

/**
 * Le contenu d'une proposition : le dessin quand il y en a un, sinon le texte.
 *
 * Le texte reste écrit sous le dessin. Il dit la même chose en mots — « hexagone
 * portant f » — et c'est lui qu'on relit dans le carnet trois semaines plus
 * tard, quand la figure ne dit plus rien toute seule.
 */
export function Proposition({
  texte,
  c,
  taille = 58,
}: {
  texte: string
  c?: Case | null
  taille?: number
}) {
  if (!c) return <>{texte}</>
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <CaseSeule c={c} taille={taille} />
      <span className="text-xs text-doux">{texte}</span>
    </span>
  )
}
