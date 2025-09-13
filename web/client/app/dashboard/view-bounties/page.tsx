import { AppSidebar } from "@/components/app-sidebar"
import { ViewBountiesChart } from "@/components/view-bounties-chart"
import { ClaimableBountyTable } from "@/components/claimable-bounty-table"
import { FloatingCreateButton } from "@/components/floating-create-button"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
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
                <SectionCards />
                <div className="px-4 lg:px-6 bg-black">
                  <ViewBountiesChart />
                </div>
                <div className="bg-black">
                  <ClaimableBountyTable />
                </div>
              </div>
            </div>
          </div>
          <FloatingCreateButton />
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}