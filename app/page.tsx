import { MessageSquare, Users, BarChart3, Clock, CheckCircle, Shield } from "lucide-react"
import { ROUTES } from "@/lib/constants/routes"
import { ArrowRight } from "lucide-react"

const features = [
  {
    title: "Real-Time Support",
    description: "Connect with support agents instantly through our real-time messaging system",
    icon: MessageSquare,
  },
  {
    title: "Ticket Management",
    description: "Create and track support tickets with ease, get status updates in real-time",
    icon: CheckCircle,
  },
  {
    title: "Team Collaboration",
    description: "Work together efficiently with role-based access and team management",
    icon: Users,
  },
  {
    title: "Priority Handling",
    description: "Smart ticket prioritization ensures urgent issues get immediate attention",
    icon: Clock,
  },
  {
    title: "Performance Analytics",
    description: "Track response times and satisfaction rates with detailed analytics",
    icon: BarChart3,
  },
  {
    title: "Secure Platform",
    description: "Enterprise-grade security with role-based authentication",
    icon: Shield,
  },
]

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Welcome to AutoCRM
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Streamline your customer support with our intelligent ticket management and real-time messaging platform
              </p>
            </div>
            <div>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                href={ROUTES.auth.login}
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 px-4 md:px-6 items-center">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Features</h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                Everything you need to provide excellent customer support
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-start">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-2 rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to get started?</h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                Join thousands of businesses providing excellent customer support
              </p>
            </div>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              href={ROUTES.auth.signup}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </section>
    </main>
  )
} 