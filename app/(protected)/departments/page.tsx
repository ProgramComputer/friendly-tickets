import { DepartmentList } from './_components/department-list'
import { RoleGate } from '@/components/auth/role-gate'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function DepartmentsPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Departments</h1>
            <p className="text-muted-foreground">
              Manage support departments and team assignments
            </p>
          </div>
          <Button asChild>
            <Link href="/departments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Link>
          </Button>
        </div>

        <DepartmentList />
      </div>
    </RoleGate>
  )
} 