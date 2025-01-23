import { SLASettings } from './_components/sla-settings'
import { RoleGate } from '@/components/auth/role-gate'

export default function SLASettingsPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">SLA Configuration</h1>
          <p className="text-muted-foreground">
            Configure Service Level Agreement settings for different priorities
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <SLASettings />
        </div>
      </div>
    </RoleGate>
  )
} 