"use client"

import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { useQuery } from "@tanstack/react-query"
import { ChatContainer } from "@/components/chat/chat-container"
import { QuickResponses } from "@/components/chat/quick-responses"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface AgentStats {
  assignedTickets: number
  openTickets: number
  resolvedTickets: number
}

export default function AgentWorkspace() {
  const [selectedView, setSelectedView] = useState<"tickets" | "chat">("tickets")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agentStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("tickets")
        .select("status, created_at")
        .eq("assigned_to", user.id)

      if (error) throw error

      const assignedTickets = data.length
      const openTickets = data.filter((ticket) => ticket.status === "open").length
      const resolvedTickets = data.filter(
        (ticket) => ticket.status === "resolved"
      ).length

      return {
        assignedTickets,
        openTickets,
        resolvedTickets,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Sidebar - Tickets & Chat List */}
      <div className="w-80 border-r bg-background flex flex-col">
        <Tabs defaultValue="tickets" className="flex-1">
          <div className="border-b p-2">
            <TabsList className="w-full">
              <TabsTrigger value="tickets" className="flex-1">Tickets</TabsTrigger>
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="tickets" className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              <Card className="p-4">
                <div className="text-sm font-medium">Open ({stats?.openTickets})</div>
                {/* TODO: List of open tickets */}
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium">Assigned ({stats?.assignedTickets})</div>
                {/* TODO: List of assigned tickets */}
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium">Resolved ({stats?.resolvedTickets})</div>
                {/* TODO: List of resolved tickets */}
        </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="chats" className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              <Card className="p-4">
                <div className="text-sm font-medium">Active Chats</div>
                {/* TODO: List of active chats */}
        </Card>
              <Card className="p-4">
                <div className="text-sm font-medium">Waiting Queue</div>
                {/* TODO: List of waiting chats */}
        </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            {/* Conversation Header */}
            <div className="h-14 border-b px-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Customer Name</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedView === "tickets" ? `Ticket #${selectedItem}` : "Chat Session"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Assign</Button>
                <Button variant="outline" size="sm">Status</Button>
              </div>
            </div>

            {/* Chat/Ticket Content */}
            <div className="flex-1 flex">
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                  <ChatContainer
                    sessionId={selectedItem}
                    recipientId="customer-id" // TODO: Get from selected item
                    recipientName="Customer Name" // TODO: Get from selected item
                  />
                </div>
              </div>

              {/* Right Sidebar - Customer Info & Quick Actions */}
              <div className="w-80 border-l bg-background p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Details</h3>
                    {/* TODO: Customer info */}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Quick Responses</h3>
                    <QuickResponses />
                  </div>
                  {selectedView === "tickets" && (
                    <div>
                      <h3 className="font-semibold mb-2">Ticket Details</h3>
                      {/* TODO: Ticket metadata */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a ticket or chat to view details
          </div>
        )}
      </div>
    </div>
  )
} 