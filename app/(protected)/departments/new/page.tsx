import { DepartmentForm } from '../_components/department-form'
import { RoleGate } from '@/components/auth/role-gate'

export default function NewDepartmentPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Create Department</h1>
          <p className="text-muted-foreground">
            Create a new support department and assign team members
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <DepartmentForm />
        </div>
      </div>
    </RoleGate>
  )
} 