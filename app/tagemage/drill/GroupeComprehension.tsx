'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

export interface ItemGroupe {
  id: number
  enonce: string
  options: string[]
}

export interface ReponseGroupe {
  itemId: number
  reponse: string | null
  aSaute: boolean
  tempsMs: number
  confiance: number
  /** Temps de lecture du texte, porté par la première question seulement. */
  tempsPreparationMs: number | null
}

/**
 * Un texte et ses cinq questions, comme au TAGE MAGE officiel.
 *
 * Le sous-test 1 tient en trois textes de cinq questions. L'application servait
 * une question par texte : on relisait quinze passages au lieu de trois, et le
 * temps de lecture ne s'amortissait jamais. L'entraînement était plus lourd que
 * l'épreuve, et il ne mesurait pas la même chose.
 *
 * DEUX DÉCISIONS DE MESURE
 * ------------------------
 * 1. Le temps de LECTURE — de l'affichage au premier clic — est compté à part.
 *    Sans cela, la première question de chaque texte absorberait quatre-vingts
 *    secondes de lecture et passerait pour un puits de temps.
 * 2. Le temps d'une question court depuis la réponse précédente. On répond dans
 *    l'ordre qu'on veut : le temps échoit donc à la question qu'on vient de
 *    trancher, ce qui est exactement ce qu'on veut mesurer.
 */
/**
 * Temps écoulé depuis le dernier jalon, et pose du suivant. Hors du composant :
 * elle lit l'horloge, et ne doit être appelée que depuis un gestionnaire
 * d'événement, jamais pendant le rendu.
 */
function jalonnerDepuis(
  finLecture: { current: number | null },
  dernierJalon: { current: number },
): number {
  const t = Date.now()
  if (finLecture.current === null) finLecture.current = t
  const ecoule = t - dernierJalon.current
  dernierJalon.current = t
  return ecoule
}

