import { useState, useEffect } from 'react'
import { useChat } from '@/lib/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  MessageSquare,
  CheckCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  MoreHorizontal,
  Filter,
  Archive,
  History,
  TicketIcon,
} from 'lucide-react'
import { ChatContainer } from './chat-container'
import { QuickResponses } from './quick-responses'
import { useSupabase } from '@/lib/supabase/client'
import { getActiveSessions } from '@/lib/services/chat-session'
import { cn } from '@/lib/utils'

interface AgentWorkspaceProps {
  className?: string
}

// Mock data - replace with real data
const mockSessions = [
  {
    id: '1',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      waitTime: '2m',
      lastMessage: 'I need help with my order',
    },
  },
  {
    id: '2',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'waiting',
      waitTime: '5m',
      lastMessage: 'Where is my refund?',
    },
  },
]

export function AgentWorkspace({ className }: AgentWorkspaceProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [sessions, setSessions] = useState(mockSessions)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const { session } = useSupabase()
  const { messages } = useChat(selectedSession || undefined)

  // Load active sessions
  useEffect(() => {
    if (!session?.user?.id) return

    const loadSessions = async () => {
      try {
        const data = await getActiveSessions(session.user.id, 'agent')
        // TODO: Transform data to match UI requirements
        console.log('Active sessions:', data)
      } catch (error) {
        console.error('Error loading sessions:', error)
      }
    }

    loadSessions()
  }, [session?.user?.id])

  // Subscribe to presence changes
  useEffect(() => {
    if (session?.user) {
      const channel = supabase.channel('online-agents')
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          setOnlineUsers(state)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ auth_user_id: session.user.id })
          }
        })

      return () => {
        channel.unsubscribe()
      }
    }
  }, [session])

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card/50">
        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="w-full font-medium">
              <Clock className="h-4 w-4 mr-2 text-green-500" />
              Available
            </Button>
            <Button size="sm" variant="outline" className="w-10 px-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background">
              <TabsTrigger value="active" className="flex-1 font-medium">
                Active
                <Badge variant="secondary" className="ml-2 font-normal">
                  {sessions.filter((s) => s.customer.status === 'active').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="waiting" className="flex-1 font-medium">
                Waiting
                <Badge variant="secondary" className="ml-2 font-normal">
                  {sessions.filter((s) => s.customer.status === 'waiting').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex-1 font-medium">
                Closed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="m-0 mt-4">
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="space-y-2 pr-4">
                  {sessions
                    .filter((s) => s.customer.status === 'active')
                    .map((session) => (
                      <Card
                        key={session.id}
                        className={cn(
                          'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                          selectedSession === session.id && 'bg-accent shadow-sm'
                        )}
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium">
                              {session.customer.name[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium truncate">
                                {session.customer.name}
                              </div>
                              <Badge 
                                variant="outline" 
                                className="font-normal whitespace-nowrap"
                              >
                                {session.customer.waitTime}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {session.customer.lastMessage}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="waiting" className="m-0 mt-4">
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="space-y-2 pr-4">
                  {sessions
                    .filter((s) => s.customer.status === 'waiting')
                    .map((session) => (
                      <Card
                        key={session.id}
                        className={cn(
                          'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                          selectedSession === session.id && 'bg-accent shadow-sm'
                        )}
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium">
                              {session.customer.name[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium truncate">
                                {session.customer.name}
                              </div>
                              <Badge 
                                variant="secondary"
                                className="font-normal whitespace-nowrap"
                              >
                                {session.customer.waitTime}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {session.customer.lastMessage}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="closed" className="m-0 mt-4">
              <div className="h-[calc(100vh-14rem)] flex items-center justify-center text-center">
                <div className="space-y-2">
                  <Archive className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No closed chats</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedSession ? (
          <ChatContainer
            sessionId={selectedSession}
            recipientId={
              sessions.find((s) => s.id === selectedSession)?.customer.id || ''
            }
            recipientName={
              sessions.find((s) => s.id === selectedSession)?.customer.name || ''
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="font-medium">No chat selected</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Info Sidebar */}
      {selectedSession && (
        <div className="w-80 border-l bg-card/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Customer Info</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{sessions.find((s) => s.id === selectedSession)?.customer.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{sessions.find((s) => s.id === selectedSession)?.customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{sessions.find((s) => s.id === selectedSession)?.customer.phone || 'Not provided'}</span>
                </div>
              </div>

              {/* Previous Interactions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Previous Chats</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Last chat: 2 days ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>5 previous conversations</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-sm font-medium mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    VIP Customer
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Technical Issue
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start font-normal">
                    <History className="h-4 w-4 mr-2" />
                    View Order History
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start font-normal">
                    <TicketIcon className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 