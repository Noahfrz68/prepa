'use client'

import Page from '../[id]/page'
import { pageIphone } from '@/app/_iphone/pages'

/** Le bilan d'une série Reading : `/toeic/reading/12` sur le PC, `…/bilan?id=12` ici. */
export default pageIphone(Page, { params: (r) => ({ id: r.get('id') ?? '' }) })
