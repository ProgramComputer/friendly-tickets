"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ticketService } from "@/lib/services/ticket-service"
import { CreateTicketInput, TicketPriority } from "@/lib/types/tickets"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const priorities: { label: string; value: TicketPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
]

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
})

export default function NewTicketPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  })

  const { mutate: createTicket, isPending } = useMutation({
    mutationFn: (values: CreateTicketInput) => ticketService.createTicket(values),
    onSuccess: (ticket) => {
      if (ticket) {
        queryClient.invalidateQueries({ queryKey: ["tickets"] })
        toast.success("Ticket created successfully")
        router.push(`/customer/tickets/${ticket.id}`)
      } else {
        toast.error("Failed to create ticket")
      }
    },
    onError: () => {
      toast.error("Failed to create ticket")
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTicket(values)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          asChild
        >
          <Link href="/customer/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Ticket</CardTitle>
            <CardDescription>
              Submit a new support ticket and we'll help you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of your issue"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear and concise title helps us understand your issue
                        quickly
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
                          placeholder="Detailed description of your issue"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Please provide as much detail as possible, including any
                        error messages or steps to reproduce
                      </FormDescription>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the priority level based on the urgency of your
                        issue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 