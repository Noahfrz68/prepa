import { redirect } from 'next/navigation'

/**
 * Le plan est devenu unique et transversal au lot 7 : un seul budget, arbitré
 * entre les deux examens. On garde cette route pour ne pas casser les liens
 * existants.
 */
export default function PagePlanTageMage() {
  redirect('/plan')
}
