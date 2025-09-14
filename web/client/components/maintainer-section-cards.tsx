"use client"

import { useAccount } from 'wagmi';
import { useTotalBounties, useMaintainerBounties } from '@/contractsABI/contractHooks';

export function MaintainerSectionCards() {
  const { address } = useAccount();
  
  // Get total bounties count
  const { totalBounties, isLoading: loadingTotal } = useTotalBounties();
  
  // Get maintainer's bounties
  const { bountyIds, isLoading: loadingBounties } = useMaintainerBounties(address || '0x0');

  // Calculate statistics
  const totalCreated = bountyIds?.length || 0;
  const contributionPercentage = (() => {
    if (loadingTotal || loadingBounties) return 0;
    const total = Number(totalBounties) || 0;
    return total > 0 ? Math.round((totalCreated / total) * 100) : 0;
  })();

  return (
    <div className="px-4 lg:px-6">
      <div
        className="grid auto-rows-min gap-4 md:grid-cols-3"
        data-slot="grid"
      >
        <div
          className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm text-white shadow relative overflow-hidden rounded-xl"
          data-slot="card"
        >
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-white/80">
              Bounties Created
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-red-400"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-white">
              {loadingBounties ? '...' : totalCreated.toString()}
            </div>
            <p className="text-xs text-white/60">
              {totalCreated > 0 ? '+12% from last month' : 'Create your first bounty'}
            </p>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm text-white shadow relative overflow-hidden rounded-xl"
          data-slot="card"
        >
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-white/80">
              Network Total
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-red-400"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-white">
              {loadingTotal ? '...' : totalBounties?.toString() || '0'}
            </div>
            <p className="text-xs text-white/60">
              Total bounties on platform
            </p>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm text-white shadow relative overflow-hidden rounded-xl"
          data-slot="card"
        >
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-white/80">
              Your Contribution
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-red-400"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-white">
              {contributionPercentage}%
            </div>
            <p className="text-xs text-white/60">
              Of platform&apos;s total bounties
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}