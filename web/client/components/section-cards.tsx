"use client"

import * as React from "react"
import { IconActivity, IconCoins, IconBadge, IconTarget, IconAward } from "@tabler/icons-react"
import { formatEther } from "viem"
import {
  usePlatformFeePercentage,
  useMinimumBountyAmount,
  useIsPaused,
  useDeveloperBadgeQueries
} from "@/contractsABI/contractHooks"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  // Platform configuration and status
  const { feePercentage } = usePlatformFeePercentage()
  const { minimumAmount } = useMinimumBountyAmount()
  const { isPaused } = useIsPaused()
  
  // Mock developer address for getting badge stats
  const mockAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`
  const { badgeCount: totalBadges } = useDeveloperBadgeQueries(mockAddress)

  // Platform metrics
  const platformData = [
    {
      title: "Platform Status",
      value: isPaused ? "Paused" : "Active",
      description: isPaused ? "Platform operations paused" : "Platform running normally",
      icon: IconActivity,
      status: isPaused ? "warning" : "success"
    },
    {
      title: "Platform Fee",
      value: feePercentage ? `${Number(feePercentage) / 100}%` : "Loading...",
      description: "Fee charged on bounty payments",
      icon: IconCoins,
      status: "neutral"
    },
    {
      title: "Badge System",
      value: "Active",
      description: "Developer achievement system",
      icon: IconBadge,
      status: "success"
    },
    {
      title: "Total Badges",
      value: totalBadges?.toString() || "0",
      description: "Badges earned by developers",
      icon: IconAward,
      status: "success"
    },
    {
      title: "Min Bounty",
      value: minimumAmount ? `${formatEther(minimumAmount)} ETH` : "Loading...",
      description: "Minimum bounty amount",
      icon: IconTarget,
      status: "neutral"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-blue-600 dark:text-blue-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {platformData.map((item, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${getStatusColor(item.status)}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(item.status)}`}>
                  {item.value}
                </div>
                <Badge className={getStatusBadgeColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
