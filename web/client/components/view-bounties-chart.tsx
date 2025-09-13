"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { formatEther } from "viem"

import { useIsMobile } from "@/hooks/use-mobile"
import { useAllBounties, useBountiesByStatus } from "@/contractsABI/contractHooks"
import { BOUNTY_STATUS } from "@/contractsABI/contractTypes"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Claimable bounties analytics and trends"

const chartConfig = {
  bounties: {
    label: "Bounties",
  },
  claimable: {
    label: "Claimable",
    color: "#ef4444", // Red for claimable bounties
  },
  claimed: {
    label: "Claimed",
    color: "#dc2626", // Darker red for claimed bounties
  },
} satisfies ChartConfig

export function ViewBountiesChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const { bounties: allBounties, isLoading } = useAllBounties()
  const { bounties: openBounties } = useBountiesByStatus(BOUNTY_STATUS.OPEN)
  const { bounties: claimedBounties } = useBountiesByStatus(BOUNTY_STATUS.CLAIMED)
  const { bounties: completedBounties } = useBountiesByStatus(BOUNTY_STATUS.PAID)

  // Generate chart data based on bounties
  const generateChartData = React.useMemo(() => {
    if (!allBounties || allBounties.length === 0) return []
    
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Calculate actual bounties for this date
      const dateStr = date.toISOString().split('T')[0]
      const dayBounties = allBounties.filter(bounty => {
        const bountyDate = new Date(Number(bounty.createdAt) * 1000).toISOString().split('T')[0]
        return bountyDate === dateStr
      })
      
      const claimableCount = dayBounties.filter(bounty => bounty.status === BOUNTY_STATUS.OPEN).length
      const claimedCount = dayBounties.filter(bounty => bounty.status === BOUNTY_STATUS.CLAIMED).length
      
      data.push({
        date: dateStr,
        claimable: claimableCount,
        claimed: claimedCount
      })
    }
    
    return data
  }, [allBounties, timeRange])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = generateChartData

  if (isLoading) {
    return (
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Bounty Analytics</CardTitle>
          <CardDescription className="text-white/80">Loading bounty analytics...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-white/60">Loading charts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Bounty Analytics</CardTitle>
        <CardDescription className="text-white/80">
          <span className="hidden @[540px]/card:block">
            Claimable and claimed bounty trends over time
          </span>
          <span className="@[540px]/card:hidden">Bounty trends</span>
        </CardDescription>
        <div className="flex gap-4 text-sm mt-2">
          <div className="text-red-300">
            Open: {openBounties?.length || 0}
          </div>
          <div className="text-red-400">
            Claimed: {claimedBounties?.length || 0}
          </div>
          <div className="text-blue-600">
            Completed: {completedBounties?.length || 0}
          </div>
          <div className="text-purple-600">
            Total: {allBounties?.length || 0}
          </div>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillClaimable" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-claimable)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-claimable)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClaimed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-claimed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-claimed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.2)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "white", fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="claimed"
              type="natural"
              fill="url(#fillClaimed)"
              stroke="var(--color-claimed)"
              stackId="a"
            />
            <Area
              dataKey="claimable"
              type="natural"
              fill="url(#fillClaimable)"
              stroke="var(--color-claimable)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}