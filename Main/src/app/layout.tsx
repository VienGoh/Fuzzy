import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './(protected)/providers' // <-- Tambahkan ini

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fuzzy System',
  description: 'Fuzzy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* WRAP dengan Providers */}
          {children}
        </Providers>
      </body>
    </html>
  )
}