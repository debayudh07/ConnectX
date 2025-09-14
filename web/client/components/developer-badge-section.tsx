"use client"

import * as React from "react"
import { IconBadge, IconCalendar, IconExternalLink, IconStar, IconCode, IconTrophy } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { 
  useDeveloperBadgeQueries,
  useDeveloperBadgeRead,
  useBadgeData 
} from "@/contractsABI/contractHooks"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface BadgeDetailCardProps {
  badgeId: bigint
}

function BadgeDetailCard({ badgeId }: BadgeDetailCardProps) {
  const { isLoading } = useBadgeData(badgeId)
  const badgeRead = useDeveloperBadgeRead()
  const badgeDetails = badgeRead.getBadgeDetails(badgeId)

  if (isLoading || badgeDetails.isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-6 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!badgeDetails.data) return null

  const badgeInfo = badgeDetails.data
  const difficultyLabels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  const typeLabels = ['Completion', 'Streak', 'Special', 'Achievement']
  
  return (
    <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border backdrop-blur-sm hover:border-red-400/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconBadge className="w-5 h-5 text-red-400" />
            <CardTitle className="text-white text-sm font-semibold">
              {badgeInfo.achievementName || `Badge #${badgeId.toString()}`}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50 text-xs">
            {typeLabels[Number(badgeInfo.badgeType)] || 'Unknown'}
          </Badge>
        </div>
        {badgeInfo.rewardAmount > 0 && (
          <CardDescription className="text-white/80 text-sm">
            Reward: {parseFloat(formatEther(badgeInfo.rewardAmount)).toFixed(3)} AVAX
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {badgeInfo.skills && (
          <div>
            <div className="text-xs text-white/60 mb-1">Skills</div>
            <div className="text-sm text-white">{badgeInfo.skills}</div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-white/60 mb-1">Difficulty</div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
              {difficultyLabels[Number(badgeInfo.difficultyLevel)] || 'Unknown'}
            </Badge>
          </div>
          <div>
            <div className="text-white/60 mb-1">Completed</div>
            <div className="text-white">
              {new Date(Number(badgeInfo.completedAt) * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>

        {(badgeInfo.githubIssueUrl || badgeInfo.repositoryUrl) && (
          <div className="flex gap-2 pt-2">
            {badgeInfo.githubIssueUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                asChild
              >
                <a href={badgeInfo.githubIssueUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="w-3 h-3 mr-1" />
                  Issue
                </a>
              </Button>
            )}
            {badgeInfo.repositoryUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                asChild
              >
                <a href={badgeInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="w-3 h-3 mr-1" />
                  Repo
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DeveloperBadgeSection() {
  const { address } = useAccount()
  const userAddress = address || '0x0000000000000000000000000000000000000000'
  
  const { 
    badgeCount, 
    developerBadges, 
    isLoading 
  } = useDeveloperBadgeQueries(userAddress)

  if (!address) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Achievement Badges</CardTitle>
          <CardDescription className="text-white/80">
            Please connect your wallet to view your badges
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Achievement Badges</CardTitle>
          <CardDescription className="text-white/80">Loading badges...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/10 rounded-lg h-32"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const badgeIds = developerBadges || []

  return (
    <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <IconTrophy className="w-5 h-5 text-red-400" />
              Achievement Badges
            </CardTitle>
            <CardDescription className="text-white/80">
              Your earned achievement badges ({Number(badgeCount || 0)} total)
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400/50">
            {Number(badgeCount || 0)} Badges
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {badgeIds.length === 0 ? (
          <div className="text-center py-8">
            <IconBadge className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <div className="text-white/60">No badges earned yet</div>
            <div className="text-white/40 text-sm">Complete bounties to earn your first badge!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgeIds.map((badgeId: bigint) => (
              <BadgeDetailCard key={badgeId.toString()} badgeId={badgeId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}