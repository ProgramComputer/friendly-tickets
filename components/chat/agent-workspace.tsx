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
} from 'lucide-react'
import { ChatContainer } from './chat-container'
import { QuickResponses } from './quick-responses'
import { useSupabase } from '@/lib/supabase/client'
import { getActiveSessions } from '@/lib/services/chat-session'

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
    if (!session?.user?.id) return

    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const online = new Set(Object.keys(newState))
        setOnlineUsers(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: session.user.id })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Available
            </Button>
            <Button size="sm" variant="outline" className="w-10 px-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Active
                <Badge variant="secondary" className="ml-2">
                  {sessions.filter((s) => s.customer.status === 'active').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="waiting" className="flex-1">
                Waiting
                <Badge variant="secondary" className="ml-2">
                  {sessions.filter((s) => s.customer.status === 'waiting').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">
                Closed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="m-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {sessions
                  .filter((s) => s.customer.status === 'active')
                  .map((session) => (
                    <Card
                      key={session.id}
                      className={`p-4 mb-2 cursor-pointer hover:bg-accent/50 ${
                        selectedSession === session.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{session.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.customer.lastMessage}
                          </div>
                        </div>
                        <Badge variant="outline">{session.customer.waitTime}</Badge>
                      </div>
                    </Card>
                  ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="waiting" className="m-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {sessions
                  .filter((s) => s.customer.status === 'waiting')
                  .map((session) => (
                    <Card
                      key={session.id}
                      className={`p-4 mb-2 cursor-pointer hover:bg-accent/50 ${
                        selectedSession === session.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{session.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.customer.lastMessage}
                          </div>
                        </div>
                        <Badge>{session.customer.waitTime}</Badge>
                      </div>
                    </Card>
                  ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="closed" className="m-0">
              <div className="p-4 text-center text-muted-foreground">
                No closed chats
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedSession ? (
          <ChatContainer
            recipientId={selectedSession}
            recipientName={
              sessions.find((s) => s.id === selectedSession)?.customer.name || ''
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No chat selected</h3>
              <p>Select a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Info Sidebar */}
      {selectedSession && (
        <div className="w-64 border-l bg-muted/10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Customer Info</h3>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>John Doe</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>john@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>+1 234 567 890</span>
                </div>
              </div>

              {/* Previous Interactions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Previous Chats</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Last chat: 2 days ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    <span>5 previous conversations</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    VIP Customer
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Technical Issue
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Order History
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
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