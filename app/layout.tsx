import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { AppProviders } from '@/components/providers/app-providers'
import { Toaster } from '@/components/ui/toaster'
import SupabaseProvider from '@/lib/providers/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'AutoCRM',
    template: '%s | AutoCRM',
  },
  description: 'Making customer support better for everyone.',
  keywords: ['CRM', 'Customer Support', 'Ticket Management', 'Help Desk'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
      >
        <SupabaseProvider>
          <AppProviders>
            {children}
          </AppProviders>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
} 