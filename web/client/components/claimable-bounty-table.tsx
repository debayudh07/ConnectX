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
import { BOUNTY_STATUS } from "@/contractsABI/contractTypes"
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
      const result = await claimBounty({ bountyId })
      toast.success("🎉 Bounty claim transaction initiated! Check your wallet for confirmation.")
    } catch (error: any) {
      console.error('Error claiming bounty:', error)
      
      if (error?.message?.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error('💰 Insufficient funds for gas fee')
      } else if (error?.message?.includes('bounty not available')) {
        toast.error('⚠️ Bounty is not available for claiming')
      } else if (error?.message?.includes('deadline passed')) {
        toast.error('⏰ Bounty deadline has passed')
      } else if (error?.message?.includes('already claimed')) {
        toast.error('🔒 Bounty has already been claimed')
      } else if (error?.message?.includes('maintainer cannot claim')) {
        toast.error('🚫 Maintainers cannot claim their own bounties')
      } else {
        toast.error(`❌ Error claiming bounty: ${error?.message || 'Unknown error'}`)
      }
    } finally {
      setClaimingBountyId(null)
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN:
        return <Badge className="bg-red-500/20 text-red-200 border-red-400/50">Open</Badge>
      case BOUNTY_STATUS.CLAIMED:
        return <Badge className="bg-red-400/20 text-red-300 border-red-300/50">Claimed</Badge>
      case BOUNTY_STATUS.SUBMITTED:
        return <Badge className="bg-red-600/20 text-red-200 border-red-500/50">Submitted</Badge>
      case BOUNTY_STATUS.VERIFIED:
        return <Badge className="bg-red-700/20 text-red-300 border-red-600/50">Verified</Badge>
      case BOUNTY_STATUS.PAID:
        return <Badge className="bg-red-500/30 text-red-100 border-red-400/60">Completed</Badge>
      case BOUNTY_STATUS.DISPUTED:
        return <Badge className="bg-red-800/40 text-red-100 border-red-700/60">Disputed</Badge>
      case BOUNTY_STATUS.CANCELLED:
        return <Badge className="bg-red-900/40 text-red-200 border-red-800/60">Cancelled</Badge>
      default:
        return <Badge className="bg-white/20 text-white/60 border-white/40">Unknown</Badge>
    }
  }

  const canClaimBounty = (bounty: any) => {
    if (!address || !bounty) return false
    
    // Check if bounty is open
    if (bounty.status !== BOUNTY_STATUS.OPEN) return false
    
    // Check if user is not the maintainer
    if (bounty.maintainer.toLowerCase() === address.toLowerCase()) return false
    
    // Check if deadline hasn't passed
    if (Number(bounty.deadline) * 1000 <= Date.now()) return false
    
    // Check if not already claimed
    if (bounty.claimedBy !== '0x0000000000000000000000000000000000000000') return false
    
    return true
  }

  const getTimeRemaining = (deadline: bigint) => {
    const now = Date.now()
    const deadlineMs = Number(deadline) * 1000
    const diff = deadlineMs - now
    
    if (diff <= 0) return "Expired"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Available Bounties</CardTitle>
          <CardDescription className="text-white/80">Browse and claim available bounties</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-white/60">Loading bounties...</div>
        </CardContent>
      </Card>
    )
  }

  const claimableBounties = bounties?.filter(bounty => 
    bounty.status === BOUNTY_STATUS.OPEN && 
    bounty.maintainer.toLowerCase() !== address?.toLowerCase() &&
    Number(bounty.deadline) * 1000 > Date.now()
  ) || []

  // Prioritize claimable bounties first, then recent ones
  const sortedBounties = bounties ? [...bounties].sort((a, b) => {
    const aCanClaim = canClaimBounty(a) ? 1 : 0
    const bCanClaim = canClaimBounty(b) ? 1 : 0
    
    // First sort by claimability
    if (aCanClaim !== bCanClaim) {
      return bCanClaim - aCanClaim
    }
    
    // Then by creation time (newest first)
    return Number(b.createdAt) - Number(a.createdAt)
  }).slice(0, 15) : [] // Show top 15 bounties

  return (
    <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          🎯 Available Bounties 
          <Badge variant="secondary" className="bg-red-500/20 text-red-200 border-red-400/50">
            {claimableBounties.length} Claimable
          </Badge>
        </CardTitle>
        <CardDescription className="text-white/80">
          Browse and claim available bounties. {address ? 
            `${claimableBounties.length} bounties available for you to claim.` : 
            "Connect your wallet to claim bounties."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-white/80">Bounty</TableHead>
              <TableHead className="text-white/80">Status</TableHead>
              <TableHead className="text-white/80">Reward</TableHead>
              <TableHead className="text-white/80">Deadline</TableHead>
              <TableHead className="text-white/80">Difficulty</TableHead>
              <TableHead className="text-right text-white/80">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBounties.length === 0 ? (
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="space-y-2">
                    <div className="text-white/60">No bounties available</div>
                    {!address && (
                      <div className="text-sm text-red-300">
                        Connect your wallet to see claimable bounties
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedBounties.map((bounty: any) => (
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
                    {canClaimBounty(bounty) ? (
                      <Button
                        onClick={() => handleClaimBounty(bounty.id)}
                        disabled={isPending || isConfirming || claimingBountyId === bounty.id}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg transition-all duration-200"
                        size="sm"
                      >
                        {claimingBountyId === bounty.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Claiming...
                          </>
                        ) : (
                          <>
                            🎯 Claim Bounty
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className={`
                          ${bounty.maintainer.toLowerCase() === address?.toLowerCase()
                            ? "text-blue-600 border-blue-300 bg-blue-50"
                            : Number(bounty.deadline) * 1000 <= Date.now()
                            ? "text-red-600 border-red-300 bg-red-50"
                            : bounty.status !== BOUNTY_STATUS.OPEN
                            ? "text-gray-600 border-gray-300 bg-gray-50"
                            : "text-orange-600 border-orange-300 bg-orange-50"
                          }
                        `}
                      >
                        {bounty.maintainer.toLowerCase() === address?.toLowerCase()
                          ? "👨‍💻 Your bounty"
                          : Number(bounty.deadline) * 1000 <= Date.now()
                          ? "⏰ Expired"
                          : bounty.status !== BOUNTY_STATUS.OPEN
                          ? "🔒 Unavailable"
                          : "❌ Not claimable"}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}