'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { createTicket } from '@/lib/hooks/tickets/use-tickets'
import { BasicInfoStep } from './_components/ticket-form/steps/basic-info'
import { PriorityStep } from './_components/ticket-form/steps/priority'
import { AttachmentsStep } from './_components/ticket-form/steps/attachments'
import { SummaryStep } from './_components/ticket-form/summary'
import { ROUTES } from "@/lib/constants/routes"

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().min(1, 'Category is required'),
  departmentId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    url: z.string()
  })).optional()
})

type TicketFormData = z.infer<typeof ticketSchema>

const STEPS = [
  { id: 'basic-info', title: 'Basic Information' },
  { id: 'priority', title: 'Priority & Tags' },
  { id: 'attachments', title: 'Attachments' },
  { id: 'summary', title: 'Review & Submit' }
] as const

export default function NewTicketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const { user } = useAuth()

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      tags: [],
      attachments: []
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form

  const onSubmit = async (data: TicketFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a ticket',
        variant: 'destructive'
      })
      return
    }

    try {
      const ticket = await createTicket({
        ...data,
        auth_user_id: user.id,
        status: 'open'
      })
      toast({
        title: 'Success',
        description: 'Ticket created successfully'
      })
      router.push(`${ROUTES.dashboard.tickets}/${ticket.id}`)
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new support ticket
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  index <= currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 hidden sm:inline">{step.title}</span>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <form className="space-y-8">
          {currentStep === 0 && (
            <BasicInfoStep
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
          )}

          {currentStep === 1 && (
            <PriorityStep
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <AttachmentsStep
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <SummaryStep
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              onSubmit={onSubmit}
            />
          )}

          <div className="flex justify-between">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                Previous
              </Button>
            )}
            {currentStep < STEPS.length - 1 && (
              <Button
                type="button"
                onClick={nextStep}
                className="ml-auto"
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
} 