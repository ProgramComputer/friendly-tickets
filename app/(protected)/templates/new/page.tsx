import { TemplateForm } from '../_components/template-form'
import { RoleGate } from '@/components/auth/role-gate'

export default function NewTemplatePage() {
  return (
    <RoleGate allowedRoles={['agent', 'admin']}>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Create Template</h1>
          <p className="text-muted-foreground">
            Create a new response template for quick replies
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <TemplateForm />
        </div>
      </div>
    </RoleGate>
  )
} 