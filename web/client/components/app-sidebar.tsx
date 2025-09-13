"use client"

import * as React from "react"
import {
  IconBrandGithub,
  IconChartBar,
  IconCode,
  IconCoin,
  IconDashboard,
  IconFileDescription,
  IconGavel,
  IconHelp,
  IconInnerShadowTop,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrophy,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react"

import { NavBounties } from "@/components/nav-bounties"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Web3 Developer",
    email: "dev@connectx.com",
    avatar: "/avatars/developer.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Developer Dashboard",
      url: "/dashboard/developer-dashboard",
      icon: IconCode,
    },
    {
      title: "Maintainer Dashboard", 
      url: "/dashboard/maintainer-dashboard",
      icon: IconGavel,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
  ],
  navBounties: [
    {
      title: "Create Bounty",
      icon: IconPlus,
      isActive: false,
      url: "/bounties/create-bounties",
      items: [
        {
          title: "New Bounty",
          url: "/bounties/create-bounties",
        },
        {
          title: "Templates",
          url: "/bounties/templates",
        },
      ],
    },
    {
      title: "View Bounties",
      icon: IconTrophy,
      url: "/dashboard/view-bounties",
      items: [
        {
          title: "All Bounties",
          url: "/dashboard/view-bounties",
        },
        {
          title: "My Bounties",
          url: "/dashboard/view-bounties/my-bounties",
        },
        {
          title: "Completed",
          url: "/dashboard/view-bounties/completed",
        },
      ],
    },
    {
      title: "Submissions",
      icon: IconFileDescription,
      url: "/bounties/submissions",
      items: [
        {
          title: "Pending Review",
          url: "/bounties/submissions/pending",
        },
        {
          title: "Approved",
          url: "/bounties/submissions/approved",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Wallet",
      url: "/wallet",
      icon: IconWallet,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Reputation System",
      url: "/reputation",
      icon: IconUsers,
    },
    {
      name: "Earnings",
      url: "/earnings",
      icon: IconCoin,
    },
    {
      name: "GitHub Integration",
      url: "/github",
      icon: IconBrandGithub,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="bg-black border-white/20" {...props}>
      <SidebarHeader className="bg-black">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 text-white hover:bg-white/10"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5 text-red-400" />
                <span className="text-base font-semibold text-white">ConnectX</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-black">
        <NavMain items={data.navMain} />
        <NavBounties items={data.navBounties} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="bg-black">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
