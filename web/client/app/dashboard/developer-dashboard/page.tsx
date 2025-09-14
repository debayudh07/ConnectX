"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DeveloperSectionCards } from "@/components/developer-section-cards"
import { DeveloperBountyTable } from "@/components/developer-bounty-table"
import { DeveloperBadgeSection } from "@/components/developer-badge-section"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DeveloperDashboard() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-black">
          <SiteHeader />
          <div className="flex flex-1 flex-col bg-black min-h-screen">
            <div className="@container/main flex flex-1 flex-col gap-2 bg-black">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-black">
                <DeveloperSectionCards />
                <div className="px-4 lg:px-6 bg-black">
                  <DeveloperBadgeSection />
                </div>
                <div className="px-4 lg:px-6 bg-black">
                  <DeveloperBountyTable />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}