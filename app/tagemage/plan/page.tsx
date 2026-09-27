import { redirect } from 'next/navigation'

/**
 * Le plan de la semaine vit sur /plan. On garde cette route pour ne pas casser
 * les liens existants.
 */
export default function PagePlanTageMage() {
  redirect('/plan')
}
