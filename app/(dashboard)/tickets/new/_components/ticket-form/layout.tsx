'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  createCustomerTicketSchema,
  createAgentTicketSchema,
  createAdminTicketSchema,
  type CreateCustomerTicketInput,
  type CreateAgentTicketInput,
  type CreateAdminTicketInput,
} from '@/lib/schemas/ticket'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BasicInfoStep } from './steps/basic-info'
import { AttachmentsStep } from './steps/attachments'
import { PriorityStep } from './steps/priority'
import { SummaryStep } from './summary'
import { useAuth } from '@/lib/hooks/use-auth'

const steps = [
  { id: 'basic-info', title: 'Basic Information' },
  { id: 'attachments', title: 'Attachments' },
  { id: 'priority', title: 'Priority & Details' },
  { id: 'summary', title: 'Review & Submit' },
] as const

type StepId = (typeof steps)[number]['id']

const stepComponents: Record<StepId, React.ComponentType<{ form: any }>> = {
  'basic-info': BasicInfoStep,
  attachments: AttachmentsStep,
  priority: PriorityStep,
  summary: SummaryStep,
}

type UserRole = 'customer' | 'agent' | 'admin'
type TicketFormValues = CreateCustomerTicketInput | CreateAgentTicketInput | CreateAdminTicketInput

function getSchemaForRole(role: UserRole) {
  switch (role) {
    case 'admin':
      return createAdminTicketSchema
    case 'agent':
      return createAgentTicketSchema
    default:
      return createCustomerTicketSchema
  }
}

export function TicketFormLayout() {
  const [currentStep, setCurrentStep] = useState<StepId>('basic-info')
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100
  const { role } = useAuth()

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(getSchemaForRole(role as UserRole)),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      attachments: [],
    },
  })

  const { trigger } = form

  const goToNextStep = async () => {
    const fields = getFieldsForStep(currentStep)
    const isValid = await trigger(fields)

    if (isValid) {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id)
      }
    }
  }

  const goToPreviousStep = () => {
    const previousIndex = currentStepIndex - 1
    if (previousIndex >= 0) {
      setCurrentStep(steps[previousIndex].id)
    }
  }

  const getFieldsForStep = (step: StepId): (keyof TicketFormValues)[] => {
    switch (step) {
      case 'basic-info':
        return ['title', 'description', 'categoryId', 'departmentId']
      case 'attachments':
        return ['attachments']
      case 'priority':
        return ['priority', 'dueDate', 'tags']
      case 'summary':
        return []
      default:
        return []
    }
  }

  const CurrentStepComponent = stepComponents[currentStep]

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                'transition-colors',
                index <= currentStepIndex
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <CurrentStepComponent form={form} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
        >
          Previous
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={currentStepIndex === steps.length - 1}
        >
          {currentStepIndex === steps.length - 2 ? 'Review' : 'Next'}
        </Button>
      </div>
    </div>
  )
} 