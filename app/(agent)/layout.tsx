import { AuthCheck } from "@/components/auth/auth-check"
import { AgentHeader } from "@/components/agent/agent-header"

interface AgentLayoutProps {
  children: React.ReactNode
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <AuthCheck requiredRole="agent">
      <div className="min-h-screen flex flex-col">
        <AgentHeader />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
} 