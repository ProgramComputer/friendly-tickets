import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

export default function TemplatesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Response Templates</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Greeting Template</CardTitle>
              <CardDescription>Standard greeting for new tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value="Greeting Template" readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    readOnly
                    value="Hi {{customer.name}},

Thank you for reaching out to our support team. I understand you're having an issue with {{ticket.category}}. I'll be happy to help you with this.

Could you please provide more details about what you're experiencing?

Best regards,
{{agent.name}}"
                    className="min-h-[200px]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Edit</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add more template cards here */}
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared Templates</CardTitle>
              <CardDescription>Templates available to all team members</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add shared templates list */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Templates</CardTitle>
              <CardDescription>Your private response templates</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add personal templates list */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 