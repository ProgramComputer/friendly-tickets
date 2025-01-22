"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateTicketForm } from "./create-ticket-form"

export function CreateTicketButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new support ticket. We'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <CreateTicketForm />
      </DialogContent>
    </Dialog>
  )
}