/**
 * Appels au serveur local, avec reprise.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Les écrans appelaient `fetch` directement, dans un `try { … } finally`, sans
 * `catch` et sans vérifier le statut. Deux conséquences, toutes deux
 * rencontrées pour de bon :
 *
 *   — serveur injoignable une seconde → `TypeError: Failed to fetch` remonte
 *     brute, l'écran d'erreur de Next.js s'affiche, et la série en cours est
 *     perdue ;
 *   — serveur qui répond 500 → la réponse est considérée comme enregistrée
 *     alors qu'elle ne l'est pas. Silencieux, donc pire.
 *
 * Le serveur tourne en local : une coupure est presque toujours passagère —
 * rechargement à chaud, redémarrage, machine en veille. Réessayer deux fois
 * suffit à absorber la quasi-totalité des cas, et ce qui reste doit être dit à
 * l'utilisateur, pas avalé.
 */

/** Erreur d'appel, avec un message destiné à être affiché tel quel. */
export class ErreurReseau extends Error {
  readonly statut: number | null
  constructor(message: string, statut: number | null = null) {
    super(message)
    this.name = 'ErreurReseau'
    this.statut = statut
  }
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface OptionsPoster {
  /** Tentatives au total, la première comprise. */
  essais?: number
  /** Attente avant la première reprise ; doublée à chaque fois. */
  attenteMs?: number
}

/**
 * POST JSON, avec reprise sur panne réseau et sur erreur serveur.
 *
 * Une erreur 4xx n'est PAS reprise : elle vient d'une requête mal formée, la
 * rejouer donnerait le même résultat en masquant le défaut.
 */
export async function poster<T = unknown>(
  url: string,
  corps: unknown,
  { essais = 3, attenteMs = 400 }: OptionsPoster = {},
): Promise<T> {
  let derniere: ErreurReseau | null = null

  for (let essai = 1; essai <= essais; essai++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      })

      if (r.ok) return (await r.json()) as T

      let detail = ''
      try {
        detail = ((await r.json()) as { erreur?: string }).erreur ?? ''
      } catch {
        /* réponse non JSON : le statut suffira */
      }

      if (r.status >= 400 && r.status < 500) {
        throw new ErreurReseau(detail || `Requête refusée (${r.status}).`, r.status)
      }

      derniere = new ErreurReseau(
        detail || `Le serveur a répondu ${r.status}.`,
        r.status,
      )
    } catch (e) {
      // Une 4xx est définitive : on ne la rejoue pas.
      if (e instanceof ErreurReseau && e.statut !== null && e.statut < 500) throw e
      derniere =
        e instanceof ErreurReseau
          ? e
          : new ErreurReseau(
              'Le serveur ne répond pas. Vérifie qu’il tourne toujours dans ton terminal.',
            )
    }

    if (essai < essais) await attendre(attenteMs * essai)
  }

  throw derniere ?? new ErreurReseau('Appel impossible.')
}

/** GET JSON, mêmes règles de reprise. */
export async function lire<T = unknown>(url: string, opts: OptionsPoster = {}): Promise<T> {
  const { essais = 3, attenteMs = 400 } = opts
  let derniere: ErreurReseau | null = null

  for (let essai = 1; essai <= essais; essai++) {
    try {
      const r = await fetch(url)
      if (r.ok) return (await r.json()) as T
      if (r.status >= 400 && r.status < 500) {
        throw new ErreurReseau(`Requête refusée (${r.status}).`, r.status)
      }
      derniere = new ErreurReseau(`Le serveur a répondu ${r.status}.`, r.status)
    } catch (e) {
      if (e instanceof ErreurReseau && e.statut !== null && e.statut < 500) throw e
      derniere =
        e instanceof ErreurReseau
          ? e
          : new ErreurReseau(
              'Le serveur ne répond pas. Vérifie qu’il tourne toujours dans ton terminal.',
            )
    }
    if (essai < essais) await attendre(attenteMs * essai)
  }

  throw derniere ?? new ErreurReseau('Appel impossible.')
}
