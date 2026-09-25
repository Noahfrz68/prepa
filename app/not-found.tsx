import Link from 'next/link'

/**
 * Page introuvable : une épreuve supprimée, un lien d'avant une
 * réorganisation, une adresse mal tapée. La page par défaut de Next.js
 * n'offrait aucun chemin de retour ; celle-ci renvoie vers les trois endroits
 * d'où l'on repart.
 */
export default function Introuvable() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-doux">Page introuvable</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Rien à cette adresse</h1>
      <p className="mt-3 text-sm leading-relaxed text-doux">
        La page a peut-être été déplacée, ou l’épreuve qu’elle affichait n’existe plus en base —
        une séance vide abandonnée est rangée au bout de 12 heures.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Accueil
        </Link>
        <Link
          href="/tagemage"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          TAGE MAGE
        </Link>
        <Link
          href="/plan"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Plan de la semaine
        </Link>
      </div>
    </main>
  )
}
