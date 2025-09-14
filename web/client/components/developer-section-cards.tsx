"use client"

import * as React from "react"
import { IconTrendingUp, IconCoin, IconCode, IconTrophy, IconStar, IconBadge, IconCalendar, IconActivity } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { 
  useDeveloperClaims, 
  useDeveloperCompletions, 
  useReputationData,
  useAllBounties,
  useDeveloperBadgeQueries,
  useDeveloperBadgeRead,
  useBadgeTypeQueries
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
  const userAddress = address || '0x0000000000000000000000000000000000000000'
  
  // Core bounty data
  const { claimedBountyIds, isLoading: loadingClaims } = useDeveloperClaims(userAddress)
  const { completedBountyIds, isLoading: loadingCompletions } = useDeveloperCompletions(userAddress)
  const { badgeCount, isLoading: loadingReputation } = useReputationData(userAddress)
  const { bounties: allBounties } = useAllBounties()
  
  // Enhanced badge data using new hooks
  const { 
    badgeCount: totalBadges, 
    developerBadges: badgeIds, 
    balance: nftBalance 
  } = useDeveloperBadgeQueries(userAddress)
  
  const badgeRead = useDeveloperBadgeRead()
  
  // Get badges by type (assuming types 0, 1, 2 represent different badge categories)
  const completionBadges = useBadgeTypeQueries(userAddress, BigInt(0))
  const streakBadges = useBadgeTypeQueries(userAddress, BigInt(1))
  const specialBadges = useBadgeTypeQueries(userAddress, BigInt(2))

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

  // Enhanced metrics
  const completionRate = totalClaimed > 0 ? Math.round((totalCompleted / totalClaimed) * 100) : 0
  const reputationScore = Number(totalBadges || badgeCount || BigInt(0))
  const averageEarningsPerBounty = totalCompleted > 0 ? totalEarnings / BigInt(totalCompleted) : BigInt(0)
  
  // Badge type counts
  const completionBadgeCount = Number(completionBadges.badgesByType || 0)
  const streakBadgeCount = Number(streakBadges.badgesByType || 0)
  const specialBadgeCount = Number(specialBadges.badgesByType || 0)

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
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
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
            Avg: {parseFloat(formatEther(averageEarningsPerBounty)).toFixed(3)} AVAX/bounty
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
          <CardDescription className="text-white/80">Achievement Badges</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : reputationScore}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconBadge className="w-3 h-3" />
              NFTs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Badge collection <IconTrophy className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Total achievement badges earned
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Badge Types</CardDescription>
          <CardTitle className="text-lg font-semibold text-white">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Completion:</span>
                <span>{completionBadgeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Streak:</span>
                <span>{streakBadgeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Special:</span>
                <span>{specialBadgeCount}</span>
              </div>
            </div>
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconStar className="w-3 h-3" />
              Types
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Badge categories <IconActivity className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Different types of achievements
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}