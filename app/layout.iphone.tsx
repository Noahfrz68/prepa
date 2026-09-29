import type { ReactNode } from 'react'
import RootLayout from './layout'
import Base from './_iphone/Base'

export { metadata } from './layout'

/** Le layout du PC, avec la porte d'ouverture de la base autour des pages. */
export default function LayoutIphone({ children }: { children: ReactNode }) {
  return (
    <RootLayout>
      <Base>{children}</Base>
    </RootLayout>
  )
}
