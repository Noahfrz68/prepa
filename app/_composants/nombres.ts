/**
 * Nombres et durées à la française, partout pareil.
 *
 * Chaque page avait son petit formateur : « 9 h59 » ici, « 43.2 points » ou
 * « ×1.3 » là (le `toFixed` de JavaScript écrit un point décimal). Un seul
 * endroit, une seule typographie : virgule décimale, espace entre l'heure et
 * les minutes.
 */

/** « 43,2 », « 1 250 », « 0,8 » : virgule décimale, espace insécable fine pour les milliers. */
export function decimal(x: number, chiffres = 1): string {
  return x.toLocaleString('fr-FR', { maximumFractionDigits: chiffres, minimumFractionDigits: 0 })
}

/** « 45 min », « 2 h », « 9 h 59 » — à partir d'une durée en minutes. */
export function duree(minutes: number): string {
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}
