'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { type CreateTicketInput } from '@/lib/schemas/ticket'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface AttachmentsStepProps {
  form: UseFormReturn<CreateTicketInput>
}

export function AttachmentsStep({ form }: AttachmentsStepProps) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form

  const attachments = watch('attachments') || []
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const newAttachments = await Promise.all(
      acceptedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `ticket-attachments/${fileName}`

        const { data, error } = await supabase.storage
          .from('tickets')
          .upload(filePath, file)

        if (error) {
          console.error('Upload error:', error)
          return null
        }

        const { data: { publicUrl } } = supabase.storage
          .from('tickets')
          .getPublicUrl(filePath)

        return {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        }
      })
    )

    const validAttachments = newAttachments.filter(Boolean)
    setValue('attachments', [...attachments, ...validAttachments], {
      shouldValidate: true,
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  })

  const handleRemoveFile = async (index: number) => {
    const file = attachments[index]
    if (file?.url) {
      const filePath = file.url.split('/').pop()
      if (filePath) {
        await supabase.storage
          .from('tickets')
          .remove([`ticket-attachments/${filePath}`])
      }
    }

    setValue(
      'attachments',
      attachments.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center',
          'hover:border-primary/50 transition-colors',
          isDragActive && 'border-primary bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 10MB. Supported formats: Images, PDF, DOC, DOCX
          </p>
        </div>
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Uploaded Files</h3>
          <div className="divide-y rounded-lg border">
            {attachments.map((file, index) => (
              <div
                key={file.url}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.attachments && (
        <p className="text-sm text-destructive">{errors.attachments.message}</p>
      )}
    </div>
  )
} 