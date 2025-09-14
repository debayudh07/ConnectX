"use client"

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
  useMaintainerBounties, 
  useBountyData, 
  useBountySubmissions 
} from '@/contractsABI/contractHooks';
import { BOUNTY_STATUS } from '@/contractsABI/contractTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifyWorkModal } from '@/components/verify-work-modal';
import { CancelBountyModal } from '@/components/cancel-bounty-modal';
import { VerifierButton } from '@/components/verifier-button';
import { VerifyButtonWrapper } from '@/components/verify-button-wrapper';
import { IconCheck, IconX, IconExternalLink, IconClock, IconAlertTriangle } from '@tabler/icons-react';

export function MaintainerBountyTable() {
  const { address } = useAccount();
  const { bountyIds, isLoading } = useMaintainerBounties(address || '0x0');

  if (isLoading) {
    return (
      <div
        className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm shadow rounded-xl overflow-hidden"
        data-slot="card"
      >
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 text-white">Your Bounties</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-white/20 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bountyIds || bountyIds.length === 0) {
    return (
      <div
        className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-white/20 border-2 backdrop-blur-sm shadow rounded-xl overflow-hidden"
        data-slot="card"
      >
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 text-white">Your Bounties</h3>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg">You haven&apos;t created any bounties yet.</p>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Create your first bounty to get started!
            </p>
            <a
              href="/bounties/create-bounties"
              className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Your First Bounty</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-card text-card-foreground shadow rounded-xl border overflow-hidden"
      data-slot="card"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Your Bounties</h3>
          <div className="flex items-center space-x-3">
            <VerifierButton />
            <a
              href="/bounties/create-bounties"
              className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Bounty</span>
            </a>
          </div>
        </div>
        <div className="space-y-4">
          {bountyIds.map((bountyId) => (
            <MaintainerBountyCard key={bountyId.toString()} bountyId={bountyId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MaintainerBountyCard({ bountyId }: { bountyId: bigint }) {
  const { bounty, isLoading } = useBountyData(bountyId);
  const { submissions, isLoading: loadingSubmissions } = useBountySubmissions(bountyId);
  const [showSubmissions, setShowSubmissions] = useState(false);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="flex justify-between items-start space-x-4 mb-4">
          <div className="flex-1">
            <div className="h-6 bg-muted rounded w-1/2 mb-3"></div>
            <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="h-8 bg-muted rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive">Bounty #{bountyId.toString()} not found</p>
      </div>
    );
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'Open';
      case BOUNTY_STATUS.CLAIMED: return 'Claimed';
      case BOUNTY_STATUS.SUBMITTED: return 'Submitted';
      case BOUNTY_STATUS.VERIFIED: return 'Verified';
      case BOUNTY_STATUS.PAID: return 'Completed';
      case BOUNTY_STATUS.DISPUTED: return 'Disputed';
      case BOUNTY_STATUS.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case BOUNTY_STATUS.OPEN: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case BOUNTY_STATUS.CLAIMED: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case BOUNTY_STATUS.SUBMITTED: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case BOUNTY_STATUS.VERIFIED: return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case BOUNTY_STATUS.PAID: return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case BOUNTY_STATUS.DISPUTED: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case BOUNTY_STATUS.CANCELLED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              #{bountyId.toString()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bounty.status)}`}>
              {getStatusText(bounty.status)}
            </span>
          </div>
          <h4 className="text-lg font-semibold mb-2">
            Bounty #{bountyId.toString()}
          </h4>
          <p className="text-muted-foreground mb-2">{bounty.description}</p>
          <p className="text-sm text-muted-foreground truncate">{bounty.repositoryUrl}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end mb-2">
            <svg className="w-5 h-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatEther(bounty.rewardAmount)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">AVAX</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Deadline</p>
          <p className="text-sm">{new Date(Number(bounty.deadline) * 1000).toLocaleDateString()}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Claimed By</p>
          <p className="text-sm font-mono">
            {bounty.claimedBy !== '0x0000000000000000000000000000000000000000' 
              ? `${bounty.claimedBy.slice(0, 6)}...${bounty.claimedBy.slice(-4)}` 
              : 'Not claimed'}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Submissions</p>
          <p className="text-sm">
            {loadingSubmissions ? 'Loading...' : (submissions?.length || 0)} submission(s)
          </p>
        </div>
      </div>

      {/* Skills Required */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Skills Required:</p>
        <div className="flex flex-wrap gap-2">
          {bounty.requiredSkills.map((skill: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Submissions Toggle */}
      {submissions && submissions.length > 0 && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowSubmissions(!showSubmissions)}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showSubmissions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{showSubmissions ? 'Hide' : 'Show'} Submissions ({submissions.length})</span>
          </button>
          
          {showSubmissions && (
            <div className="mt-4 space-y-3">
              {submissions.map((submission, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium mb-1">
                        Developer: <span className="font-mono text-primary">{submission.developer.slice(0, 6)}...{submission.developer.slice(-4)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">{submission.description}</p>
                      {submission.prUrl && (
                        <a 
                          href={submission.prUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <span>View PR</span>
                          <IconExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        submission.isVerified 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                      }`}>
                        {submission.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      
                      {/* Verification Action Button */}
                      {!submission.isVerified && bounty.status === BOUNTY_STATUS.SUBMITTED && (
                        <VerifyButtonWrapper>
                          <VerifyWorkModal bounty={bounty} submission={submission}>
                            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                              <IconCheck className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          </VerifyWorkModal>
                        </VerifyButtonWrapper>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted on {new Date(Number(submission.submittedAt) * 1000).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {bounty.status === BOUNTY_STATUS.OPEN && "Waiting for developers to claim"}
            {bounty.status === BOUNTY_STATUS.CLAIMED && "Waiting for work submission"}
            {bounty.status === BOUNTY_STATUS.SUBMITTED && "Ready for review"}
            {bounty.status === BOUNTY_STATUS.VERIFIED && "Verified, payment processed"}
            {bounty.status === BOUNTY_STATUS.PAID && "Completed successfully"}
            {bounty.status === BOUNTY_STATUS.DISPUTED && "Under dispute review"}
            {bounty.status === BOUNTY_STATUS.CANCELLED && "Bounty cancelled"}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Time-sensitive indicators */}
            {bounty.status === BOUNTY_STATUS.CLAIMED && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                <IconClock className="w-3 h-3 mr-1" />
                In Progress
              </Badge>
            )}
            
            {bounty.status === BOUNTY_STATUS.SUBMITTED && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <IconAlertTriangle className="w-3 h-3 mr-1" />
                Needs Review
              </Badge>
            )}

            {/* Cancel Button - Only for Open or expired Claimed bounties */}
            {(bounty.status === BOUNTY_STATUS.OPEN || 
              (bounty.status === BOUNTY_STATUS.CLAIMED && 
               bounty.claimedBy !== '0x0000000000000000000000000000000000000000')) && (
              <CancelBountyModal bounty={bounty}>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                  <IconX className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </CancelBountyModal>
            )}

            {/* Quick Verify Button for Submitted Work */}
            {bounty.status === BOUNTY_STATUS.SUBMITTED && submissions && submissions.length > 0 && (
              <VerifyButtonWrapper>
                <VerifyWorkModal bounty={bounty} submission={submissions[0]}>
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <IconCheck className="w-3 h-3 mr-1" />
                    Review Work
                  </Button>
                </VerifyWorkModal>
              </VerifyButtonWrapper>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}