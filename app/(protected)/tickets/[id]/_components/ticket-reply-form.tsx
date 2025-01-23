import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip } from "lucide-react"

interface TicketReplyFormProps {
  onSubmit: (data: { content: string; attachments: File[] }) => void
  isLoading?: boolean
}

export function TicketReplyForm({ onSubmit, isLoading }: TicketReplyFormProps) {
  return (
    <Card className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const content = formData.get("content") as string
          const attachments = Array.from(formData.getAll("attachments")) as File[]
          onSubmit({ content, attachments })
          e.currentTarget.reset()
        }}
      >
        <div className="space-y-4">
          <Textarea
            name="content"
            placeholder="Type your reply..."
            required
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                name="attachments"
                id="attachments"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  document.getElementById("attachments")?.click()
                }}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach files
              </Button>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reply"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
} 