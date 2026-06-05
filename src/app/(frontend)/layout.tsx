import React from 'react'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import '@/styles/globals.css'

const serif = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  description: 'Maravo Clinic — Estetică medicală și dermatologie.',
  title: 'Maravo Clinic',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ro" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div>{children}</div>
      </body>
    </html>
  )
}
