"use client"

import { IconTrendingUp, IconCoin, IconCode, IconTrophy, IconUsers } from "@tabler/icons-react"
import { useTotalBounties, useAllBounties } from "@/contractsABI/contractHooks"
import { formatEther } from "viem"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { totalBounties, isLoading: loadingTotal } = useTotalBounties()
  const { bounties, isLoading: loadingBounties } = useAllBounties()

  // Calculate metrics from bounty data
  const totalRewards = bounties?.reduce((acc, bounty) => acc + bounty.rewardAmount, BigInt(0)) || BigInt(0)
  const activeBounties = bounties?.filter(bounty => bounty.status === 0).length || 0
  const completedBounties = bounties?.filter(bounty => bounty.status === 4).length || 0
  const uniqueDevelopers = new Set(bounties?.filter(bounty => bounty.claimedBy !== '0x0000000000000000000000000000000000000000').map(bounty => bounty.claimedBy)).size

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Total Bounties</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {loadingTotal ? "..." : totalBounties?.toString() || "0"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconTrophy className="w-3 h-3" />
              Total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Active bounties: {activeBounties} <IconTrendingUp className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Total bounties created on ConnectX
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Total Value Locked</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {loadingBounties ? "..." : `${parseFloat(formatEther(totalRewards)).toFixed(2)} AVAX`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconCoin className="w-3 h-3" />
              TVL
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Growing ecosystem value <IconTrendingUp className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Total AVAX locked in bounties
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Active Developers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {loadingBounties ? "..." : uniqueDevelopers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconUsers className="w-3 h-3" />
              Devs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Active contributors <IconCode className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Unique developers claiming bounties
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Completion Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {loadingBounties ? "..." : totalBounties ? `${Math.round((completedBounties / Number(totalBounties)) * 100)}%` : "0%"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconTrendingUp className="w-3 h-3" />
              Success
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            {completedBounties} completed bounties <IconTrophy className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Bounties successfully completed
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
