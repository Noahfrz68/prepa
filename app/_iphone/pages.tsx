'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useVersionDonnees } from './version'

/**
 * Fait tourner une page du PC dans le navigateur.
 *
 * Les pages du PC sont des composants serveur, mais d'un genre simple : elles
 * lisent la base de façon synchrone et rendent du JSX, sans rien qui exige un
 * serveur. Une fois la base ouverte (Base.tsx), on peut donc les exécuter
 * telles quelles côté client. Il reste trois différences à combler :
 *
 *   — les paramètres : le serveur leur passe `searchParams` et `params` en
 *     promesses ; on les construit ici depuis l'adresse ;
 *   — les pages asynchrones (celles qui attendent ces promesses) : React ne
 *     sait pas rendre un composant asynchrone côté client, on attend donc leur
 *     résultat avant de l'afficher ;
 *   — le rafraîchissement : la page se recalcule à chaque écriture (version.ts),
 *     comme le serveur la recalcule après un `router.refresh()`.
 */

type Props = {
  searchParams: Promise<Record<string, string>>
  params: Promise<Record<string, string>>
}
// Chaque page déclare ses propres props ; seule la forme ci-dessus est fournie.
// Une page qui ne fait que rediriger (redirect()) ne rend rien : `void`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PagePc = (props: any) => ReactNode | void | Promise<ReactNode | void>

interface Options {
  /**
   * Paramètres de chemin, lus dans l'adresse. Le site statique ne connaît pas
   * les identifiants à l'avance : `/tagemage/epreuve/12` y devient
   * `/tagemage/epreuve/bilan?id=12` (voir app/_composants/liens.ts).
   */
  params?: (recherche: URLSearchParams) => Record<string, string>
}

export function pageIphone(Page: PagePc, options: Options = {}) {
  function PageIphone() {
    return (
      <Suspense fallback={null}>
        <Rendu Page={Page} options={options} />
      </Suspense>
    )
  }
  PageIphone.displayName = `Iphone(${Page.name || 'Page'})`
  return PageIphone
}

function Rendu({ Page, options }: { Page: PagePc; options: Options }) {
  const version = useVersionDonnees()
  const recherche = useSearchParams()
  const searchParams = Object.fromEntries(recherche.entries())
  const params = options.params?.(recherche) ?? {}
  const cle = JSON.stringify([searchParams, params])

  // La page appelée comme une fonction : c'est un composant serveur, sans
  // hooks, donc sans règle d'appel à respecter. Elle relit la base à chaque
  // rendu — à chaque nouvelle version des données.
  const resultat = Page({ searchParams: Promise.resolve(searchParams), params: Promise.resolve(params) } satisfies Props)

  if (!(resultat instanceof Promise)) return <>{resultat as ReactNode}</>
  // Rendue à chaque rendu, la promesse n'est suivie que si sa clé est
  // nouvelle : les autres ne doivent pas lever d'erreur non rattrapée.
  resultat.catch(() => {})
  return <Attente promesse={resultat as Promise<ReactNode>} cle={`${cle}#${version}`} />
}

/**
 * Affiche le résultat d'une page asynchrone. Pendant qu'une nouvelle version
 * se calcule, l'ancienne reste affichée — sauf si l'adresse a changé.
 */
function Attente({ promesse, cle }: { promesse: Promise<ReactNode>; cle: string }) {
  const [rendu, setRendu] = useState<{ cle: string; noeud: ReactNode } | null>(null)
  const [erreur, setErreur] = useState<unknown>(null)

  useEffect(() => {
    let actif = true
    promesse.then(
      (noeud) => actif && setRendu({ cle, noeud }),
      (e: unknown) => actif && setErreur(() => e),
    )
    return () => {
      actif = false
    }
    // `promesse` change à chaque rendu ; seule la clé dit si elle est nouvelle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle])

  // notFound(), redirect() et les vraies erreurs remontent aux frontières de
  // Next, comme si la page les avait levées pendant son rendu.
  if (erreur) throw erreur
  if (!rendu) return null
  const memeAdresse = rendu.cle.split('#')[0] === cle.split('#')[0]
  return memeAdresse ? <>{rendu.noeud}</> : null
}

/** Même chose pour un layout : il se recalcule avec les données. */
export function layoutIphone(Layout: (props: { children: ReactNode }) => ReactNode) {
  function LayoutIphone({ children }: { children: ReactNode }) {
    useVersionDonnees()
    return <>{Layout({ children })}</>
  }
  LayoutIphone.displayName = `Iphone(${Layout.name || 'Layout'})`
  return LayoutIphone
}
