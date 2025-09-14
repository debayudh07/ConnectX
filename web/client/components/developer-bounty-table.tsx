"use client"

import * as React from "react"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useDeveloperClaims, useDeveloperCompletions, useAllBounties } from "@/contractsABI/contractHooks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { IconExternalLink, IconCode, IconCheck } from "@tabler/icons-react"
import { SubmitWorkModal } from "@/components/submit-work-modal"
import { BountyStructure } from "@/contractsABI/contractTypes"

const statusMap = {
  0: { label: "Open", variant: "outline" as const, color: "bg-red-500/20 text-red-200 border-red-400/50" },
  1: { label: "Assigned", variant: "secondary" as const, color: "bg-red-400/20 text-red-300 border-red-300/50" },
  2: { label: "Submitted", variant: "outline" as const, color: "bg-red-600/20 text-red-200 border-red-500/50" },
  3: { label: "Under Review", variant: "outline" as const, color: "bg-red-700/20 text-red-300 border-red-600/50" },
  4: { label: "Completed", variant: "outline" as const, color: "bg-red-500/30 text-red-100 border-red-400/60" },
  5: { label: "Disputed", variant: "destructive" as const, color: "bg-red-800/40 text-red-100 border-red-700/60" }
}

export function DeveloperBountyTable() {
  const { address } = useAccount()
  const { claimedBountyIds, isLoading: loadingClaims } = useDeveloperClaims(address || '0x0000000000000000000000000000000000000000')
  const { completedBountyIds, isLoading: loadingCompletions } = useDeveloperCompletions(address || '0x0000000000000000000000000000000000000000')
  const { bounties: allBounties, isLoading: loadingBounties } = useAllBounties()

  // Filter bounties based on developer's involvement
  const claimedBounties = React.useMemo(() => {
    if (!claimedBountyIds || !allBounties) return []
    return allBounties.filter(bounty => claimedBountyIds.includes(bounty.id))
  }, [claimedBountyIds, allBounties])

  const completedBounties = React.useMemo(() => {
    if (!completedBountyIds || !allBounties) return []
    return allBounties.filter(bounty => completedBountyIds.includes(bounty.id))
  }, [completedBountyIds, allBounties])

  // Get bounties in different states
  const activeBounties = claimedBounties.filter(bounty => bounty.status === 1) // Assigned
  const submittedBounties = claimedBounties.filter(bounty => bounty.status === 2) // Submitted
  const reviewBounties = claimedBounties.filter(bounty => bounty.status === 3) // Under Review

  const isLoading = loadingClaims || loadingCompletions || loadingBounties

  if (!address) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Connect Your Wallet</CardTitle>
          <CardDescription className="text-white/80">
            Please connect your wallet to view your bounties
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">My Bounties</CardTitle>
          <CardDescription className="text-white/80">Loading your bounty data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-white/60">Loading bounties...</div>
        </CardContent>
      </Card>
    )
  }

  const renderBountyTable = (bounties: BountyStructure[], showActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Reward</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>GitHub</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bounties.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground py-8">
              No bounties found in this category
            </TableCell>
          </TableRow>
        ) : (
          bounties.map((bounty) => {
            const status = statusMap[bounty.status as keyof typeof statusMap] || statusMap[0]
            
            return (
              <TableRow key={bounty.id.toString()}>
                <TableCell className="font-mono text-sm">
                  #{bounty.id.toString()}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {bounty.description || `Bounty #${bounty.id.toString()}`}
                </TableCell>
                <TableCell className="font-mono">
                  {parseFloat(formatEther(bounty.rewardAmount)).toFixed(3)} AVAX
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={status.variant}
                    className={status.color}
                  >
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {bounty.githubIssueUrl && (
                    <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-500">
                      <a href={bounty.githubIssueUrl} target="_blank" rel="noopener noreferrer">
                        <IconExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      {bounty.status === 1 && (
                        <SubmitWorkModal bounty={bounty}>
                          <Button size="sm" variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0">
                            <IconCode className="w-4 h-4 mr-1" />
                            Submit Work
                          </Button>
                        </SubmitWorkModal>
                      )}
                      {bounty.status === 2 && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" disabled>
                          <IconCheck className="w-4 h-4 mr-1" />
                          Submitted
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )

  return (
    <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">My Bounties</CardTitle>
        <CardDescription className="text-white/80">
          Manage your claimed and completed bounties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({activeBounties.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({submittedBounties.length})
            </TabsTrigger>
            <TabsTrigger value="review">
              Review ({reviewBounties.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedBounties.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            {renderBountyTable(activeBounties, true)}
          </TabsContent>
          
          <TabsContent value="submitted" className="mt-4">
            {renderBountyTable(submittedBounties)}
          </TabsContent>
          
          <TabsContent value="review" className="mt-4">
            {renderBountyTable(reviewBounties)}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {renderBountyTable(completedBounties)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}