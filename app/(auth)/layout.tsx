import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | AutoCRM',
    default: 'Authentication',
  },
  description: 'Securely access your AutoCRM account.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-4">
        {children}
      </div>
    </main>
  )
} 