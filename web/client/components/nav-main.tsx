"use client"

import { IconCirclePlusFilled, IconTrophy, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              tooltip="Create Bounty"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:text-white active:from-red-700 active:to-red-800 active:text-white border-red-500/30 min-w-8 duration-200 ease-linear"
            >
              <a href="/bounties/create-bounties">
                <IconCirclePlusFilled />
                <span>Create Bounty</span>
              </a>
            </SidebarMenuButton>
            <Button
              asChild
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 bg-red-900/30 border-white/20 text-white hover:bg-red-800/40"
              variant="outline"
            >
              <a href="/bounties/view-bounties">
                <IconTrophy />
                <span className="sr-only">View Bounties</span>
              </a>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className="text-white hover:bg-white/10 hover:text-white">
                <a href={item.url}>
                  {item.icon && <item.icon className="text-red-400" />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
