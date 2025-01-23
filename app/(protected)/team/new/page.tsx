import { TeamMemberForm } from '../_components/team-member-form'
import { RoleGate } from '@/components/auth/role-gate'

export default function NewTeamMemberPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Add Team Member</h1>
          <p className="text-muted-foreground">
            Add a new support team member and assign their role
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <TeamMemberForm />
        </div>
      </div>
    </RoleGate>
  )
} 