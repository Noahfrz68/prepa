/**
 * Les dates telles qu'on les lit : « 26 septembre », « 3 mars 2025 à 14 h 05 ».
 *
 * Deux formats arrivent de la base :
 *   — « AAAA-MM-JJ », un jour sans heure (date d'examen, lundi d'un plan) : lu
 *     à midi local, pour qu'aucun décalage horaire ne le fasse changer de jour ;
 *   — « AAAA-MM-JJ HH:MM:SS », écrit par SQLite en UTC sans le dire : lu comme
 *     tel, puis affiché à l'heure locale — une séance passée à 1 h du matin
 *     reste de ce jour-là.
 * L'année n'est écrite que hors de l'année en cours.
 */
function lire(valeur: string | number | Date): Date | null {
  if (valeur instanceof Date) return valeur
  if (typeof valeur === 'number') return new Date(valeur)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(valeur)
    ? new Date(`${valeur}T12:00:00`)
    : new Date(`${valeur.replace(' ', 'T')}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(valeur) ? '' : 'Z'}`)
  return Number.isNaN(d.getTime()) ? null : d
}

function options(d: Date, annee: 'auto' | 'toujours'): Intl.DateTimeFormatOptions {
  return {
    day: 'numeric',
    month: 'long',
    ...(annee === 'toujours' || d.getFullYear() !== new Date().getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  }
}

export function jourLisible(
  valeur: string | number | Date,
  annee: 'auto' | 'toujours' = 'auto',
): string {
  const d = lire(valeur)
  if (!d) return String(valeur).slice(0, 10)
  return d.toLocaleDateString('fr-FR', options(d, annee))
}

export function momentLisible(valeur: string | number | Date): string {
  const d = lire(valeur)
  if (!d) return String(valeur)
  const heure = `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.toLocaleDateString('fr-FR', options(d, 'auto'))} à ${heure}`
}
