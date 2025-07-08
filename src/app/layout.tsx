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
  title: 'Commit - Open-source Git client for macOS minimalists',
  description:
    "Commit is a lightweight Git client you can open from anywhere any time you're ready to commit your work with a single keyboard shortcut. It's fast, beautiful, and completely unnecessary.",
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
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
