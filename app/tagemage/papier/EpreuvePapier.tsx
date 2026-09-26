'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { EnonceRappel, Proposition } from '@/app/_composants/Enonce'
import { poster } from '@/app/_composants/reseau'
import BoutonImprimer from '@/app/_composants/BoutonImprimer'
import { jourLisible } from '@/app/_composants/dates'
import type { Case, Figure } from '@/core/figures/types'
import { OPTIONS_CONDITIONS_MINIMALES } from '@/exams/tagemage'
import { LIBELLE_MODE, type ModeEpreuve } from '@/exams/tagemage/epreuve'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

interface Item {
  id: number
  typeItem: 'qcm' | 'conditions_minimales'
  enonce: string
  contexteTexte: string | null
  info1: string | null
  info2: string | null
  options: string[]
  imageHash: string | null
  figure: Figure | null
  optionsFigure: Case[] | null
}

interface Etape {
  section: string
  numero: number
  libelle: string
  questions: number
  secondes: number
  items: Item[]
}

interface Composition {
  mode: ModeEpreuve
  etapes: Etape[]
  composeeLe: number
}

type Reponse = { lettre: string | null; confiance: number | null }

const cle = (mode: ModeEpreuve) => `prepa.papier.${mode}`
/** Le brouillon de saisie : 90 réponses recopiées ne se retapent pas deux fois. */
const cleSaisie = (mode: ModeEpreuve) => `prepa.papier.${mode}.saisie`

interface Brouillon {
  composeeLe: number
  reponses: Record<string, Reponse[]>
  minutes: Record<string, number>
}

function lireBrouillon(mode: ModeEpreuve, composeeLe: number): Brouillon | null {
  try {
    const brut = localStorage.getItem(cleSaisie(mode))
    const b = brut ? (JSON.parse(brut) as Brouillon) : null
    // Un brouillon d'un autre sujet ne vaut rien pour celui-ci.
    return b && b.composeeLe === composeeLe ? b : null
  } catch {
    return null
  }
}

function effacer(mode: ModeEpreuve) {
  try {
    localStorage.removeItem(cle(mode))
    localStorage.removeItem(cleSaisie(mode))
  } catch {
    /* rien à effacer */
  }
}

/** Le sujet gardé dans ce navigateur, brut : une chaîne se compare, un objet non. */
function lireBrut(mode: ModeEpreuve): string | null {
  try {
    return localStorage.getItem(cle(mode))
  } catch {
    return null
  }
}
function abonnerStockage(prevenir: () => void) {
  window.addEventListener('storage', prevenir)
  return () => window.removeEventListener('storage', prevenir)
}
function analyser(brut: string | null): Composition | null {
  try {
    return brut ? (JSON.parse(brut) as Composition) : null
  } catch {
    return null
  }
}

/**
 * L'épreuve sur papier.
 *
 * L'écran ne remplace pas la feuille : lire un texte de compréhension, poser
 * un calcul, barrer des propositions, tout cela se fait mieux au crayon — et
 * c'est ainsi que se passe le vrai TAGE MAGE. Trois temps : composer le sujet
 * (aucune séance ouverte), l'imprimer avec sa feuille de réponses, puis saisir
 * les réponses notées. Le sujet est gardé dans ce navigateur jusqu'à la saisie.
 */
