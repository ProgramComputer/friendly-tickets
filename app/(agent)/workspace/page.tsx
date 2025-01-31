"use client"

import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { useQuery } from "@tanstack/react-query"
import { ChatContainer } from "@/components/chat/chat-container"
import { QuickResponses } from "@/components/chat/quick-responses"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { TicketList } from "@/components/tickets/list/ticket-list"
import { TicketDetail } from "@/components/tickets/ticket-detail"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget"
import { AgentStats } from '@/types/features/agent/workspace'
import { useVectorStore } from "@/lib/hooks/use-vector-store"

export default function AgentWorkspace() {
  const [selectedView, setSelectedView] = useState<"tickets" | "chat">("tickets")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const retriever = useVectorStore()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agentStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // First get the team member ID
      const { data: teamMember, error: teamMemberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()

      if (teamMemberError) throw teamMemberError
      if (!teamMember) throw new Error("Not a team member")

      // Then use team member ID to query tickets
      const { data, error } = await supabase
        .from("tickets")
        .select("status")
        .eq("assignee_id", teamMember.id)

      if (error) throw error

      // Count tickets by status
      const openTickets = data.filter((ticket) => ticket.status === "open").length
      const pendingTickets = data.filter((ticket) => ticket.status === "pending").length
      const resolvedTickets = data.filter((ticket) => ticket.status === "resolved").length

      return {
        openTickets,
        inProgressTickets: pendingTickets,
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
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Sidebar - Tickets & Chat List */}
      <div className="w-80 border-r bg-background flex flex-col">
        <Tabs defaultValue="tickets" className="flex-1">
          <div className="border-b p-2">
            <TabsList className="w-full">
              <TabsTrigger value="tickets" className="flex-1">Tickets ({stats?.openTickets})</TabsTrigger>
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="tickets" className="flex-1 h-[calc(100vh-8rem)] overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                <div className="mb-4">
                  <h3 className="px-2 py-1 text-sm font-medium text-muted-foreground">Open ({stats?.openTickets})</h3>
                  <TicketList 
                    params={{ 
                      status: ["open"],
                      sort: { field: "created_at", direction: "desc" }
                    }}
                    onTicketSelect={setSelectedItem}
                    selectedTicketId={selectedItem}
                    view="compact"
                  />
                </div>
                <div className="mb-4">
                  <h3 className="px-2 py-1 text-sm font-medium text-muted-foreground">In Progress ({stats?.inProgressTickets})</h3>
                  <TicketList 
                    params={{ 
                      status: ["pending"],
                      sort: { field: "updated_at", direction: "desc" }
                    }}
                    onTicketSelect={setSelectedItem}
                    selectedTicketId={selectedItem}
                    view="compact"
                  />
                </div>
                <div>
                  <h3 className="px-2 py-1 text-sm font-medium text-muted-foreground">Recently Resolved ({stats?.resolvedTickets})</h3>
                  <TicketList 
                    params={{ 
                      status: ["resolved"],
                      sort: { field: "updated_at", direction: "desc" }
                    }}
                    onTicketSelect={setSelectedItem}
                    selectedTicketId={selectedItem}
                    view="compact"
                  />
                </div>
              </div>
            </ScrollArea>
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
            {/* Ticket Content */}
            <div className="flex-1 flex">
              <div className="flex-1 border-r">
                <TicketDetail ticketId={selectedItem} />
              </div>

              {/* Right Sidebar - Customer Info & Quick Actions */}
              <div className="w-80 bg-background p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Quick Responses</h3>
                    <QuickResponses onSelect={(response) => {
                      // TODO: Handle quick response selection
                      console.log('Selected quick response:', response);
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a ticket to view details
          </div>
        )}
      </div>

      {/* AI Assistant */}
      {retriever && <FloatingChatWidget retriever={retriever} />}
    </div>
  )
} 