import { TemplateList } from './_components/template-list'
import { RoleGate } from '@/components/auth/role-gate'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function TemplatesPage() {
  return (
    <RoleGate allowedRoles={['agent', 'admin']}>
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Response Templates</h1>
            <p className="text-muted-foreground">
              Manage your response templates for quick replies
            </p>
          </div>
          <Button asChild>
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>

        <TemplateList />
      </div>
    </RoleGate>
  )
} 