export default function EpreuvePapier({ mode }: { mode: ModeEpreuve }) {
  const router = useRouter()
  // Le sujet composé un autre jour est retrouvé au retour sur la page : lu
  // comme un état externe du navigateur. Tant que l'utilisateur n'a rien
  // choisi (undefined), c'est lui qui décide de la vue.
  const brutSauve = useSyncExternalStore(abonnerStockage, () => lireBrut(mode), () => null)
  const sauvee = useMemo(() => analyser(brutSauve), [brutSauve])
  const [compositionChoisie, setComposition] = useState<Composition | null | undefined>(undefined)
  const [vueChoisie, setVue] = useState<'accueil' | 'sujet' | 'saisie' | undefined>(undefined)
  const composition = compositionChoisie !== undefined ? compositionChoisie : sauvee
  const vue = vueChoisie ?? (sauvee ? 'sujet' : 'accueil')
  const [reponses, setReponses] = useState<Record<string, Reponse[]>>({})
  const [minutes, setMinutes] = useState<Record<string, number>>({})
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')


  const composer = async () => {
    setOccupe(true)
    setErreur('')
    try {
      const data = await poster<{ etapes: Etape[] }>('/api/epreuve/papier', { action: 'composer', mode })
      const c: Composition = { mode, etapes: data.etapes, composeeLe: Date.now() }
      try {
        localStorage.setItem(cle(mode), JSON.stringify(c))
      } catch {
        /* sans stockage, le sujet vit le temps de la page */
      }
      setComposition(c)
      setVue('sujet')
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setOccupe(false)
    }
  }

  // Pendant la saisie, chaque case cochée est gardée dans le navigateur, et
  // fermer l'onglet avec des réponses non enregistrées demande confirmation.
  const saisieEntamee =
    vue === 'saisie' && Object.values(reponses).some((l) => l.some((r) => r.lettre !== null))
  useEffect(() => {
    if (vue !== 'saisie' || !composition) return
    try {
      const b: Brouillon = { composeeLe: composition.composeeLe, reponses, minutes }
      localStorage.setItem(cleSaisie(mode), JSON.stringify(b))
    } catch {
      /* sans stockage, la saisie vit le temps de la page */
    }
  }, [composition, minutes, mode, reponses, vue])
  useEffect(() => {
    if (!saisieEntamee) return
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', retenir)
    return () => window.removeEventListener('beforeunload', retenir)
  }, [saisieEntamee])

  const ouvrirSaisie = () => {
    if (!composition) return
    const brouillon = lireBrouillon(mode, composition.composeeLe)
    if (brouillon) {
      setReponses(brouillon.reponses)
      setMinutes(brouillon.minutes)
      setVue('saisie')
      return
    }
    setReponses(
      Object.fromEntries(
        composition.etapes.map((e) => [e.section, e.items.map(() => ({ lettre: null, confiance: null }))]),
      ),
    )
    setMinutes(Object.fromEntries(composition.etapes.map((e) => [e.section, Math.round(e.secondes / 60)])))
    setVue('saisie')
  }

  const enregistrer = async () => {
    if (!composition) return
    setOccupe(true)
    setErreur('')
    try {
      const data = await poster<{ sessionId: number }>('/api/epreuve/papier', {
        action: 'enregistrer',
        mode,
        sousTests: composition.etapes.map((e) => ({
          section: e.section,
          itemIds: e.items.map((i) => i.id),
          reponses: reponses[e.section],
          minutes: minutes[e.section],
        })),
      })
      effacer(mode)
      router.push(`/tagemage/epreuve/${data.sessionId}`)
    } catch (e) {
      setErreur((e as Error).message)
      setOccupe(false)
    }
  }

  const abandonner = () => {
    effacer(mode)
    setComposition(null)
    setVue('accueil')
  }

  /* ------------------------------------------------------------ accueil -- */

  if (vue === 'accueil' || !composition) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
          ← TAGE MAGE
        </Link>
        <p className="mt-6 text-sm uppercase tracking-widest text-doux">{LIBELLE_MODE[mode]} sur papier</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Passer l’épreuve au crayon</h1>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-doux">
          <li>Compose le sujet : les questions sont tirées comme pour l’épreuve à l’écran.</li>
          <li>
            Imprime-le avec sa feuille de réponses. Note pour chaque question ta lettre et ta
            confiance (1 à 4), et le temps passé sur chaque sous-test.
          </li>
          <li>Reviens saisir la feuille : le bilan est le même qu’à l’écran.</li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-doux">
          Aucune séance n’est ouverte avant la saisie : tu peux imprimer aujourd’hui et composer
          demain. Le sujet reste gardé dans ce navigateur.
        </p>
        {erreur && <p className="mt-4 text-sm text-faux">{erreur}</p>}
        <button
          onClick={() => void composer()}
          disabled={occupe}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-fond hover:opacity-90 disabled:opacity-50"
        >
          {occupe ? 'Composition…' : 'Composer le sujet'}
        </button>
      </main>
    )
  }

  /* ------------------------------------------------------------ saisie -- */

  if (vue === 'saisie') {
    const manquantes = composition.etapes.reduce(
      (n, e) => n + (reponses[e.section]?.filter((r) => r.lettre === null).length ?? 0),
      0,
    )
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <button onClick={() => setVue('sujet')} className="text-sm text-doux hover:text-texte">
          ← Revenir au sujet
        </button>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Saisir la feuille de réponses</h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Une lettre par question (laisse « — » pour une case vide), la confiance si tu l’as notée, et
          le temps passé sur chaque sous-test. Une confiance laissée vide n’est pas inventée : la
          réponse compte pour le score, pas pour la calibration. Le temps, réparti également entre les
          questions, compte dans ton volume de travail mais dans aucune statistique de temps.
        </p>

        <div className="mt-6 space-y-6">
          {composition.etapes.map((e) => (
            <section key={e.section} className="rounded-xl border border-bord bg-carte px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-medium">
                  {e.numero}. {e.libelle}
                </h2>
                <label className="flex items-center gap-2 text-xs text-doux">
                  Minutes passées
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={minutes[e.section] ?? 0}
                    onChange={(ev) => setMinutes((m) => ({ ...m, [e.section]: Number(ev.target.value) }))}
                    className="chiffres w-16 rounded-md border border-bord bg-fond px-2 py-1 text-right text-sm text-texte"
                  />
                </label>
              </div>
              <ol className="mt-3 space-y-1.5">
                {e.items.map((it, i) => {
                  const r = reponses[e.section]?.[i] ?? { lettre: null, confiance: null }
                  const maj = (patch: Partial<Reponse>) =>
                    setReponses((tout) => ({
                      ...tout,
                      [e.section]: tout[e.section].map((x, j) => (j === i ? { ...x, ...patch } : x)),
                    }))
                  return (
                    <li key={it.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="chiffres w-6 text-doux">{i + 1}</span>
                      <span className="flex gap-1">
                        {[...LETTRES, null].map((l) => (
                          <button
                            key={l ?? 'vide'}
                            onClick={() => maj({ lettre: l })}
                            className={`h-7 w-7 rounded border text-xs ${
                              r.lettre === l ? 'border-accent bg-carte-clair text-accent' : 'border-bord text-doux'
                            }`}
                          >
                            {l ?? '—'}
                          </button>
                        ))}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-doux">
                        confiance
                        {[1, 2, 3, 4].map((c) => (
                          <button
                            key={c}
                            disabled={r.lettre === null}
                            // Un second clic efface : la confiance reste facultative.
                            onClick={() => maj({ confiance: r.confiance === c ? null : c })}
                            className={`h-6 w-6 rounded border disabled:opacity-30 ${
                              r.confiance === c && r.lettre !== null
                                ? 'border-accent text-accent'
                                : 'border-bord text-doux'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>

        {erreur && <p className="mt-4 text-sm text-faux">{erreur}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => void enregistrer()}
            disabled={occupe}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90 disabled:opacity-50"
          >
            {occupe ? 'Enregistrement…' : 'Enregistrer et voir le bilan'}
          </button>
          {manquantes > 0 && (
            <span className="text-xs text-blanc">
              {manquantes} case{manquantes > 1 ? 's' : ''} vide{manquantes > 1 ? 's' : ''} : elles
              seront comptées non traitées.
            </span>
          )}
        </div>
      </main>
    )
  }

  /* ------------------------------------------------------------- sujet -- */

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="sans-impression mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
          ← TAGE MAGE
        </Link>
        <div className="flex flex-wrap gap-3">
          <button onClick={abandonner} className="text-xs text-doux hover:text-texte">
            Abandonner ce sujet
          </button>
          <BoutonImprimer libelle="Imprimer le sujet" />
          <button
            onClick={ouvrirSaisie}
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
          >
            Saisir mes réponses →
          </button>
        </div>
      </div>

      <header className="mb-6 border-b border-bord pb-3">
        <h1 className="text-xl font-semibold">TAGE MAGE — {LIBELLE_MODE[mode]}</h1>
        <p className="text-xs text-doux">
          Composé le {jourLisible(composition.composeeLe, 'toujours')} ·{' '}
          {composition.etapes.reduce((n, e) => n + e.items.length, 0)} questions · une erreur ne coûte
          rien : ne laisse aucune case vide.
        </p>
      </header>

      {composition.etapes.map((e, k) => (
        <section key={e.section} className={k > 0 ? 'saut-avant mt-10' : ''}>
          <h2 className="mb-3 border-b border-bord pb-1 font-semibold">
            Sous-test {e.numero} — {e.libelle} · {e.items.length} questions ·{' '}
            {Math.round(e.secondes / 60)} minutes
          </h2>
          {e.items.map((it, i) => {
            const texteNouveau = it.contexteTexte && it.contexteTexte !== e.items[i - 1]?.contexteTexte
            const options = it.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : it.options
            return (
              <div key={it.id}>
                {texteNouveau && (
                  <div className="sans-coupure mb-4 whitespace-pre-line rounded border border-bord p-3 text-sm leading-relaxed">
                    {it.contexteTexte}
                  </div>
                )}
                <div className="sans-coupure mb-5">
                  <p className="text-sm font-semibold">Question {i + 1}</p>
                  <EnonceRappel enonce={it.enonce} figure={it.figure} imageHash={it.imageHash} />
                  {it.typeItem === 'conditions_minimales' && (
                    <div className="mt-1 text-sm">
                      <p>(1) {it.info1}</p>
                      <p>(2) {it.info2}</p>
                    </div>
                  )}
                  <ol className="mt-1 space-y-0.5 text-sm">
                    {options.map((o, j) => (
                      <li key={j}>
                        <span className="font-medium">{LETTRES[j]}.</span>{' '}
                        <Proposition texte={o} c={it.optionsFigure?.[j]} taille={44} />
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {/* Feuille de réponses : une page à part, à remplir au crayon. */}
      <section className="saut-avant mt-10">
        <h2 className="mb-3 border-b border-bord pb-1 font-semibold">Feuille de réponses</h2>
        <p className="mb-3 text-xs">
          Entoure une lettre par question et ta confiance : 1 au hasard · 2 hésitant · 3 assez sûr ·
          4 certain.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          {composition.etapes.map((e) => (
            <div key={e.section} className="sans-coupure">
              <p className="text-sm font-semibold">
                {e.numero}. {e.libelle}
              </p>
              <table className="mt-1 w-full text-xs">
                <tbody>
                  {e.items.map((it, i) => (
                    <tr key={it.id} className="border-b border-bord">
                      <td className="w-6 py-0.5">{i + 1}</td>
                      <td className="py-0.5 tracking-[0.35em]">A B C D E</td>
                      <td className="py-0.5 text-right tracking-[0.3em]">1 2 3 4</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-xs">Temps passé : ______ min</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
