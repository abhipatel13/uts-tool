import { UniversalHeader } from "@/components/layout/universal-header"

export default function UniversalPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader />
      <main>
        {children}
      </main>
    </div>
  )
} 