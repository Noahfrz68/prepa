import { SECTIONS } from '@/exams/tagemage'
import Fiche from './page'

/**
 * La fiche ne lit pas la base : ses sept versions, une par sous-test, sont
 * rendues au build, comme n'importe quelle page statique.
 */
export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }))
}

export const dynamicParams = false

export default Fiche
