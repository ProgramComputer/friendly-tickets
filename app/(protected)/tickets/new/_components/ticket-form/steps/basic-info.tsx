'use client'

import { useEffect } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { 
  type CreateCustomerTicketInput,
  type CreateAgentTicketInput,
  type CreateAdminTicketInput 
} from '@/lib/schemas/ticket'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { baseStyles } from '@/lib/constants/ui'
import { useAuth } from '@/lib/hooks/use-auth'

type TicketFormValues = CreateCustomerTicketInput | CreateAgentTicketInput | CreateAdminTicketInput

interface BasicInfoStepProps {
  form: UseFormReturn<TicketFormValues>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form
  const { role } = useAuth()

  // TipTap editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: watch('description') || '',
    editorProps: {
      attributes: {
        class: cn(
          baseStyles.input.base,
          'min-h-[200px] prose prose-sm max-w-none',
          errors.description && baseStyles.input.error
        ),
      },
    },
    onUpdate: ({ editor }) => {
      setValue('description', editor.getText(), {
        shouldValidate: true,
      })
    },
  })

  // Sync editor content with form
  useEffect(() => {
    const description = watch('description')
    if (editor && description !== editor.getText()) {
      editor.commands.setContent(description)
    }
  }, [editor, watch])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter a clear title for your ticket"
          {...register('title')}
          className={cn(errors.title && baseStyles.input.error)}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <EditorContent editor={editor} />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            onValueChange={(value) => setValue('categoryId', value)}
            value={watch('categoryId')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Technical Issue</SelectItem>
              <SelectItem value="2">Account Access</SelectItem>
              <SelectItem value="3">Billing</SelectItem>
              <SelectItem value="4">Feature Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(role === 'agent' || role === 'admin') && (
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              onValueChange={(value) => setValue('departmentId', value)}
              value={watch('departmentId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Customer Support</SelectItem>
                <SelectItem value="2">Technical Support</SelectItem>
                <SelectItem value="3">Billing Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
} 