// import { useEffect, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { AppShell } from "@/components/Layout/AppShell";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { BarChart, Users, Clock, CheckCircle, Plus } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import type { Database } from "@/integrations/supabase/types";

// type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

// interface TicketStats {
//   open: number;
//   resolved: number;
//   total: number;
//   avgResponseTime: number;
// }

// const Index = () => {
//   const { data: ticketStats, isLoading } = useQuery({
//     queryKey: ["ticketStats"],
//     queryFn: async () => {
//       const { data: tickets, error } = await supabase
//         .from("tickets")
//         .select("*");  // Select all fields to match the Ticket type

//       if (error) throw error;

//       const stats: TicketStats = {
//         open: tickets.filter(t => t.status === "open").length,
//         resolved: tickets.filter(t => t.status === "resolved").length,
//         total: tickets.length,
//         avgResponseTime: calculateAvgResponseTime(tickets),
//       };

//       return stats;
//     },
//   });

//   const calculateAvgResponseTime = (tickets: Ticket[]) => {
//     if (!tickets.length) return 0;
//     const responseTimes = tickets.map(t => {
//       const created = new Date(t.created_at);
//       const updated = new Date(t.updated_at);
//       return (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
//     });
//     return Number((responseTimes.reduce((a, b) => a + b, 0) / tickets.length).toFixed(1));
//   };

//   const statsCards = [
//     {
//       title: "Open Tickets",
//       value: isLoading ? "-" : ticketStats?.open.toString() || "0",
//       icon: Clock,
//       change: "+5%",
//       trend: "up",
//     },
//     {
//       title: "Resolved Today",
//       value: isLoading ? "-" : ticketStats?.resolved.toString() || "0",
//       icon: CheckCircle,
//       change: "+12%",
//       trend: "up",
//     },
//     {
//       title: "Total Tickets",
//       value: isLoading ? "-" : ticketStats?.total.toString() || "0",
//       icon: Users,
//       change: "+2.5%",
//       trend: "up",
//     },
//     {
//       title: "Avg. Response Time",
//       value: isLoading ? "-" : `${ticketStats?.avgResponseTime || 0}h`,
//       icon: BarChart,
//       change: "-10%",
//       trend: "down",
//     },
//   ];

//   return (
//     <AppShell>
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
//             <p className="text-gray-500 mt-2">Welcome to AutoCRM Support Dashboard</p>
//           </div>
//           <Button className="flex items-center gap-2">
//             <Plus className="h-4 w-4" />
//             New Ticket
//           </Button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {statsCards.map((stat) => (
//             <Card key={stat.title} className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">{stat.title}</p>
//                   <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
//                 </div>
//                 <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
//                   <stat.icon className="h-6 w-6 text-primary" />
//                 </div>
//               </div>
//               <div className="mt-4">
//                 <span
//                   className={`text-sm font-medium ${
//                     stat.trend === "up" ? "text-success" : "text-error"
//                   }`}
//                 >
//                   {stat.change}
//                 </span>
//                 <span className="text-sm text-gray-500 ml-2">vs last week</span>
//               </div>
//             </Card>
//           ))}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Card className="p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">Recent Tickets</h3>
//               <Button variant="outline" size="sm">
//                 View All
//               </Button>
//             </div>
//             <div className="space-y-4">
//               {isLoading ? (
//                 <p className="text-gray-500">Loading recent tickets...</p>
//               ) : (
//                 <p className="text-gray-500">No recent tickets found</p>
//               )}
//             </div>
//           </Card>

//           <Card className="p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">Team Performance</h3>
//               <Button variant="outline" size="sm">
//                 View Details
//               </Button>
//             </div>
//             <div className="space-y-4">
//               {isLoading ? (
//                 <p className="text-gray-500">Loading performance metrics...</p>
//               ) : (
//                 <p className="text-gray-500">No performance data available</p>
//               )}
//             </div>
//           </Card>
//         </div>
//       </div>
//     </AppShell>
//   );
// };

// export default Index;