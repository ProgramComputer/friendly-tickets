import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminOverviewPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold">Admin Overview</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your support team</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add team stats here */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Tickets</CardTitle>
            <CardDescription>Monitor ticket status</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add ticket stats here */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Monitor system performance</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add system stats here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 