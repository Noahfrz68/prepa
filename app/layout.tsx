import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prépa — TAGE MAGE & TOEIC',
  description: "Instrument de mesure et coach de stratégie de score.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-fond text-texte antialiased">{children}</body>
    </html>
  )
}
