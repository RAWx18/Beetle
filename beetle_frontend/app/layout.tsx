import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { RepositoryProvider } from "@/contexts/RepositoryContext"
import { BranchProvider } from "@/contexts/BranchContext"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beetle",
  description: "AI-powered GitHub contribution manager with structured planning and branch-aware workflows",
    generator: 'RAWx18',
  icons: {
    icon: '/favicon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RepositoryProvider>
              <BranchProvider>
                {children}
              </BranchProvider>
            </RepositoryProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && (
          <script src="/debug-auth.js" />
        )}
      </body>
    </html>
  )
}
