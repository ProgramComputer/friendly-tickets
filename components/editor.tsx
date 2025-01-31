"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { EditorProps } from '@/types/shared/props'

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  className?: string
  placeholder?: string
  error?: boolean
}

export function Editor({
  content = '',
  onChange,
  className,
  placeholder,
  error
}: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm focus:outline-none max-w-none',
          error && 'prose-red',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    immediatelyRender: false
  })

  return (
    <EditorContent 
      editor={editor} 
      className={cn(
        "min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive",
        className
      )}
    />
  )
} 