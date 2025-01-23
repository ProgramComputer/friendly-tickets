'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useTemplates } from '@/lib/hooks/templates/use-templates'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  content: z.string().min(1, 'Template content is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface TemplateFormProps {
  template?: {
    id: string
    name: string
    content: string
    category?: string
    tags?: string[]
  }
}

const categories = [
  'General',
  'Technical Support',
  'Billing',
  'Account',
  'Product',
  'Feature Request',
  'Bug Report',
]

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter()
  const { createTemplate, updateTemplate } = useTemplates()

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      content: template?.content || '',
      category: template?.category || '',
      tags: template?.tags || [],
    },
  })

  async function onSubmit(data: TemplateFormValues) {
    try {
      if (template) {
        await updateTemplate({ id: template.id, ...data })
        toast.success('Template updated successfully')
      } else {
        await createTemplate(data)
        toast.success('Template created successfully')
      }
      router.push('/templates')
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
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
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter template name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this response template
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Categorize this template for better organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter template content..."
                  className="min-h-[200px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The content of your response template. You can use variables like
                {' {customer_name}, {ticket_id}, {agent_name}'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/templates')}
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
                {template ? 'Updating...' : 'Creating...'}
              </>
            ) : template ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 