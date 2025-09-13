"use client"

import { formatEther } from "viem"
import { useAllBounties } from "@/contractsABI/contractHooks"
import { Badge } from "@/components/ui/badge"
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

const statusMap = {
  0: { label: "Open", variant: "outline" as const, color: "bg-red-500/20 text-red-200 border-red-400/50" },
  1: { label: "Assigned", variant: "secondary" as const, color: "bg-red-400/20 text-red-300 border-red-300/50" },
  2: { label: "Submitted", variant: "outline" as const, color: "bg-red-600/20 text-red-200 border-red-500/50" },
  3: { label: "Under Review", variant: "outline" as const, color: "bg-red-700/20 text-red-300 border-red-600/50" },
  4: { label: "Completed", variant: "outline" as const, color: "bg-red-500/30 text-red-100 border-red-400/60" },
  5: { label: "Disputed", variant: "destructive" as const, color: "bg-red-800/40 text-red-100 border-red-700/60" }
}

export function ConnectXBountyTable() {
  const { bounties, isLoading } = useAllBounties()

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Recent Bounties</CardTitle>
          <CardDescription className="text-white/80">Latest bounty activities on ConnectX</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-white/60">Loading bounties...</div>
        </CardContent>
      </Card>
    )
  }

  const recentBounties = bounties?.slice(0, 10) || []

  return (
    <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Recent Bounties</CardTitle>
        <CardDescription className="text-white/80">
          Latest bounty activities and their current status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-white/80">ID</TableHead>
              <TableHead className="text-white/80">Title</TableHead>
              <TableHead className="text-white/80">Reward</TableHead>
              <TableHead className="text-white/80">Status</TableHead>
              <TableHead className="text-white/80">Developer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBounties.length === 0 ? (
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableCell colSpan={5} className="text-center text-white/60 py-8">
                  No bounties found. Be the first to create one!
                </TableCell>
              </TableRow>
            ) : (
              recentBounties.map((bounty) => {
                const status = statusMap[bounty.status as keyof typeof statusMap] || statusMap[0]
                const isAssigned = bounty.claimedBy !== '0x0000000000000000000000000000000000000000'
                
                return (
                  <TableRow key={bounty.id.toString()} className="border-white/20 hover:bg-white/5">
                    <TableCell className="font-mono text-sm text-white">
                      #{bounty.id.toString()}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate text-white">
                      {bounty.description || `Bounty #${bounty.id.toString()}`}
                    </TableCell>
                    <TableCell className="font-mono text-white">
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
                    <TableCell className="text-sm text-white/60">
                      {isAssigned ? (
                        <span className="font-mono text-xs">
                          {bounty.claimedBy.slice(0, 8)}...{bounty.claimedBy.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-white/60">Unassigned</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}