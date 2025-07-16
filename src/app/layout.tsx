"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { usePathname } from "next/navigation"
import { Providers } from "@/app/providers"
import { Toaster } from "@/components/ui/toaster"
import { StripeProvider } from '@/providers/StripeProvider'
import GlobalLicenseProtection from '@/components/GlobalLicenseProtection'

const inter = Inter({ subsets: ["latin"] })

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <>
      {isAuthPage ? (
        <div className="h-screen">
          {children}
        </div>
      ) : (
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StripeProvider>
          <Providers>
            <GlobalLicenseProtection>
              <RootLayoutContent>
                {children}
              </RootLayoutContent>
            </GlobalLicenseProtection>
          </Providers>
        </StripeProvider>
        <Toaster />
      </body>
    </html>
  )
}