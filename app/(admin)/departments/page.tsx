import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"

export default function DepartmentsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground mt-2">Manage support departments and team assignments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">25</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</p>
              <p className="text-2xl font-bold">3.2h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search departments..." className="pl-8" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Team Lead</TableHead>
              <TableHead>Team Size</TableHead>
              <TableHead>Active Tickets</TableHead>
              <TableHead>Avg. Response</TableHead>
              <TableHead>SLA Met</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Technical Support</TableCell>
              <TableCell>Sarah Wilson</TableCell>
              <TableCell>8</TableCell>
              <TableCell>42</TableCell>
              <TableCell>1.8h</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                  95%
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Customer Support</TableCell>
              <TableCell>Michael Chen</TableCell>
              <TableCell>12</TableCell>
              <TableCell>67</TableCell>
              <TableCell>2.1h</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700">
                  88%
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Billing Support</TableCell>
              <TableCell>Emma Davis</TableCell>
              <TableCell>5</TableCell>
              <TableCell>23</TableCell>
              <TableCell>1.5h</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                  97%
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 