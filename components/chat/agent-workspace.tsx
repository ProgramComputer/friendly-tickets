import { useState } from 'react'
import { useChat } from '@/lib/hooks/use-chat'
import { ChatContainer } from './chat-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Users,
  Clock,
  MessageSquare,
  UserCheck,
  PhoneCall,
  Mail,
  BarChart,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentWorkspaceProps {
  className?: string
}

export function AgentWorkspace({ className }: AgentWorkspaceProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const { messages, onlineUsers } = useChat()

  // Mock data - replace with real data
  const activeSessions = [
    {
      id: '1',
      customerName: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      waitTime: '2m',
      lastMessage: 'I need help with my order',
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      status: 'pending',
      waitTime: '5m',
      lastMessage: 'Where is my refund?',
    },
  ]

  return (
    <div className={cn('flex h-screen', className)}>
      {/* Sidebar */}
      <div className="flex w-16 flex-col items-center border-r bg-muted py-4">
        <Button
          size="icon"
          variant="ghost"
          className="mb-4"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
        >
          <PhoneCall className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
        >
          <Mail className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button
          size="icon"
          variant="ghost"
        >
          <BarChart className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat List */}
      <div className="w-80 border-r">
        <div className="border-b p-4">
          <Input placeholder="Search chats..." />
        </div>

        <Tabs defaultValue="active">
          <div className="border-b px-4">
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Active
              </TabsTrigger>
              <TabsTrigger value="waiting" className="flex-1">
                Waiting
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">
                Closed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="m-0">
            <ScrollArea className="h-[calc(100vh-8.5rem)]">
              {activeSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedChat(session.id)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b p-4 text-left hover:bg-muted/50',
                    {
                      'bg-muted': selectedChat === session.id,
                    }
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {session.customerName}
                    </span>
                    <Badge
                      variant={session.status === 'active' ? 'default' : 'secondary'}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {session.email}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Wait time: {session.waitTime}</span>
                  </div>
                  <p className="mt-1 truncate text-sm">
                    {session.lastMessage}
                  </p>
                </button>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedChat ? (
          <ChatContainer
            recipientId={selectedChat}
            recipientName={
              activeSessions.find((s) => s.id === selectedChat)?.customerName || ''
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Card className="mx-auto w-[400px]">
              <CardHeader>
                <CardTitle>Welcome to Agent Workspace</CardTitle>
                <CardDescription>
                  Select a chat from the list to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Active visitors: {onlineUsers.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span>Open chats: {activeSessions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <span>Online agents: 3</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Customer Info Sidebar */}
      {selectedChat && (
        <div className="w-80 border-l p-4">
          <h3 className="mb-4 font-semibold">Customer Information</h3>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-medium">
                    {activeSessions.find((s) => s.id === selectedChat)?.customerName}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Email</span>
                  <p className="font-medium">
                    {activeSessions.find((s) => s.id === selectedChat)?.email}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Previous Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total chats</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last chat</span>
                    <span className="font-medium">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average rating</span>
                    <span className="font-medium">4.5/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    View Order History
                  </Button>
                  <Button variant="outline" size="sm">
                    Create Ticket
                  </Button>
                  <Button variant="outline" size="sm">
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
} 