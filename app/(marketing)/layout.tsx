import { ThemeToggle } from "@/components/theme-toggle"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to AutoCRM',
  description: 'Streamline your customer support with our intelligent ticket management and real-time messaging platform.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-end px-4">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </>
  )
} 