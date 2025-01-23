import { QueueManagement } from './_components/queue-management'
import { RoleGate } from '@/components/auth/role-gate'

export default function QueuePage() {
  return (
    <RoleGate allowedRoles={['agent', 'admin']}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Queue Management</h1>
          <p className="text-muted-foreground">
            Manage and assign tickets in your support queue
          </p>
        </div>

        <QueueManagement />
      </div>
    </RoleGate>
  )
} 