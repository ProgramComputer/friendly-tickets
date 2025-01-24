'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNotes } from '@/lib/hooks/tickets/use-notes'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Loader2, SendHorizontal } from 'lucide-react'

interface InternalNotesProps {
  ticketId: string
}

const noteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty'),
})

type NoteFormValues = z.infer<typeof noteSchema>

export function InternalNotes({ ticketId }: InternalNotesProps) {
  const { data: notes, isLoading, addNote } = useNotes(ticketId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: '',
    },
  })

  async function onSubmit(data: NoteFormValues) {
    try {
      setIsSubmitting(true)
      await addNote({
        ticket_id: ticketId,
        content: data.content,
      })
      form.reset()
      toast.success('Note added successfully')
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
        <CardDescription>
          Add private notes visible only to team members
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {notes?.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border">
            <p className="text-muted-foreground">No internal notes yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notes?.map(note => (
              <div key={note.id} className="flex gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={note.author.avatarUrl} />
                  <AvatarFallback>{note.author.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex max-w-[80%] flex-col gap-2">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">{note.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{note.author.name}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full gap-4"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Add an internal note..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSubmitting || !form.formState.isDirty}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  )
} 