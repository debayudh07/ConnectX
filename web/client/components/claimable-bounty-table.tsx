'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAllBounties, useBountyMarketplace, useTransactionStatus } from "@/contractsABI/contractHooks"
import { BOUNTY_STATUS, BountyStructure } from "@/contractsABI/contractTypes"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { toast } from "sonner"
import { useState, useEffect } from "react"

export function ClaimableBountyTable() {
  const { address } = useAccount()
  const { bounties, isLoading } = useAllBounties()
  const { claimBounty, hash, isPending } = useBountyMarketplace()
  const { isConfirming, isConfirmed } = useTransactionStatus(hash)
  const [claimingBountyId, setClaimingBountyId] = useState<bigint | null>(null)

  // Show success message when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && claimingBountyId) {
      toast.success(`🎉 Successfully claimed Bounty #${claimingBountyId}! The bounty is now assigned to you.`)
      setClaimingBountyId(null)
    }
  }, [isConfirmed, claimingBountyId])

  const handleClaimBounty = async (bountyId: bigint) => {
    if (!address) {
      toast.error("Please connect your wallet to claim bounties")
      return
    }

    try {
      setClaimingBountyId(bountyId)
      await claimBounty({ bountyId })
      toast.success("🎉 Bounty claim transaction initiated! Check your wallet for confirmation.")
    } catch (error: unknown) {
      console.error('Error claiming bounty:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('💰 Insufficient funds for gas fee')
      } else if (errorMessage.includes('bounty not available')) {
        toast.error('⚠️ Bounty is not available for claiming')
      } else if (errorMessage.includes('deadline passed')) {
        toast.error('⏰ This bounty has already passed its deadline')
      } else {
        toast.error(`❌ Error claiming bounty: ${errorMessage || 'Unknown error'}`)
      }
    } finally {
      setClaimingBountyId(null)
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-500/20">🟢 Open</Badge>
      case BOUNTY_STATUS.CLAIMED:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-400/20">🟡 Claimed</Badge>
      case BOUNTY_STATUS.SUBMITTED:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-600/20">🔄 Under Review</Badge>
      case BOUNTY_STATUS.VERIFIED:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-700/20">✅ Verified</Badge>
      case BOUNTY_STATUS.PAID:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-800/20">💰 Paid</Badge>
      case BOUNTY_STATUS.DISPUTED:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-500/20">⚠️ Disputed</Badge>
      case BOUNTY_STATUS.CANCELLED:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-300/20">❌ Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-300/20">❓ Unknown</Badge>
    }
  }

  const getTimeRemaining = (deadline: bigint) => {
    const now = Date.now() / 1000
    const timeLeft = Number(deadline) - now
    
    if (timeLeft <= 0) {
      return <span className="text-red-400">⏰ Expired</span>
    }
    
    const days = Math.floor(timeLeft / (24 * 60 * 60))
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
    
    if (days > 0) {
      return <span className="text-white">{days}d {hours}h</span>
    } else if (hours > 0) {
      return <span className="text-white">{hours}h</span>
    } else {
      const minutes = Math.floor((timeLeft % (60 * 60)) / 60)
      return <span className="text-yellow-400">{minutes}m</span>
    }
  }

  const canClaimBounty = (bounty: BountyStructure) => {
    const now = Date.now() / 1000
    const isExpired = Number(bounty.deadline) <= now
    const isOpen = bounty.status === BOUNTY_STATUS.OPEN
    const isNotCreator = address && bounty.maintainer.toLowerCase() !== address.toLowerCase()
    const isNotClaimed = bounty.claimedBy === '0x0000000000000000000000000000000000000000'
    
    return isOpen && !isExpired && isNotCreator && isNotClaimed
  }

  const claimableBounties = bounties?.filter((bounty: BountyStructure) => canClaimBounty(bounty)) || []

  if (isLoading) {
    return (
      <Card className="border-white/20 bg-gradient-to-br from-red-950/20 to-red-900/10 text-white">
        <CardHeader>
          <CardTitle className="text-white">Available Bounties</CardTitle>
          <CardDescription className="text-white/60">
            Loading bounties you can claim...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-white/60">Loading bounties...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/20 bg-gradient-to-br from-red-950/20 to-red-900/10 text-white">
      <CardHeader>
        <CardTitle className="text-white">Available Bounties</CardTitle>
        <CardDescription className="text-white/60">
          Bounties you can claim and work on
        </CardDescription>
      </CardHeader>
      <CardContent>
        {claimableBounties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60 mb-2">No bounties available to claim</p>
            <p className="text-white/40 text-sm">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-white/5">
                  <TableHead className="text-white font-semibold">Bounty Details</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold">Reward</TableHead>
                  <TableHead className="text-white font-semibold">Time Left</TableHead>
                  <TableHead className="text-white font-semibold">Difficulty</TableHead>
                  <TableHead className="text-white font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claimableBounties.map((bounty: BountyStructure) => (
                  <TableRow 
                    key={bounty.id.toString()}
                    className={canClaimBounty(bounty) ? "bg-red-500/10 hover:bg-red-500/20 border-white/20" : "border-white/20 hover:bg-white/5"}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-white">Bounty #{bounty.id.toString()}</div>
                          {canClaimBounty(bounty) && (
                            <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-500/20">
                              ✨ Claimable
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-white/60 line-clamp-1">
                          {bounty.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(bounty.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">
                        {formatEther(bounty.rewardAmount)} AVAX
                      </div>
                      <div className="text-xs text-white/60">
                        ${(parseFloat(formatEther(bounty.rewardAmount)) * 30).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {getTimeRemaining(bounty.deadline)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-200 border-red-400/50 bg-red-500/20">
                        ⭐ {bounty.difficultyLevel.toString()}/5
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleClaimBounty(bounty.id)}
                        disabled={isPending || isConfirming || claimingBountyId === bounty.id}
                        variant="outline"
                        size="sm"
                        className="border-red-400/50 text-red-200 hover:bg-red-500/20 hover:text-white disabled:opacity-50"
                      >
                        {(isPending || isConfirming) && claimingBountyId === bounty.id ? 
                          'Claiming...' : 
                          '🎯 Claim Bounty'
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}