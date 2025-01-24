import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function QueuePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold">Support Queue</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Tickets</CardTitle>
            <CardDescription>
              Tickets waiting for agent response
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add ticket queue list here */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Statistics</CardTitle>
            <CardDescription>
              Real-time queue metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add queue stats here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 