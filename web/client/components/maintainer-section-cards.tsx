"use client"

import * as React from "react"
import { IconPlus, IconCoin, IconUsers, IconChartLine, IconSettings, IconPlayerPause, IconBadge } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { 
  useTotalBounties, 
  useMaintainerBounties, 
  useAllBounties,
  usePlatformFeePercentage,
  useMinimumBountyAmount,
  useMaximumClaimDuration,
  useFeeRecipient,
  useIsPaused 
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
import { VerifierRoleCard } from "@/components/verifier-role-card"

export function MaintainerSectionCards() {
  const { address } = useAccount()
  const userAddress = address || '0x0000000000000000000000000000000000000000'
  
  // Core bounty data
  const { totalBounties, isLoading: loadingTotal } = useTotalBounties()
  const { bountyIds, isLoading: loadingBounties } = useMaintainerBounties(userAddress)
  const { bounties: allBounties, isLoading: loadingAllBounties } = useAllBounties()
  
  // Platform configuration data
  const { feePercentage, isLoading: loadingFee } = usePlatformFeePercentage()
  const { minimumAmount, isLoading: loadingMinAmount } = useMinimumBountyAmount()
  const { maxDuration, isLoading: loadingMaxDuration } = useMaximumClaimDuration()
  const { feeRecipient, isLoading: loadingFeeRecipient } = useFeeRecipient()
  const { isPaused, isLoading: loadingPaused } = useIsPaused()

  // Calculate statistics
  const totalCreated = bountyIds?.length || 0
  const contributionPercentage = React.useMemo(() => {
    if (loadingTotal || loadingBounties) return 0
    const total = Number(totalBounties) || 0
    return total > 0 ? Math.round((totalCreated / total) * 100) : 0
  }, [totalCreated, totalBounties, loadingTotal, loadingBounties])

  // Calculate total value of maintainer's bounties
  const totalValueCreated = React.useMemo(() => {
    if (!bountyIds || !allBounties) return BigInt(0)
    
    return bountyIds.reduce((acc: bigint, bountyId: bigint) => {
      const bounty = allBounties.find(b => b.id === bountyId)
      return bounty ? acc + bounty.rewardAmount : acc
    }, BigInt(0))
  }, [bountyIds, allBounties])

  // Calculate active vs completed bounties
  const { activeBounties, completedBounties } = React.useMemo(() => {
    if (!bountyIds || !allBounties) return { activeBounties: 0, completedBounties: 0 }
    
    let active = 0
    let completed = 0
    
    bountyIds.forEach((bountyId: bigint) => {
      const bounty = allBounties.find(b => b.id === bountyId)
      if (bounty) {
        if (bounty.status === 2) { // Assuming 2 is completed status
          completed++
        } else if (bounty.status === 0 || bounty.status === 1) { // Active or claimed
          active++
        }
      }
    })
    
    return { activeBounties: active, completedBounties: completed }
  }, [bountyIds, allBounties])

  const isLoading = loadingTotal || loadingBounties || loadingAllBounties

  if (!address) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card col-span-full bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-white/80">
              Please connect your wallet to view your maintainer dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-6">
      {/* Verifier Role Card - Always show first */}
      <VerifierRoleCard />
      
      {/* Bounties Created */}
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Bounties Created</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : totalCreated}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconPlus className="w-3 h-3" />
              Created
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            {contributionPercentage}% of platform <IconChartLine className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Your contribution to the bounty ecosystem
          </div>
        </CardFooter>
      </Card>
      
      {/* Total Value Created */}
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Total Value Created</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {isLoading ? "..." : `${parseFloat(formatEther(totalValueCreated)).toFixed(2)} AVAX`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconCoin className="w-3 h-3" />
              Value
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Across {totalCreated} bounties <IconCoin className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Total AVAX allocated for bounties
          </div>
        </CardFooter>
      </Card>

      {/* Active vs Completed */}
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Bounty Status</CardDescription>
          <CardTitle className="text-lg font-semibold text-white">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Active:</span>
                <span>{activeBounties}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completed:</span>
                <span>{completedBounties}</span>
              </div>
            </div>
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconUsers className="w-3 h-3" />
              Status
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            {completedBounties > 0 ? Math.round((completedBounties / totalCreated) * 100) : 0}% completion rate <IconChartLine className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Success rate of your bounties
          </div>
        </CardFooter>
      </Card>

      {/* Platform Settings */}
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Platform Settings</CardDescription>
          <CardTitle className="text-lg font-semibold text-white">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Fee:</span>
                <span>{loadingFee ? "..." : `${Number(feePercentage || 0) / 100}%`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Min:</span>
                <span>{loadingMinAmount ? "..." : `${parseFloat(formatEther(minimumAmount || BigInt(0))).toFixed(2)}`}</span>
              </div>
            </div>
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
              <IconSettings className="w-3 h-3" />
              Config
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Platform configuration <IconSettings className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            Current platform parameters
          </div>
        </CardFooter>
      </Card>

      {/* Platform Status */}
      <Card className="@container/card bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Platform Status</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
            {loadingPaused ? "..." : (isPaused ? "PAUSED" : "ACTIVE")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`${isPaused ? 'bg-orange-500/20 text-orange-200 border-orange-400/50' : 'bg-green-500/20 text-green-200 border-green-400/50'}`}>
              {isPaused ? <IconPlayerPause className="w-3 h-3" /> : <IconBadge className="w-3 h-3" />}
              {isPaused ? "Paused" : "Running"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Platform operational status <IconChartLine className="size-4 text-red-400" />
          </div>
          <div className="text-white/60">
            {isPaused ? "Platform is currently paused" : "Platform is operational"}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}