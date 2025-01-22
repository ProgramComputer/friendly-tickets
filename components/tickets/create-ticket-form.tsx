"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TicketPrioritySelect } from "./ticket-priority-select"
import { TicketCategorySelect } from "./ticket-category-select"
import { TicketAssigneeSelect } from "./ticket-assignee-select"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ROUTES } from "@/lib/constants/routes"

const ticketFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().min(1, "Please select a category"),
  assignee_id: z.string().uuid().optional(),
})

type TicketFormValues = z.infer<typeof ticketFormSchema>

const defaultValues: Partial<TicketFormValues> = {
  priority: "medium",
}

export function CreateTicketForm() {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues,
  })

  async function onSubmit(data: TicketFormValues) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          title: data.title,
          description: data.description,
          priority: data.priority,
          category: data.category,
          assignee_id: data.assignee_id,
          customer_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Ticket created",
        description: "Your ticket has been created successfully.",
      })

      router.push(ROUTES.tickets.customer.view(ticket.id))
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief summary of the issue" {...field} />
              </FormControl>
              <FormDescription>
                Keep it short and descriptive
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the issue"
                  className="h-32 resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include all relevant details and steps to reproduce
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <TicketPrioritySelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <TicketCategorySelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignee</FormLabel>
              <FormControl>
                <TicketAssigneeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Optional: Assign this ticket to a specific agent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Ticket
          </Button>
        </div>
      </form>
    </Form>
  )
}