export default function GroupeComprehension({
  texte,
  items,
  numero,
  total,
  onTermine,
}: {
  texte: string
  items: ItemGroupe[]
  numero: number
  total: number
  onTermine: (reponses: ReponseGroupe[]) => void
}) {
  type Etat = { reponse: string | null; confiance: number | null; aSaute: boolean; tempsMs: number }

  const [etats, setEtats] = useState<Record<number, Etat>>({})
  const [envoi, setEnvoi] = useState(false)

  const debut = useRef(0)
  const finLecture = useRef<number | null>(null)
  const dernierJalon = useRef(0)

  // Chaque texte repart à zéro : le parent remonte le composant à chaque
  // texte (key), l'horloge démarre donc à l'affichage du passage.
  useEffect(() => {
    debut.current = Date.now()
    dernierJalon.current = debut.current
  }, [])

  /**
   * Temps écoulé depuis le dernier jalon, et pose du suivant.
   *
   * La PREMIÈRE réponse d'un texte compte depuis l'affichage, lecture comprise.
   * L'exclure ferait disparaître du total les trente à soixante secondes de
   * lecture — le récapitulatif annoncerait une série de douze secondes là où
   * elle en a pris deux cents. `temps_preparation_ms` garde la part de lecture
   * à côté, pour qui veut la retrancher ; le total, lui, reste vrai.
   */
  const jalonner = () => jalonnerDepuis(finLecture, dernierJalon)

  const repondre = (itemId: number, lettre: string) => {
    // Changer d'avis avant de déclarer sa confiance ne consomme pas de temps
    // une seconde fois : on ne jalonne qu'au premier choix.
    // Le chronomètre se lit ICI, dans le gestionnaire du clic : dans la
    // fonction passée à setEtats, que React peut exécuter deux fois, il
    // jalonnait deux fois et le second appel ne comptait presque rien.
    const deja = etats[itemId]
    const tempsMs = deja?.reponse != null ? deja.tempsMs : jalonner()
    setEtats((e) => ({ ...e, [itemId]: { reponse: lettre, confiance: null, aSaute: false, tempsMs } }))
  }

  const declarerConfiance = (itemId: number, niveau: number) => {
    setEtats((e) => ({ ...e, [itemId]: { ...e[itemId], confiance: niveau } }))
  }

  const sauter = (itemId: number) => {
    const tempsMs = jalonner()
    setEtats((e) => ({ ...e, [itemId]: { reponse: null, confiance: 1, aSaute: true, tempsMs } }))
  }

  const reprendre = (itemId: number) => {
    setEtats((e) => {
      const copie = { ...e }
      delete copie[itemId]
      return copie
    })
  }

  const traitees = items.filter((i) => {
    const e = etats[i.id]
    return e && (e.aSaute || e.confiance !== null)
  }).length

  const valider = () => {
    if (envoi) return
    setEnvoi(true)
    const lecture = finLecture.current === null ? Date.now() - debut.current : finLecture.current - debut.current

    onTermine(
      items.map((it, rang) => {
        const e = etats[it.id]
        // Une proposition cochée compte, même si la confiance n'a pas été
        // déclarée : jeter une vraie réponse serait pire que la compter au
        // niveau le plus bas. Tout le reste est un saut — et c'est ainsi que
        // la question entre au carnet d'erreurs.
        const repondue = Boolean(e && !e.aSaute && e.reponse)
        return {
          itemId: it.id,
          reponse: repondue ? e.reponse : null,
          aSaute: !repondue,
          tempsMs: e?.tempsMs ?? 0,
          confiance: repondue ? (e.confiance ?? 1) : 1,
          tempsPreparationMs: rang === 0 ? lecture : null,
        }
      }),
    )
  }

  const motsDuTexte = useMemo(() => texte.trim().split(/\s+/).length, [texte])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 text-sm">
        <span className="chiffres text-doux">
          Texte {numero} / {total}
        </span>
        <span className="text-xs text-doux">
          {traitees} / {items.length} question{items.length > 1 ? 's' : ''} traitée
          {traitees > 1 ? 's' : ''} · {motsDuTexte} mots
        </span>
      </div>

      {/* Le texte d'abord, une seule fois, et les questions dessous : c'est la
          disposition de l'épreuve, et c'est elle qui fait que la lecture sert
          cinq fois au lieu d'une. */}
      <article className="whitespace-pre-line rounded-xl border border-bord bg-carte p-5 text-sm leading-relaxed">
        {texte}
      </article>

      <ol className="mt-6 space-y-4">
        {items.map((it, rang) => {
          const e = etats[it.id]
          const verrouille = Boolean(e && (e.aSaute || e.confiance !== null))

          return (
            <li
              key={it.id}
              className={`rounded-xl border bg-carte px-5 py-4 transition ${
                verrouille ? 'border-bord opacity-60' : 'border-bord'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-xs uppercase tracking-widest text-doux">
                  Question {rang + 1}
                </span>
                {verrouille && (
                  <button
                    onClick={() => reprendre(it.id)}
                    className="text-xs text-doux hover:text-texte"
                  >
                    {e.aSaute ? 'sautée' : `répondu ${e.reponse}`} · revenir dessus
                  </button>
                )}
              </div>

              <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{it.enonce}</p>

              {!verrouille && (
                <>
                  <ul className="mt-4 space-y-2">
                    {it.options.map((texteOption, i) => (
                      <li key={i}>
                        <button
                          onClick={() => repondre(it.id, LETTRES[i])}
                          className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                            e?.reponse === LETTRES[i]
                              ? 'border-accent bg-carte-clair'
                              : 'border-bord bg-fond hover:border-accent hover:bg-carte-clair'
                          }`}
                        >
                          <span className="font-medium text-doux">{LETTRES[i]}.</span>
                          <span className="flex-1">{texteOption}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {e?.reponse ? (
                    <div className="mt-4 border-t border-bord pt-3">
                      <p className="mb-2 text-xs uppercase tracking-widest text-doux">
                        À quel point es-tu sûr ?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Au hasard', 'Hésitant', 'Assez sûr', 'Certain'].map((libelle, i) => (
                          <button
                            key={libelle}
                            onClick={() => declarerConfiance(it.id, i + 1)}
                            className="rounded-lg border border-bord px-3 py-2 text-xs text-doux transition hover:border-accent hover:text-texte"
                          >
                            {libelle}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => sauter(it.id)}
                      className="mt-3 text-xs text-doux hover:text-texte"
                    >
                      Sauter cette question
                    </button>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={valider}
          disabled={envoi}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-50"
        >
          {numero < total ? 'Texte suivant' : 'Terminer la série'}
        </button>
        {traitees < items.length && (
          <span className="text-xs text-doux">
            {items.length - traitees} question{items.length - traitees > 1 ? 's' : ''} sans réponse —
            elle{items.length - traitees > 1 ? 's' : ''} ira{items.length - traitees > 1 ? 'ont' : ''}{' '}
            au carnet d’erreurs.
          </span>
        )}
      </div>
    </div>
  )
}
