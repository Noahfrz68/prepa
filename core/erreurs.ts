/**
 * Une erreur que l'utilisateur doit lire telle quelle, et qu'il ne sert à rien
 * de rejouer : question introuvable, séance close, banque vide.
 *
 * Tout le reste — une base occupée, une contrainte violée, un bug — est une
 * erreur du serveur. La distinction compte côté navigateur : `poster()`
 * reprend automatiquement une erreur serveur (5xx), jamais une erreur de
 * requête (4xx). Quand toutes les erreurs répondaient 400, la reprise ne se
 * déclenchait jamais, et le message brut de SQLite s'affichait à l'écran.
 */
export class ErreurRequete extends Error {
  readonly statut: number

  constructor(message: string, statut = 400) {
    super(message)
    this.name = 'ErreurRequete'
    this.statut = statut
  }
}
