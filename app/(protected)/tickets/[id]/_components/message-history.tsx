'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMessages } from '@/lib/hooks/tickets/use-messages'
import { useAuth } from '@/lib/hooks/use-auth'
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

interface MessageHistoryProps {
  ticketId: string
}

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
})

type MessageFormValues = z.infer<typeof messageSchema>

export function MessageHistory({ ticketId }: MessageHistoryProps) {
  const { user } = useAuth()
  const { data: messages, isLoading, addMessage } = useMessages(ticketId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  })

  async function onSubmit(data: MessageFormValues) {
    try {
      setIsSubmitting(true)
      await addMessage({
        ticket_id: ticketId,
        content: data.content,
      })
      form.reset()
      toast.success('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
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
        <CardTitle>Message History</CardTitle>
        <CardDescription>
          View and respond to ticket messages
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {messages?.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages?.map(message => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.sender.id === user?.id ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatarUrl} />
                  <AvatarFallback>
                    {message.sender.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex max-w-[80%] flex-col gap-2 ${
                    message.sender.id === user?.id ? 'items-end' : ''
                  }`}
                >
                  <div
                    className={`rounded-lg p-4 ${
                      message.sender.id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{message.sender.name}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(message.created_at), {
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
                      placeholder="Type your message..."
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