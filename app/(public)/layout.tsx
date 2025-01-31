import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | AutoCRM',
    default: 'AutoCRM',
  },
  description: 'Learn more about AutoCRM and how we can help improve your customer support experience.',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="text-xl font-bold">
            AutoCRM
          </Link>
          <nav className="ml-6 flex items-center space-x-4">
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </>
  )
} 