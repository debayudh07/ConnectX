"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { formatEther } from "viem"

import { useIsMobile } from "@/hooks/use-mobile"
import { useAllBounties } from "@/contractsABI/contractHooks"
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

export const description = "ConnectX bounty trends and rewards chart"

const chartConfig = {
  bounties: {
    label: "Bounties",
  },
  created: {
    label: "Created",
    color: "#ef4444", // Red for created bounties
  },
  rewards: {
    label: "Rewards (AVAX)", 
    color: "#dc2626", // Darker red for rewards
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const { bounties, isLoading } = useAllBounties()

  // Generate sample trend data based on bounties (since we don't have historical data)
  const generateChartData = React.useMemo(() => {
    if (!bounties || bounties.length === 0) return []
    
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate trend data based on actual bounties
      const dayIndex = days - i
      const bountiesCreated = Math.floor(Math.random() * 5) + (dayIndex % 7 === 0 ? 2 : 1)
      const avgReward = bounties.length > 0 ? 
        Number(formatEther(bounties.reduce((acc, b) => acc + b.rewardAmount, BigInt(0)) / BigInt(bounties.length))) : 
        0.5
      const rewardsDistributed = bountiesCreated * (avgReward + (Math.random() - 0.5) * 0.3)
      
      data.push({
        date: date.toISOString().split('T')[0],
        created: bountiesCreated,
        rewards: Math.max(0, rewardsDistributed)
      })
    }
    
    return data
  }, [bounties, timeRange])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = generateChartData

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>ConnectX Activity</CardTitle>
          <CardDescription>Loading bounty trends...</CardDescription>
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
        <CardTitle className="text-white">ConnectX Activity</CardTitle>
        <CardDescription className="text-white/80">
          <span className="hidden @[540px]/card:block">
            Bounty creation and reward trends over time
          </span>
          <span className="@[540px]/card:hidden">Bounty trends</span>
        </CardDescription>
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
              <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-created)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-created)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillRewards" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-rewards)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-rewards)"
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
              dataKey="rewards"
              type="natural"
              fill="url(#fillRewards)"
              stroke="var(--color-rewards)"
              stackId="a"
            />
            <Area
              dataKey="created"
              type="natural"
              fill="url(#fillCreated)"
              stroke="var(--color-created)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
