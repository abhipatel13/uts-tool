"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { usePathname } from "next/navigation"
import { Providers } from "@/app/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
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
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}