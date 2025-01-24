'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import type { TicketWithRelations } from "@/types/tickets"

interface TicketMessagesProps {
  ticket: TicketWithRelations
}

export function TicketMessages({ ticket }: TicketMessagesProps) {
  if (!ticket.messages?.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-muted-foreground">No messages yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {ticket.messages.map((message) => (
        <Card key={message.id} className="p-6">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={message.sender?.avatar_url} />
              <AvatarFallback>
                {message.sender?.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{message.sender?.name}</p>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.attachments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm hover:bg-secondary/80"
                    >
                      {attachment.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 