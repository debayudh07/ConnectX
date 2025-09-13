"use client"

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'

export type UserRole = 'developer' | 'maintainer' | 'both'

export function useNavigation() {
  const { isConnected } = useAccount()
  const router = useRouter()

  const navigateToDashboard = (role: UserRole = 'developer') => {
    if (!isConnected) {
      // Could redirect to connect wallet page or show modal
      return
    }

    switch (role) {
      case 'developer':
        router.push('/bounties/developer-dashboard')
        break
      case 'maintainer':
        router.push('/bounties/maintainer-dashboard')
        break
      case 'both':
        // Could show a role selection modal or default to one
        router.push('/dashboard')
        break
      default:
        router.push('/dashboard')
    }
  }

  const navigateToCreateBounty = () => {
    if (!isConnected) {
      return
    }
    router.push('/bounties/create-bounties')
  }

  const navigateToViewBounties = () => {
    router.push('/bounties/view-bounties')
  }

  return {
    navigateToDashboard,
    navigateToCreateBounty,
    navigateToViewBounties,
    isConnected
  }
}

// Navigation configuration based on user state
export const getNavigationConfig = (isConnected: boolean) => {
  const baseConfig = {
    navMain: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: "IconDashboard",
      },
      {
        title: "View Bounties",
        url: "/bounties/view-bounties", 
        icon: "IconTrophy",
      },
    ]
  }

  if (isConnected) {
    return {
      ...baseConfig,
      navMain: [
        ...baseConfig.navMain,
        {
          title: "Developer Dashboard",
          url: "/bounties/developer-dashboard",
          icon: "IconCode",
        },
        {
          title: "Maintainer Dashboard", 
          url: "/bounties/maintainer-dashboard",
          icon: "IconGavel",
        },
      ]
    }
  }

  return baseConfig
}