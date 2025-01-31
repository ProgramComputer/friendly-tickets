import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search } from "lucide-react"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Get the current user's team member ID and role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('auth_user_id', user?.id)
    .single()

  // Fetch ticket templates
  const { data: templates } = await supabase
    .from('ticket_templates')
    .select('*, departments(name)')
    .order('name')

  // Group templates by department
  const groupedTemplates = templates?.reduce((acc, template) => {
    const dept = template.departments?.name || 'General'
    if (!acc[dept]) {
      acc[dept] = []
    }
    acc[dept].push(template)
    return acc
  }, {} as Record<string, typeof templates>)

  const departments = templates
    ? [...new Set(templates.map(t => t.departments?.name || 'General'))]
    : []

  const isAdmin = teamMember?.role === 'admin'

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ticket Templates</h1>
          <p className="text-muted-foreground mt-2">
            Standardized templates for creating new tickets
          </p>
        </div>
        {isAdmin && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Alert className="mb-6">
          <AlertDescription>
            Templates are managed by administrators. Contact your admin to request changes.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-4 mb-6">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search templates..." 
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {departments.map(dept => (
            <TabsTrigger key={dept} value={dept}>{dept}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-2">
                        {template.departments?.name || 'General'}
                      </Badge>
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Template</Label>
                    <Input
                      readOnly
                      value={template.subject}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Template</Label>
                    <Textarea
                      readOnly
                      value={template.content}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Department-specific tabs */}
        {departments.map(dept => (
          <TabsContent key={dept} value={dept} className="space-y-4">
            {groupedTemplates?.[dept]?.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-2">
                          {template.departments?.name || 'General'}
                        </Badge>
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Template</Label>
                      <Input
                        readOnly
                        value={template.subject}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Template</Label>
                      <Textarea
                        readOnly
                        value={template.content}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 