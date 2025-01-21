import React from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Inbox, Users, Settings, BarChart } from "lucide-react";

const navigationItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Tickets", icon: Inbox, path: "/tickets" },
  { title: "Customers", icon: Users, path: "/customers" },
  { title: "Analytics", icon: BarChart, path: "/analytics" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>AutoCRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.path} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
};