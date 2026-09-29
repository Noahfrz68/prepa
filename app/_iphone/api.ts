'use client'

import { signalerEcriture } from './version'

/**
 * L'API locale, version iPhone.
 *
 * Les composants appellent `fetch('/api/…')` comme sur le PC. Il n'y a pas de
 * serveur derrière GitHub Pages : on intercepte ces appels dans le navigateur
 * et on les confie aux MÊMES gestionnaires de route (app/api/…/route.ts), qui
 * ne manipulent que des Request et des Response standard et lisent la base
 * par `@/core/db/client` — ici sql.js.
 *
 * Seules les routes listées ici existent sur l'iPhone. Les autres dépendent
 * encore du disque ou de programmes du PC (import PDF et de textes, voix
 * Piper, images, audios, export, sauvegardes) et répondent 501 avec un
 * message lisible, en attendant leur version navigateur.
 */

type Module = Record<string, unknown>
type Gestionnaire = (r: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response> | Response

const ROUTES: Record<string, () => Promise<Module>> = {
  atelier: () => import('@/app/api/atelier/route'),
  carnet: () => import('@/app/api/carnet/route'),
  'drill/attempt': () => import('@/app/api/drill/attempt/route'),
  'drill/finish': () => import('@/app/api/drill/finish/route'),
  'drill/start': () => import('@/app/api/drill/start/route'),
  'epreuve/finish': () => import('@/app/api/epreuve/finish/route'),
  'epreuve/lot': () => import('@/app/api/epreuve/lot/route'),
  'epreuve/papier': () => import('@/app/api/epreuve/papier/route'),
  'epreuve/start': () => import('@/app/api/epreuve/start/route'),
  generer: () => import('@/app/api/generer/route'),
  // Sans clé d'API (le cas sur l'iPhone), le tuteur répond « aucun fournisseur ».
  'ia/debrief': () => import('@/app/api/ia/debrief/route'),
  import: () => import('@/app/api/import/route'),
  // Les séries Listening tournent ; leurs audios viennent du PC (synchronisation).
  'listening/import': () => import('@/app/api/listening/import/route'),
  'listening/lot': () => import('@/app/api/listening/lot/route'),
  'listening/start': () => import('@/app/api/listening/start/route'),
  objectif: () => import('@/app/api/objectif/route'),
  plan: () => import('@/app/api/plan/route'),
  profil: () => import('@/app/api/profil/route'),
  session: () => import('@/app/api/session/route'),
  'toeic/serie/lot': () => import('@/app/api/toeic/serie/lot/route'),
  'toeic/serie/start': () => import('@/app/api/toeic/serie/start/route'),
  'vocab/carte': () => import('@/app/api/vocab/carte/route'),
  'vocab/revision': () => import('@/app/api/vocab/revision/route'),
  'writing/notation': () => import('@/app/api/writing/notation/route'),
  'writing/production': () => import('@/app/api/writing/production/route'),
}

const CHEMIN_BASE = process.env.NEXT_PUBLIC_CHEMIN_BASE ?? ''

/** `/api/drill/start` ou `<base>/api/drill/start` → `drill/start` ; sinon null. */
export function routeDe(url: URL): string | null {
  if (url.origin !== window.location.origin) return null
  let chemin = url.pathname
  if (CHEMIN_BASE && chemin.startsWith(CHEMIN_BASE + '/')) chemin = chemin.slice(CHEMIN_BASE.length)
  if (!chemin.startsWith('/api/')) return null
  return chemin.slice('/api/'.length).replace(/\/+$/, '')
}

function json(statut: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } })
}

export async function servir(route: string, requete: Request): Promise<Response> {
  const charger = ROUTES[route]
  if (!charger) {
    return json(501, {
      erreur: 'Cette fonction n’est pas encore disponible sur iPhone : elle a besoin du PC (fichiers, voix ou images).',
    })
  }
  const gestionnaires = await charger()
  const gestionnaire = gestionnaires[requete.method] as Gestionnaire | undefined
  if (typeof gestionnaire !== 'function') return json(405, { erreur: `Méthode ${requete.method} non prise en charge.` })

  const reponse = await gestionnaire(requete, { params: Promise.resolve({}) })
  if (requete.method !== 'GET' && reponse.ok) signalerEcriture()
  return reponse
}

let installee = false

/** Remplace `window.fetch` : les appels à /api/… sont servis sur place, le reste passe. */
export function installerApi(): void {
  if (installee) return
  installee = true
  const fetchReseau = window.fetch.bind(window)

  window.fetch = async (entree: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(entree instanceof Request ? entree.url : String(entree), window.location.href)
    const route = routeDe(url)
    if (route === null) return fetchReseau(entree, init)
    const requete = entree instanceof Request ? new Request(entree, init) : new Request(url, init)
    try {
      return await servir(route, requete)
    } catch (e) {
      // Les routes rattrapent leurs propres erreurs ; ceci n'arrive que si le
      // module lui-même n'a pas pu se charger.
      console.error('[api locale]', route, e)
      return json(500, { erreur: 'Erreur interne de l’application.' })
    }
  }
}
