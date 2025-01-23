'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { 
  type CreateCustomerTicketInput,
  type CreateAgentTicketInput,
  type CreateAdminTicketInput 
} from '@/lib/schemas/ticket'
import { cn } from '@/lib/utils'
import { createTicket } from '@/lib/api/tickets'
import { Button } from '@/components/ui/button'
import { PriorityIndicator } from '@/components/tickets/priority-indicator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type TicketFormValues = CreateCustomerTicketInput | CreateAgentTicketInput | CreateAdminTicketInput

interface SummaryStepProps {
  form: UseFormReturn<TicketFormValues>
}

export function SummaryStep({ form }: SummaryStepProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { watch, handleSubmit } = form
  const values = watch()

  const onSubmit = async (data: TicketFormValues) => {
    try {
      setIsSubmitting(true)
      await createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category_id: data.categoryId,
      })
      toast.success('Ticket created successfully')
      router.push('/tickets')
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Review Section */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium">{values.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap">{values.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{values.categoryId || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{values.departmentId || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {values.attachments?.length ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Attachments</h3>
            <div className="rounded-lg border p-4">
              <ul className="divide-y">
                {values.attachments.map((file) => (
                  <li key={file.url} className="py-2">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Priority & Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Priority & Details</h3>
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <div className="flex items-center gap-2">
                <PriorityIndicator priority={values.priority} showLabel />
              </div>
            </div>
            {values.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{format(values.dueDate, 'PPP')}</p>
              </div>
            )}
            {values.tags?.length ? (
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {values.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Ticket...
          </>
        ) : (
          'Create Ticket'
        )}
      </Button>
    </div>
  )
} 