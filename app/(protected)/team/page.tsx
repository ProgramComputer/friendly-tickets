import { TeamMemberList } from './_components/team-member-list'
import { RoleGate } from '@/components/auth/role-gate'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function TeamPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Team Members</h1>
            <p className="text-muted-foreground">
              Manage support team members and their roles
            </p>
          </div>
          <Button asChild>
            <Link href="/team/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Link>
          </Button>
        </div>

        <TeamMemberList />
      </div>
    </RoleGate>
  )
} 