"use client"

import * as React from "react"
import { IconTrendingUp, IconCoin, IconCode, IconTrophy, IconStar } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { 
  useDeveloperClaims, 
  useDeveloperCompletions, 
  useReputationData,
  useAllBounties 
} from "@/contractsABI/contractHooks"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DeveloperSectionCards() {
  const { address } = useAccount()
  const { claimedBountyIds, isLoading: loadingClaims } = useDeveloperClaims(address || '0x0000000000000000000000000000000000000000')
  const { completedBountyIds, isLoading: loadingCompletions } = useDeveloperCompletions(address || '0x0000000000000000000000000000000000000000')
  const { stats, isLoading: loadingReputation } = useReputationData(address || '0x0000000000000000000000000000000000000000')
  const { bounties: allBounties } = useAllBounties()

  // Calculate developer metrics
  const totalClaimed = claimedBountyIds?.length || 0
  const totalCompleted = completedBountyIds?.length || 0
  
  // Calculate earnings from completed bounties
  const totalEarnings = React.useMemo(() => {
    if (!completedBountyIds || !allBounties) return BigInt(0)
    
    return completedBountyIds.reduce((acc: bigint, bountyId: bigint) => {
      const bounty = allBounties.find(b => b.id === bountyId)
      return bounty ? acc + bounty.rewardAmount : acc
    }, BigInt(0))
  }, [completedBountyIds, allBounties])

  const completionRate = totalClaimed > 0 ? Math.round((totalCompleted / totalClaimed) * 100) : 0
  const reputationScore = stats?.totalScore || BigInt(0)

  const isLoading = loadingClaims || loadingCompletions || loadingReputation

  if (!address) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card col-span-full bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-white/80">
              Please connect your wallet to view your developer dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Claimed Bounties</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : totalClaimed}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconCode className="w-3 h-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Your current bounties <IconTrendingUp className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Bounties you&apos;ve claimed to work on
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Total Earnings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : `${parseFloat(formatEther(totalEarnings)).toFixed(3)} AVAX`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconCoin className="w-3 h-3" />
              Earned
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            From {totalCompleted} completed bounties <IconTrophy className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Total AVAX earned from bounties
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Completion Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : `${completionRate}%`}
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
            {totalCompleted}/{totalClaimed} completed <IconCode className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Percentage of claimed bounties completed
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Reputation Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : reputationScore.toString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconStar className="w-3 h-3" />
              Rep
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Building your reputation <IconStar className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Your overall ConnectX reputation
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}