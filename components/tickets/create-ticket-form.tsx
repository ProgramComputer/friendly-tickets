"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { TicketTemplateSelect } from "./ticket-template-select"
import { TicketTagSelect } from "./ticket-tag-select"
import { TicketDepartmentSelect } from "./ticket-department-select"
import { TicketSLASelect } from "./ticket-sla-select"
import { CustomFieldsForm } from "./custom-fields-form"
import { WatchersInput } from "./watchers-input"
import { RoleGate } from "@/components/auth/role-gate"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  createCustomerTicketSchema,
  createAgentTicketSchema,
  createAdminTicketSchema,
  type CreateCustomerTicketInput,
  type CreateAgentTicketInput,
  type CreateAdminTicketInput,
} from "@/lib/schemas/ticket"

type UserRole = "customer" | "agent" | "admin"

// Get the appropriate schema based on user role
function getSchemaForRole(role: UserRole) {
  switch (role) {
    case "customer":
      return createCustomerTicketSchema
    case "agent":
      return createAgentTicketSchema
    case "admin":
      return createAdminTicketSchema
    default:
      return createCustomerTicketSchema
  }
}

type TicketFormValues = CreateCustomerTicketInput | CreateAgentTicketInput | CreateAdminTicketInput

const defaultValues: Partial<TicketFormValues> = {
  priority: "medium",
}

export function CreateTicketForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, role, isLoading } = useAuth()

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(getSchemaForRole(role as UserRole)),
    defaultValues,
  })

  async function onSubmit(data: TicketFormValues) {
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Ticket created successfully",
      })

      router.push(`/tickets/${result.data.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
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

        <FormField
          control={form.control}
          name="categoryId"
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

        <RoleGate allowedRoles={["agent", "admin"]} requireFeature="edit_tickets">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <TicketDepartmentSelect
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
            name="assignedToId"
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
                  Assign this ticket to a specific agent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TicketTagSelect
                    value={field.value || []}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </RoleGate>

        <RoleGate requireFeature="manage_templates">
          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <FormControl>
                  <TicketTemplateSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </RoleGate>

        <RoleGate requireFeature="manage_sla">
          <FormField
            control={form.control}
            name="slaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SLA Policy</FormLabel>
                <FormControl>
                  <TicketSLASelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </RoleGate>

        <RoleGate requireFeature="edit_tickets">
          <CustomFieldsForm
            control={form.control}
            name="customFields"
          />
        </RoleGate>

        <WatchersInput
          control={form.control}
          ccName="cc"
          bccName="bcc"
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
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
