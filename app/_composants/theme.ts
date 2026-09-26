/** Thème d'affichage : suivre le système, ou forcer clair ou sombre. */
export type Theme = 'systeme' | 'clair' | 'sombre'

export const CLE_THEME = 'prepa.theme'

/**
 * Posé dans <head> et exécuté avant le premier affichage : sans lui, une
 * page choisie en clair s'afficherait un instant en sombre à chaque
 * chargement. Le stockage peut être indisponible : on suit alors le système.
 */
export const SCRIPT_THEME = `try{var t=localStorage.getItem('${CLE_THEME}');if(t==='clair'||t==='sombre')document.documentElement.dataset.theme=t}catch(e){}`

export function appliquerTheme(t: Theme) {
  const racine = document.documentElement
  if (t === 'systeme') delete racine.dataset.theme
  else racine.dataset.theme = t
  try {
    if (t === 'systeme') localStorage.removeItem(CLE_THEME)
    else localStorage.setItem(CLE_THEME, t)
  } catch {
    /* sans stockage, le choix vaut pour cette page */
  }
}

export function themeEnregistre(): Theme {
  try {
    const t = localStorage.getItem(CLE_THEME)
    return t === 'clair' || t === 'sombre' ? t : 'systeme'
  } catch {
    return 'systeme'
  }
}
