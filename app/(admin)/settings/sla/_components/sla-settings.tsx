'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSLASettings, type SLAConfig } from '@/lib/hooks/settings/use-sla-settings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const slaConfigSchema = z.object({
  first_response_time: z.number().min(1, 'Must be at least 1 minute'),
  resolution_time: z.number().min(1, 'Must be at least 1 minute'),
  escalation_time: z.number().min(1, 'Must be at least 1 minute'),
})

type SLAConfigFormValues = z.infer<typeof slaConfigSchema>

interface SLAConfigCardProps {
  config: SLAConfig
  onSave: (values: SLAConfigFormValues) => Promise<void>
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive text-destructive-foreground'
    case 'high':
      return 'bg-orange-500 text-white'
    case 'medium':
      return 'bg-yellow-500 text-white'
    case 'low':
      return 'bg-green-500 text-white'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

function SLAConfigCard({ config, onSave }: SLAConfigCardProps) {
  const form = useForm<SLAConfigFormValues>({
    resolver: zodResolver(slaConfigSchema),
    defaultValues: {
      first_response_time: config.first_response_time,
      resolution_time: config.resolution_time,
      escalation_time: config.escalation_time,
    },
  })

  async function onSubmit(data: SLAConfigFormValues) {
    try {
      await onSave(data)
      toast.success('SLA configuration updated successfully')
    } catch (error) {
      console.error('Error updating SLA config:', error)
      toast.error('Failed to update SLA configuration')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="capitalize">{config.priority} Priority</CardTitle>
            <CardDescription>
              Configure SLA timings for {config.priority} priority tickets
            </CardDescription>
          </div>
          <Badge className={getPriorityColor(config.priority)}>
            {config.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_response_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Response Time</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Time in minutes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolution_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Time</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Time in minutes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="escalation_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escalation Time</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Time in minutes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export function SLASettings() {
  const { data: slaConfigs, isLoading, updateSLAConfig } = useSLASettings()

  if (isLoading) {
    return (
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[400px] animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {slaConfigs?.map(config => (
        <SLAConfigCard
          key={config.id}
          config={config}
          onSave={values => updateSLAConfig({ priority: config.priority, ...values })}
        />
      ))}
    </div>
  )
} 