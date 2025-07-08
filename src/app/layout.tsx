import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import clsx from 'clsx'

import { Providers } from '@/app/providers'
import { DropdownMenu } from '@/components/DropdownMenu'

import '@/styles/tailwind.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Beetle Documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx('h-full antialiased mona-sans-regular', inter.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white dark:bg-gray-950">
        {/* Top left floating dropdown menu */}
        <div className="fixed top-4 left-4 z-50">
          <DropdownMenu />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
