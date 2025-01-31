'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, File, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Database } from '@/types/global/supabase'

interface AttachmentsStepProps {
  register: any
  setValue: any
  watch: any
  errors: any
}

interface FileWithPreview extends File {
  preview?: string
}

interface UploadedFile {
  name: string
  size: number
  url: string
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function AttachmentsStep({
  register,
  setValue,
  watch,
  errors,
}: AttachmentsStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const attachments = watch('attachments') || []

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true)
      setUploadProgress(0)

      for (const file of acceptedFiles) {
        try {
          const fileName = `${Date.now()}-${file.name}`
          const filePath = `ticket-attachments/${fileName}`

          const { error: uploadError, data } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from('attachments').getPublicUrl(filePath)

          const newFile: UploadedFile = {
            name: file.name,
            size: file.size,
            url: publicUrl,
          }

          setValue('attachments', [...attachments, newFile])
          setUploadProgress((prev) => prev + 100 / acceptedFiles.length)
        } catch (error) {
          console.error('Error uploading file:', error)
          // Handle error (show toast, etc.)
        }
      }

      setIsUploading(false)
      setUploadProgress(0)
    },
    [supabase, attachments, setValue]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
    },
    maxSize: MAX_SIZE,
    multiple: true,
  })

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      const filePath = fileToRemove.url.split('/').pop()
      if (!filePath) return

      await supabase.storage
        .from('attachments')
        .remove([`ticket-attachments/${filePath}`])

      setValue(
        'attachments',
        attachments.filter((file: UploadedFile) => file.url !== fileToRemove.url)
      )
    } catch (error) {
      console.error('Error removing file:', error)
      // Handle error (show toast, etc.)
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 10MB
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Uploading...</p>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files</p>
          <div className="divide-y rounded-lg border">
            {attachments.map((file: UploadedFile) => (
              <div
                key={file.url}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove {file.name}</span>
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