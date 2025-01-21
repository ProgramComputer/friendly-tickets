import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/Layout/AppShell";
import { BarChart, Users, Clock, CheckCircle } from "lucide-react";

const statsCards = [
  {
    title: "Open Tickets",
    value: "23",
    icon: Clock,
    change: "+5%",
    trend: "up",
  },
  {
    title: "Resolved Today",
    value: "15",
    icon: CheckCircle,
    change: "+12%",
    trend: "up",
  },
  {
    title: "Active Customers",
    value: "1,234",
    icon: Users,
    change: "+2.5%",
    trend: "up",
  },
  {
    title: "Avg. Response Time",
    value: "2.4h",
    icon: BarChart,
    change: "-10%",
    trend: "down",
  },
];

const Index = () => {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome to AutoCRM Support Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up" ? "text-success" : "text-error"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Tickets</h3>
            <div className="space-y-4">
              {/* Placeholder for recent tickets list */}
              <p className="text-gray-500">Loading recent tickets...</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
            <div className="space-y-4">
              {/* Placeholder for team performance metrics */}
              <p className="text-gray-500">Loading performance metrics...</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Index;