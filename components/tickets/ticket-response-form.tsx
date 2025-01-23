"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/lib/hooks/use-auth"
import { RoleGate } from "@/components/auth/role-gate"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { z } from "zod"
import { toast } from "sonner"
import { supabase } from '@/lib/supabase/client'

const responseSchema = z.object({
  content: z.string().min(1, "Response cannot be empty"),
  isInternal: z.boolean().default(false),
})

type ResponseFormValues = z.infer<typeof responseSchema>

interface TicketResponseFormProps {
  ticketId: string
  onSuccess?: () => void
}

export function TicketResponseForm({ ticketId, onSuccess }: TicketResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { canAccessFeature } = useAuth()

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      content: "",
      isInternal: false,
    },
  })

  async function onSubmit(values: ResponseFormValues) {
    try {
      setIsSubmitting(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("ticket_responses").insert({
        ticket_id: ticketId,
        content: values.content,
        is_internal: values.isInternal,
        author_id: user.id,
      })

      if (error) throw error

      form.reset()
      toast.success("Response added successfully")
      onSuccess?.()
    } catch (error) {
      console.error("Error submitting response:", error)
      toast.error("Failed to add response")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Type your response..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <RoleGate requireFeature="create_internal_notes">
          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="isInternal"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label>Internal note</Label>
                </FormItem>
              )}
            />
          </div>
        </RoleGate>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Response"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 