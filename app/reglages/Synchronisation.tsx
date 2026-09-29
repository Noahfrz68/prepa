'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import type { Bilan } from '@/core/sync/fusion'

const IPHONE = process.env.NEXT_PUBLIC_CIBLE === 'iphone'
const AUTRE = IPHONE ? 'le PC' : 'l’iPhone'

interface Resultat {
  appareil: 'pc' | 'iphone'
  exporteLe: string
  bilan: Bilan
  fichiersRecus: number
  fichiersManquants: number
}

/** Libellé au singulier, au pluriel, et accord (féminin ou non). */
const LIBELLES: Record<string, [string, string, boolean]> = {
  item: ['question', 'questions', true],
  exam_session: ['séance', 'séances', true],
  attempt: ['réponse', 'réponses', true],
  carnet_note: ['note du carnet', 'notes du carnet', true],
  vocab_card: ['carte', 'cartes', true],
  vocab_revision: ['révision', 'révisions', true],
  lecon_session: ['séance d’étude', 'séances d’étude', true],
  plan_tache: ['tâche du plan', 'tâches du plan', true],
  media: ['média', 'médias', false],
}

function accorder(n: number, participe: string, feminin: boolean): string {
  return `${n} ${participe}${feminin ? 'e' : ''}${n > 1 ? 's' : ''}`
}

function resume(bilan: Bilan): string[] {
  const lignes: string[] = []
  for (const [table, [un, plusieurs, feminin]] of Object.entries(LIBELLES)) {
    const t = bilan[table]
    if (!t) continue
    const parts = [
      t.ajoutees && accorder(t.ajoutees, 'ajouté', feminin),
      t.modifiees && `${accorder(t.modifiees, 'mis', feminin)} à jour`,
      t.supprimees && accorder(t.supprimees, 'supprimé', feminin),
    ].filter(Boolean)
    const n = t.ajoutees + t.modifiees + t.supprimees
    if (parts.length) lignes.push(`${n > 1 ? plusieurs : un} : ${parts.join(', ')}`)
  }
  return lignes
}

/** Propose le fichier : feuille de partage sur l'iPhone (Fichiers, iCloud Drive, mail…), téléchargement sinon. */
async function proposer(blob: Blob, nom: string) {
  const fichier = new File([blob], nom, { type: 'application/zip' })
  if (IPHONE && navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: nom })
      return
    } catch (e) {
      // Partage annulé : rien à faire. Toute autre erreur : on retombe sur le téléchargement.
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function Synchronisation() {
  const router = useRouter()
  const entree = useRef<HTMLInputElement>(null)
  const [complet, setComplet] = useState(false)
  const [occupe, setOccupe] = useState<'export' | 'import' | null>(null)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [resultat, setResultat] = useState<Resultat | null>(null)

  async function exporter() {
    setOccupe('export')
    setErreur('')
    setMessage('')
    try {
      const r = await fetch(`/api/sync${complet ? '?complet=1' : ''}`)
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.erreur ?? `Erreur ${r.status}`)
      const nom = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') ?? '')?.[1] ?? 'prepa-synchro.zip'
      const blob = await r.blob()
      await proposer(blob, nom)
      setMessage(`Fichier prêt (${(blob.size / 1_048_576).toFixed(1)} Mo) : importe-le sur ${AUTRE}.`)
    } catch (e) {
      setErreur(`Export impossible : ${(e as Error).message}`)
    } finally {
      setOccupe(null)
    }
  }

  async function importer(fichier: File) {
    setOccupe('import')
    setErreur('')
    setMessage('')
    setResultat(null)
    try {
      const form = new FormData()
      form.append('fichier', fichier)
      const r = await fetch('/api/sync', { method: 'POST', body: form })
      const data = await r.json()
      if (!r.ok) throw new Error(data.erreur ?? `Erreur ${r.status}`)
      setResultat(data as Resultat)
      router.refresh()
    } catch (e) {
      setErreur(`Synchronisation impossible : ${(e as Error).message}`)
    } finally {
      setOccupe(null)
      if (entree.current) entree.current.value = ''
    }
  }

  const lignes = resultat ? resume(resultat.bilan) : []

  return (
    <div className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
      <ol className="list-decimal space-y-1 pl-5 leading-relaxed text-doux">
        <li>
          Ici, <span className="text-texte">prépare le fichier</span>, et fais-le passer sur {AUTRE}{' '}
          {IPHONE ? '(Fichiers, iCloud Drive, mail…)' : '(iCloud Drive, OneDrive, mail, câble…)'}.
        </li>
        <li>
          Sur {AUTRE}, dans les Réglages, <span className="text-texte">importe-le</span> : ce qui a été fait de ce
          côté s’ajoute à ce qui a été fait de l’autre, sans rien écraser.
        </li>
        <li>Puis dans l’autre sens, pour que les deux soient à jour.</li>
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exporter}
          disabled={occupe !== null}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fond disabled:opacity-50"
        >
          {occupe === 'export' ? 'Préparation…' : `Préparer le fichier pour ${AUTRE}`}
        </button>
        <label className="flex items-center gap-2 text-xs text-doux">
          <input type="checkbox" checked={complet} onChange={(e) => setComplet(e.target.checked)} />
          Tout inclure, même les figures et audios déjà envoyés
        </label>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => entree.current?.click()}
          disabled={occupe !== null}
          className="rounded-lg border border-bord px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {occupe === 'import' ? 'Fusion en cours…' : `Importer un fichier venu de ${AUTRE}`}
        </button>
        <input
          ref={entree}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importer(f)
          }}
        />
      </div>

      {message && <p className="mt-3 text-juste">{message}</p>}
      {erreur && <p className="mt-3 text-faux">{erreur}</p>}

      {resultat && (
        <div className="mt-3 rounded-lg border border-bord px-4 py-3">
          <p className="font-medium">
            Fusion faite avec le fichier {resultat.appareil === 'iphone' ? 'de l’iPhone' : 'du PC'} du{' '}
            {new Date(resultat.exporteLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.
          </p>
          {lignes.length > 0 ? (
            <ul className="mt-1 list-disc pl-5 text-doux">
              {lignes.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-doux">Rien de nouveau : les deux appareils étaient déjà à jour.</p>
          )}
          {resultat.fichiersRecus > 0 && (
            <p className="mt-1 text-doux">
              {resultat.fichiersRecus} figure{resultat.fichiersRecus > 1 ? 's' : ''} ou audio
              {resultat.fichiersRecus > 1 ? 's' : ''} reçu{resultat.fichiersRecus > 1 ? 's' : ''}.
            </p>
          )}
          {resultat.fichiersManquants > 0 && (
            <p className="mt-1 text-blanc">
              {resultat.fichiersManquants} figure{resultat.fichiersManquants > 1 ? 's' : ''} ou audio
              {resultat.fichiersManquants > 1 ? 's' : ''} toujours absent{resultat.fichiersManquants > 1 ? 's' : ''} de
              cet appareil : sur {AUTRE}, prépare un fichier en cochant « Tout inclure ».
            </p>
          )}
          <p className="mt-2 text-xs text-doux">
            La base d’avant cette fusion est gardée en copie : on peut revenir en arrière.
          </p>
        </div>
      )}
    </div>
  )
}
