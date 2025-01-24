'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const baseStyles = {
  input: {
    error: 'border-destructive focus-visible:ring-destructive',
  },
}

interface BasicInfoStepProps {
  register: any
  setValue: any
  watch: any
  errors: any
  role?: 'customer' | 'agent' | 'admin'
}

export function BasicInfoStep({
  register,
  setValue,
  watch,
  errors,
  role = 'customer',
}: BasicInfoStepProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: watch('description') || '',
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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