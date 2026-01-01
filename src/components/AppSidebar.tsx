"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconListDetails,
  IconTestPipe,
} from "@tabler/icons-react";
import { Code2 } from "lucide-react";
import { motion } from "framer-motion";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { syne } from "@/fonts/fonts";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: IconDatabase,
  },
  {
    title: "Instructions",
    url: "/instructions",
    icon: IconListDetails,
  },
  {
    title: "Test Suites",
    url: "/test-suites",
    icon: IconTestPipe,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: IconChartBar,
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader className="border-b border-primary/10 bg-gradient-to-b from-background to-muted/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors"
              >
                <Code2 className="h-5 w-5 text-primary" />
              </motion.div>
              <div className="flex flex-col">
                <span className={`text-xl font-bold ${syne} bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent`}>
                  AnchorLabs
                </span>
                <span className="text-xs text-muted-foreground">DevTool</span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-background via-background to-muted/10">
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>
    </Sidebar>
  );
}

function NavMain({
  items,
}: {
  items: readonly {
    title: string;
    url: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  size="lg"
                  className="h-12"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span className="text-base font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}