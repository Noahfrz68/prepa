import Link from 'next/link'

/**
 * L'action désignée, une seule, en haut de l'accueil.
 *
 * L'accueil ouvrait sur six portes de même poids — plan, objectifs, réglages,
 * atelier, et les deux examens — sans dire par où commencer. Celui qui arrive
 * choisit alors au hasard, et souvent mal : la seule action évidente pour un
 * débutant, le diagnostic, était enterrée un niveau plus bas.
 *
 * Ce bloc ne remplace aucune de ces portes, il en désigne une. Son contenu suit
 * l'état réel de la préparation, parce qu'un premier pas figé cesserait d'être
 * le bon dès la deuxième séance.
 */
export interface Etape {
  amorce: string
  titre: string
  detail: string
  href: string
  bouton: string
}

export default function PremierPas({ etape }: { etape: Etape }) {
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-accent bg-carte">
      <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-accent">{etape.amorce}</p>
          <h2 className="mt-1.5 text-lg font-semibold">{etape.titre}</h2>
          <p className="mt-1 text-sm leading-relaxed text-doux">{etape.detail}</p>
        </div>

        <Link
          href={etape.href}
          className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond transition hover:opacity-90"
        >
          {etape.bouton}
        </Link>
      </div>
    </section>
  )
}
