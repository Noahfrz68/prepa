'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

interface ItemARelire {
  id: number
  section: string
  sectionLibelle: string
  typeItem: string
  statut: string
  enonce: string
  contexteTexte: string | null
  info1: string | null
  info2: string | null
  options: string[]
  bonneReponse: string
  explication: string | null
  source: string
  nTentatives: number
  tauxReussite: number | null
  imageHash: string | null
}

interface FileRelecture {
  items: ItemARelire[]
  restants: number
  parStatut: Record<string, number>
  sansReponse: number
}

interface EtatGeneration {
  section: string
  libelle: string
  annales: number
  engendrees: number
}

interface EtatAtelier {
  parStatut: Record<string, number>
  parSource: Record<string, number>
  total: number
  sansSkill: number
}

const OPTIONS_CM = [
  '(1) seule suffit, (2) seule ne suffit pas',
  '(2) seule suffit, (1) seule ne suffit pas',
  'Les deux ensemble, aucune seule',
  'Chacune suffit seule',
  'Les deux ensemble ne suffisent pas',
]

/** Volume visé par sous-test, dans l'écran de génération. */
const CIBLE_DEFAUT = 200

export default function AtelierClient({
  fileInitiale,
  etat,
  doublons,
  generationInitiale,
}: {
  fileInitiale: FileRelecture
  etat: EtatAtelier
  doublons: Array<{ enonce: string; sectionLibelle: string; ids: number[] }>
  generationInitiale: EtatGeneration[]
}) {
  const router = useRouter()
  const [file, setFile] = useState(fileInitiale)
  const [generation, setGeneration] = useState(generationInitiale)
  const [cible, setCible] = useState(CIBLE_DEFAUT)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [reponse, setReponse] = useState('')
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)
  const fichierTextes = useRef<HTMLInputElement>(null)

  const item = file.items[0] ?? null
  const options = item?.typeItem === 'conditions_minimales' ? OPTIONS_CM : (item?.options ?? [])

  useEffect(() => {
    setReponse(item?.bonneReponse ?? '')
    setErreur('')
  }, [item?.id, item?.bonneReponse])

  const agir = useCallback(
    async (action: 'valider' | 'supprimer', corps: Record<string, unknown> = {}) => {
      if (!item || occupe) return
      setOccupe(true)
      setErreur('')
      try {
        const r = await fetch('/api/atelier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, id: item.id, ...corps }),
        })
        const data = await r.json()
        if (!r.ok) {
          setErreur(data.erreur)
          return
        }
        setFile(data.file)
        setMessage(
          action === 'supprimer'
            ? `Item supprimé${data.tentativesSupprimees > 0 ? ` avec ${data.tentativesSupprimees} tentative(s)` : ''}.`
            : 'Validé.',
        )
        router.refresh()
      } finally {
        setOccupe(false)
      }
    },
    [item, occupe, router],
  )

  const valider = useCallback(() => {
    if (!reponse) {
      setErreur('Choisis la bonne réponse avant de valider.')
      return
    }
    void agir('valider', { correction: { bonneReponse: reponse } })
  }, [agir, reponse])

  /* ------------------------------------------------------- clavier -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!item) return

      const k = e.key.toLowerCase()
      const n = Number(k)

      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        e.preventDefault()
        setReponse(LETTRES[n - 1])
        return
      }
      const l = LETTRES.indexOf(k.toUpperCase() as (typeof LETTRES)[number])
      if (l >= 0 && l < options.length) {
        e.preventDefault()
        setReponse(LETTRES[l])
        return
      }
      if (k === 'enter') {
        e.preventDefault()
        valider()
      } else if (k === 'delete') {
        e.preventDefault()
        void agir('supprimer')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [agir, item, options.length, valider])

  /* --------------------------------------------------------- PDF -- */

  async function importerPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setOccupe(true)
    setErreur('')
    setMessage('Extraction en cours…')
    try {
      const form = new FormData()
      form.append('fichier', f)
      const r = await fetch('/api/import/pdf', { method: 'POST', body: form })
      const data = await r.json()

      if (!r.ok) {
        setErreur(data.erreur)
        setMessage('')
        return
      }

      setMessage(
        `${data.inseres} question(s) importée(s) en relecture sur ${data.total} extraite(s)` +
          (data.doublons > 0 ? `, ${data.doublons} doublon(s) écarté(s)` : '') +
          (data.sansReponse > 0 ? `, ${data.sansReponse} sans réponse à compléter` : '') +
          `. ${data.avertissements.join(' ')}`,
      )
      await rafraichir()
    } finally {
      setOccupe(false)
      if (fichier.current) fichier.current.value = ''
    }
  }

  async function importerTextes(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setOccupe(true)
    setErreur('')
    setMessage('Lecture de la série…')
    try {
      const form = new FormData()
      form.append('fichier', f)
      const r = await fetch('/api/import/textes', { method: 'POST', body: form })
      const data = await r.json()

      if (!r.ok) {
        setErreur(data.erreur)
        setMessage('')
        return
      }

      setMessage(
        `${data.inseres} question(s) importée(s) en relecture, ` +
          `sur ${data.totalQuestions} lue(s) et ${data.totalTextes} texte(s) support` +
          (data.doublons > 0 ? `, ${data.doublons} doublon(s) écarté(s)` : '') +
          (data.sansSkill > 0 ? `, ${data.sansSkill} dont le type n’a pas été reconnu` : '') +
          (data.nbAnomalies > 0
            ? `. ${data.nbAnomalies} point(s) à vérifier : ` +
              data.anomalies
                .slice(0, 3)
                .map((a: { fichier: string; numero: number; motif: string }) =>
                  `${a.fichier} Q${a.numero} — ${a.motif}`,
                )
                .join(' ; ')
            : '. Aucune anomalie d’appariement détectée.') +
          ` ${data.avertissements.join(' ')}`,
      )
      await rafraichir()
    } finally {
      setOccupe(false)
      if (fichierTextes.current) fichierTextes.current.value = ''
    }
  }

  async function classer() {
    setOccupe(true)
    setMessage('')
    setErreur('')
    try {
      const r = await fetch('/api/atelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'classer' }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErreur(data.erreur)
        return
      }
      setFile(data.file)
      setMessage(
        data.examines === 0
          ? 'Toutes les questions portent déjà un type.'
          : `${data.classes} item(s) classé(s) sur ${data.examines}` +
            (data.restants > 0
              ? `. ${data.restants} restent sans type : leur énoncé ne permet pas de trancher, et un classement inventé enverrait le plan travailler la mauvaise chose.`
              : '.'),
      )
      router.refresh()
    } finally {
      setOccupe(false)
    }
  }

  async function rafraichir() {
    const r = await fetch('/api/atelier')
    setFile((await r.json()).file)
    router.refresh()
  }

  async function detecter() {
    setOccupe(true)
    setMessage('')
    try {
      const r = await fetch('/api/atelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detecter' }),
      })
      const data = await r.json()
      setFile(data.file)
      setMessage(
        data.suspects.length === 0
          ? 'Aucun item aberrant. Il en faut au moins 5 tentatives pour juger.'
          : `${data.suspects.length} item(s) marqué(s) suspects : ${data.suspects[0].raison}`,
      )
      router.refresh()
    } finally {
      setOccupe(false)
    }
  }

  async function generer(section: string, libelle: string) {
    setEnCours(section)
    setMessage('')
    setErreur('')
    try {
      const r = await fetch('/api/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', section, cible }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErreur(data.erreur)
        return
      }
      setGeneration(data.etat)
      setMessage(
        `${libelle} : ${data.inseres} question(s) ajoutée(s), ${data.total} en banque. ` +
          (data.avertissements.length > 0 ? data.avertissements.join(' ') : ''),
      )
      router.refresh()
    } finally {
      setEnCours(null)
    }
  }

  async function retirerGenerees(section: string, libelle: string) {
    setEnCours(section)
    setMessage('')
    try {
      const r = await fetch('/api/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supprimer', section }),
      })
      const data = await r.json()
      setGeneration(data.etat)
      setMessage(`${libelle} : ${data.supprimes} question(s) fabriquée(s) retirée(s).`)
      router.refresh()
    } finally {
      setEnCours(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Mes questions</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Le contenu est un consommable : ce qui entre doit pouvoir être relu vite, et ce qui se
          révèle faux à l’usage doit remonter tout seul. Une question fausse n’est pas seulement
          inutile —
          elle apprend quelque chose de faux et fausse la calibration.
        </p>
      </header>

      {/* État */}
      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <span>
            <span className="chiffres text-2xl font-semibold">{etat.total}</span>
            <span className="text-doux"> questions</span>
          </span>
          {Object.entries(etat.parStatut).map(([s, n]) => (
            <span key={s} className={s === 'valide' ? 'text-juste' : 'text-blanc'}>
              <span className="chiffres">{n}</span> {s.replace('_', ' ')}
            </span>
          ))}
          {etat.sansSkill > 0 && (
            <span className="text-doux">
              <span className="chiffres">{etat.sansSkill}</span> sans type
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fichier.current?.click()}
            disabled={occupe}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
          >
            Importer un PDF d’annales
          </button>
          <input
            ref={fichier}
            type="file"
            accept="application/pdf,.pdf"
            onChange={importerPdf}
            className="hidden"
          />

          <button
            onClick={() => fichierTextes.current?.click()}
            disabled={occupe}
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte disabled:opacity-40"
          >
            Importer une série de compréhension
          </button>
          <input
            ref={fichierTextes}
            type="file"
            accept=".md,.markdown,.txt,.zip,application/zip"
            onChange={importerTextes}
            className="hidden"
          />

          <button
            onClick={() => void classer()}
            disabled={occupe || etat.sansSkill === 0}
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte disabled:opacity-40"
          >
            Classer par type de question
            {etat.sansSkill > 0 && <span className="chiffres ml-2 text-blanc">{etat.sansSkill}</span>}
          </button>

          <button
            onClick={() => void detecter()}
            disabled={occupe}
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte disabled:opacity-40"
          >
            Repérer les questions douteuses
          </button>

          <Link href="/import" className="text-sm text-doux hover:text-texte">
            Coller du texte →
          </Link>
        </div>

        {message && <p className="mt-3 text-sm leading-relaxed text-juste">{message}</p>}
        <p className="mt-3 text-xs leading-relaxed text-doux">
          Les deux imports ne traitent que le fichier que tu ouvres depuis ton disque, et rien n’est
          jamais servi sans relecture. Les questions dont le corrigé ne donne pas la réponse arrivent
          avec une réponse vide — aucune n’est devinée. Une série de compréhension se dépose en{' '}
          <span className="text-texte">.md</span> ou en <span className="text-texte">.zip</span>, avec
          ses textes support et son corrigé ; le rattachement de chaque question à son passage est
          vérifié avant l’enregistrement.
        </p>
      </section>

      {/* Fabrication de questions */}
      <section className="rounded-xl border border-bord bg-carte px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm uppercase tracking-widest text-doux">Fabriquer des questions</h2>
          <label className="flex items-center gap-2 text-xs text-doux">
            Volume visé par sous-test
            <input
              type="number"
              min={1}
              max={500}
              value={cible}
              onChange={(e) => setCible(Number(e.target.value))}
              className="chiffres w-20 rounded-md border border-bord bg-fond px-2 py-1 text-right text-sm text-texte"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {generation.map((g) => {
            const total = g.annales + g.engendrees
            const atteint = total >= cible
            return (
              <div
                key={g.section}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bord bg-fond px-4 py-3"
              >
                <div className="min-w-40">
                  <p className="text-sm">{g.libelle}</p>
                  <p className="mt-0.5 text-xs text-doux">
                    <span className="chiffres">{g.annales}</span> d’annales ·{' '}
                    <span className="chiffres">{g.engendrees}</span> fabriquées
                  </p>
                </div>

                <div className="flex flex-1 items-center gap-3">
                  <div className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-bord">
                    <div
                      className={atteint ? 'h-full bg-juste' : 'h-full bg-accent'}
                      style={{ width: `${Math.min(100, (total / Math.max(1, cible)) * 100)}%` }}
                    />
                  </div>
                  <span className="chiffres w-16 text-right text-sm text-doux">
                    {total} / {cible}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void generer(g.section, g.libelle)}
                    disabled={enCours !== null || atteint}
                    className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
                  >
                    {enCours === g.section ? 'En cours…' : atteint ? 'Complet' : 'Compléter'}
                  </button>
                  {g.engendrees > 0 && (
                    <button
                      onClick={() => void retirerGenerees(g.section, g.libelle)}
                      disabled={enCours !== null}
                      className="rounded-lg border border-bord px-3 py-2 text-xs text-doux transition hover:border-faux hover:text-texte disabled:opacity-40"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-doux">
          Ces cinq sous-tests se fabriquent, mais pas de la même façon. En calcul, en logique et en
          conditions minimales, le programme pose les paramètres puis{' '}
          <span className="text-texte">calcule</span> la réponse : elle est juste par construction. En
          expression et en raisonnement, il puise dans un corpus écrit à la main, où chaque faute et
          chaque faille sont nommées — la garantie y est de rédaction, pas de démonstration. Dans les
          deux cas la forme est vérifiée avant l’enregistrement, et la provenance reste marquée : ce
          ne sont pas des questions d’annale. La compréhension de textes, elle, ne se fabrique pas —
          il lui faut de vrais textes, et donc un import.
        </p>
      </section>

      {/* File de relecture */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm uppercase tracking-widest text-doux">File de relecture</h2>
          <span className="chiffres text-sm text-doux">
            {file.restants} restant{file.restants > 1 ? 's' : ''}
            {file.sansReponse > 0 && ` · ${file.sansReponse} sans réponse`}
          </span>
        </div>

        {!item ? (
          <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
            Rien à relire. Tout ce qui est en banque a été validé.
          </p>
        ) : (
          <div className="rounded-xl border border-bord bg-carte px-5 py-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
              <span className={item.statut === 'suspect' ? 'text-faux' : 'text-blanc'}>
                {item.statut === 'suspect' ? 'suspect' : 'à relire'}
              </span>
              <span>{item.sectionLibelle}</span>
              <span>source : {item.source}</span>
              {item.nTentatives > 0 && (
                <span className="chiffres">
                  {item.nTentatives} tentative{item.nTentatives > 1 ? 's' : ''} ·{' '}
                  {Math.round((item.tauxReussite ?? 0) * 100)} % de réussite
                </span>
              )}
              {!item.bonneReponse && <span className="text-faux">réponse manquante</span>}
            </div>

            {item.contexteTexte && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-bord bg-fond p-4 text-xs leading-relaxed text-doux">
                {item.contexteTexte}
              </div>
            )}

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{item.enonce}</p>

            {item.imageHash && (
              // Sans la figure, la relecture d'une question graphique
              // reviendrait à valider à l'aveugle.
              <div className="mt-3 overflow-hidden rounded-lg border border-bord bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/image/${item.imageHash}`} alt={item.enonce} className="w-full" />
              </div>
            )}

            {item.typeItem === 'conditions_minimales' && (
              <div className="mt-3 space-y-1 rounded-lg border border-bord bg-fond p-4 text-sm">
                <p>
                  <span className="mr-2 text-doux">(1)</span>
                  {item.info1}
                </p>
                <p>
                  <span className="mr-2 text-doux">(2)</span>
                  {item.info2}
                </p>
              </div>
            )}

            <ul className="mt-4 space-y-1.5">
              {options.map((o, i) => (
                <li key={i}>
                  <button
                    onClick={() => setReponse(LETTRES[i])}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                      reponse === LETTRES[i]
                        ? 'border-juste bg-carte-clair'
                        : 'border-bord hover:border-accent'
                    }`}
                  >
                    <span className="kbd mt-0.5">{i + 1}</span>
                    <span className="font-medium text-doux">{LETTRES[i]}.</span>
                    <span className="flex-1">{o}</span>
                  </button>
                </li>
              ))}
            </ul>

            {item.explication && (
              <p className="mt-3 border-t border-bord pt-3 text-sm text-doux">{item.explication}</p>
            )}

            {erreur && <p className="mt-3 text-sm text-faux">{erreur}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={valider}
                disabled={occupe}
                className="rounded-lg bg-accent px-4 py-2 font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
              >
                Valider <span className="kbd ml-2">entrée</span>
              </button>
              <button
                onClick={() => void agir('supprimer')}
                disabled={occupe}
                className="rounded-lg border border-bord px-4 py-2 text-doux transition hover:border-faux hover:text-faux disabled:opacity-40"
              >
                Supprimer <span className="kbd ml-2">suppr</span>
              </button>
              <span className="text-xs text-doux">
                <span className="kbd mr-1">1</span>…<span className="kbd mx-1">5</span> choisir la
                bonne réponse
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Doublons */}
      {doublons.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
            Doublons — {doublons.length}
          </h2>
          <ul className="space-y-2">
            {doublons.slice(0, 10).map((d) => (
              <li
                key={d.ids.join('-')}
                className="rounded-lg border border-bord bg-carte px-4 py-3 text-sm"
              >
                <span className="text-xs text-doux">{d.sectionLibelle}</span>
                <p className="mt-1">{d.enonce.slice(0, 140)}</p>
                <p className="chiffres mt-1 text-xs text-doux">
                  {d.ids.length} exemplaires · identifiants {d.ids.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
