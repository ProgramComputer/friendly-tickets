'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useDepartments } from '@/lib/hooks/departments/use-departments'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

interface DepartmentFormProps {
  department?: {
    id: string
    name: string
    description?: string
    tags?: string[]
  }
}

export function DepartmentForm({ department }: DepartmentFormProps) {
  const router = useRouter()
  const { createDepartment, updateDepartment } = useDepartments()

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name || '',
      description: department?.description || '',
      tags: department?.tags || [],
    },
  })

  async function onSubmit(data: DepartmentFormValues) {
    try {
      if (department) {
        await updateDepartment({ id: department.id, ...data })
        toast.success('Department updated successfully')
      } else {
        await createDepartment(data)
        toast.success('Department created successfully')
      }
      router.push('/departments')
    } catch (error) {
      console.error('Error saving department:', error)
      toast.error('Failed to save department')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter department name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this department
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter department description..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of this department's responsibilities
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/departments')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {department ? 'Updating...' : 'Creating...'}
              </>
            ) : department ? (
              'Update Department'
            ) : (
              'Create Department'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 