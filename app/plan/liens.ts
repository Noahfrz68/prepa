import type { TacheEnregistree } from '@/core/db/semaine'

/**
 * Où mène une tâche du plan. Partagé par la page du plan et par l'accueil :
 * deux calculs séparés avaient fini par proposer deux séances différentes.
 */
export function lienTache(t: Pick<TacheEnregistree, 'type' | 'section' | 'skillIds'>): string {
  switch (t.type) {
    case 'cours':
      return `/tagemage/cours#${t.skillIds[0] ?? ''}`
    case 'entrainement':
      return (
        `/tagemage/drill?section=${t.section}&taille=15` +
        (t.skillIds.length > 0 ? `&skills=${t.skillIds.join(',')}` : '')
      )
    case 'diagnostic':
      return '/tagemage/epreuve?mode=diagnostic'
    case 'blanc':
      return '/tagemage/epreuve?mode=blanc'
  }
}
