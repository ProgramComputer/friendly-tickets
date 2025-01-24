'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriorityIndicator } from '@/components/shared/priority-indicator'
import { toast } from 'sonner'

interface SummaryStepProps {
  register: any
  setValue: any
  watch: any
  errors: any
  onSubmit: (data: any) => Promise<void>
}

export function SummaryStep({
  register,
  setValue,
  watch,
  errors,
  onSubmit,
}: SummaryStepProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const values = watch()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await onSubmit(values)
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
        {values.attachments?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Attachments</h3>
            <div className="rounded-lg border p-4">
              <ul className="divide-y">
                {values.attachments.map((file: any) => (
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
        )}

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
            {values.tags?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {values.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
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