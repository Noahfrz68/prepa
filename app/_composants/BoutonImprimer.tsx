'use client'

/** Ouvre la boîte d'impression du navigateur (« Enregistrer en PDF » y figure aussi). */
export default function BoutonImprimer({ libelle = 'Imprimer' }: { libelle?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="sans-impression rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
    >
      {libelle}
    </button>
  )
}
