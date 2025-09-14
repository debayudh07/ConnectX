'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useBountyMarketplace, useTransactionStatus, useHasRole, useRoleConstants, useCanVerifyBounties, ROLE_CONSTANTS } from "@/contractsABI/contractHooks"
import { BountyStructure, BountySubmission } from "@/contractsABI/contractTypes"
import { formatEther } from "viem"
import { toast } from "sonner"
import { IconCheck, IconX, IconLoader2, IconExternalLink, IconCoin, IconAlertTriangle } from "@tabler/icons-react"
import { useAccount } from "wagmi"

interface VerifyWorkModalProps {
  bounty: BountyStructure
  submission: BountySubmission
  children: React.ReactNode
}

export function VerifyWorkModal({ bounty, submission, children }: VerifyWorkModalProps) {
  const [open, setOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(true)
  const [feedback, setFeedback] = useState("")
  
  const { address } = useAccount()
  const { verifyAndPayBounty, disputeBounty, grantVerifierRole, hash, isPending } = useBountyMarketplace()
  const { isConfirming, isConfirmed } = useTransactionStatus(hash)
  const { canVerify, hasVerifierRole, hasAdminRole, isLoading: roleLoading, error: roleError } = useCanVerifyBounties(address as `0x${string}`)

  // Track multi-step process
  const [isGrantingRole, setIsGrantingRole] = useState(false)
  const [roleGranted, setRoleGranted] = useState(false)

  // Debug role checking
  useEffect(() => {
    if (address) {
      console.log('🔍 Role Check Debug:', {
        address,
        canVerify,
        hasVerifierRole,
        hasAdminRole,
        roleLoading,
        roleError
      })
    }
  }, [address, canVerify, hasVerifierRole, hasAdminRole, roleLoading, roleError])

  // Show success message when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      if (isApproving) {
        toast.success(`🎉 Work verified and payment processed for Bounty #${bounty.id}! Developer has been paid.`)
      } else {
        toast.success(`⚠️ Bounty #${bounty.id} disputed successfully. The issue has been escalated for resolution.`)
      }
      setOpen(false)
      setFeedback("")
      setIsGrantingRole(false)
      setRoleGranted(false)
    }
  }, [isConfirmed, bounty.id, isApproving])

  const handleVerifyAndPay = async () => {
    // For disputes, feedback is required
    if (!isApproving && !feedback.trim()) {
      toast.error("Please provide a reason for disputing this work")
      return
    }

    // Wait for role data to load
    if (roleLoading) {
      toast.info("⏳ Loading role information...")
      return
    }

    if (!address) {
      toast.error("❌ Please connect your wallet")
      return
    }

    try {
      console.log('🚀 Starting verification process:', {
        canVerify,
        hasVerifierRole,
        hasAdminRole,
        address,
        isApproving
      })

      // Step 1: Check if user can verify, if not and they're admin, grant role
      if (!canVerify && hasAdminRole) {
        setIsGrantingRole(true)
        toast.info("🔧 Granting VERIFIER_ROLE to enable bounty verification...")
        
        try {
          const grantTx = await grantVerifierRole(address as `0x${string}`)
          console.log('✅ Role grant transaction:', grantTx)
          toast.success("✅ VERIFIER_ROLE granted successfully!")
          setRoleGranted(true)
          
          // Wait a moment for the role to be updated on-chain
          await new Promise(resolve => setTimeout(resolve, 3000))
        } catch (roleError: unknown) {
          const roleErrorMessage = roleError instanceof Error ? roleError.message : String(roleError)
          console.error('❌ Role grant error:', roleErrorMessage)
          toast.error(`❌ Failed to grant VERIFIER_ROLE: ${roleErrorMessage}`)
          setIsGrantingRole(false)
          return
        }
        setIsGrantingRole(false)
      }

      // Step 2: Proceed with verification if user has permissions
      const hasPermission = canVerify || roleGranted || hasAdminRole
      console.log('🔐 Permission check:', { hasPermission, canVerify, roleGranted, hasAdminRole })

      if (hasPermission) {
        if (isApproving) {
          console.log('✅ Calling verifyAndPayBounty...')
          const verifyTx = await verifyAndPayBounty(bounty.id)
          console.log('📄 Verify transaction:', verifyTx)
          toast.success("🔄 Payment verification initiated! Processing payment to developer...")
        } else {
          console.log('⚠️ Calling disputeBounty...')
          const disputeTx = await disputeBounty(bounty.id, feedback)
          console.log('📄 Dispute transaction:', disputeTx)
          toast.success("⚠️ Dispute initiated! The work has been flagged for review...")
        }
      } else {
        console.log('🚫 No permission to verify')
        toast.error('🚫 You need VERIFIER_ROLE or ADMIN_ROLE to verify bounties. Please contact an admin.')
        return
      }
      
    } catch (error: unknown) {
      console.error('💥 Error processing verification:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (errorMessage.includes('bounty not in submitted state')) {
        toast.error('⚠️ Bounty is not in submitted state')
      } else if (errorMessage.includes('no submission found')) {
        toast.error('📝 No submission found for this bounty')
      } else if (errorMessage.includes('verification failed')) {
        toast.error('❌ Submission verification failed')
      } else if (errorMessage.includes('not authorized')) {
        toast.error('🚫 Not authorized to perform this action')
      } else if (errorMessage.includes('caller is not a verifier or admin')) {
        toast.error('🚫 You need VERIFIER_ROLE to approve payments. Role will be granted automatically if you have admin permissions.')
      } else {
        toast.error(`❌ Error: ${errorMessage || 'Unknown error'}`)
      }
    }
  }

  const platformFee = (Number(bounty.rewardAmount) * 250) / 10000 // Assuming 2.5% platform fee
  const developerPayment = Number(bounty.rewardAmount) - platformFee

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCheck className="w-5 h-5" />
            Verify Work Submission - Bounty #{bounty.id.toString()}
          </DialogTitle>
          <DialogDescription>
            Review the submitted work and decide whether to approve payment or dispute the submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Bounty Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Bounty Details</div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {formatEther(bounty.rewardAmount)} AVAX
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>Repository:</strong> {bounty.repositoryUrl}</div>
              <div><strong>Description:</strong> {bounty.description}</div>
              <div><strong>Difficulty:</strong> {bounty.difficultyLevel.toString()}/5</div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Submitted Work</div>
              <Badge variant="outline">
                {new Date(Number(submission.submittedAt) * 1000).toLocaleDateString()}
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Developer</Label>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1 break-all">
                  {submission.developer}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Pull Request</Label>
                <div className="mt-1">
                  <a 
                    href={submission.prUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    <IconExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{submission.prUrl}</span>
                  </a>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Work Description</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded text-sm max-h-32 overflow-y-auto">
                  {submission.description}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <IconCoin className="w-5 h-5 text-blue-600" />
              <div className="font-medium">Payment Breakdown</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Bounty Amount:</span>
                <span className="font-mono">{formatEther(bounty.rewardAmount)} AVAX</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee (2.5%):</span>
                <span className="font-mono">{(platformFee / 1e18).toFixed(6)} AVAX</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Developer Payment:</span>
                <span className="font-mono text-green-600">{(developerPayment / 1e18).toFixed(6)} AVAX</span>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Your Decision</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsApproving(true)}
                className={`p-4 rounded-lg border text-center transition-all ${
                  isApproving 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <IconCheck className={`w-6 h-6 mx-auto mb-2 ${isApproving ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className={`font-medium ${isApproving ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Approve & Pay
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Work meets requirements
                </div>
              </button>

              <button
                onClick={() => setIsApproving(false)}
                className={`p-4 rounded-lg border text-center transition-all ${
                  !isApproving 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <IconX className={`w-6 h-6 mx-auto mb-2 ${!isApproving ? 'text-red-600' : 'text-muted-foreground'}`} />
                <div className={`font-medium ${!isApproving ? 'text-red-600' : 'text-muted-foreground'}`}>
                  Dispute Work
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Work needs revision
                </div>
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              {isApproving ? "Verification Notes (Optional)" : "Dispute Reason *"}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                isApproving 
                  ? "Add any notes about the verification (optional)..." 
                  : "Explain why this work doesn't meet the requirements..."
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {isApproving && (
              <p className="text-xs text-muted-foreground">
                Feedback is optional for approvals. The smart contract will handle verification automatically.
              </p>
            )}
          </div>

          {/* Warning for disputes */}
          {!isApproving && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <IconAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">Disputing Work</div>
                  <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                    This will flag the submission for admin review. Please provide clear reasons for the dispute.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === 'development' && address && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
            <div className="font-medium mb-2">🔍 Debug Info:</div>
            <div className="space-y-1 font-mono">
              <div>Address: {address}</div>
              <div>Can Verify: {canVerify ? '✅' : '❌'}</div>
              <div>Has Verifier Role: {hasVerifierRole ? '✅' : '❌'}</div>
              <div>Has Admin Role: {hasAdminRole ? '✅' : '❌'}</div>
              <div>Role Loading: {roleLoading ? '⏳' : '✅'}</div>
              <div>Role Error: {roleError ? '❌' : '✅'}</div>
            </div>
          </div>
        )}

        {/* Permission Check */}
        {!roleLoading && !canVerify && !hasAdminRole && address && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Verifier Role Required</div>
                <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                  You need VERIFIER_ROLE to approve payments. Please contact an admin to grant you the required role.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto Role Grant Info */}
        {!roleLoading && !canVerify && hasAdminRole && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <IconCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-200">Auto Role Grant Available</div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  VERIFIER_ROLE will be automatically granted when you verify this bounty (you have admin permissions).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Loading State */}
        {roleLoading && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <IconLoader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-200">Loading Role Information</div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Checking your verification permissions...
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyAndPay}
            disabled={
              (!isApproving && !feedback.trim()) || 
              isPending || 
              isConfirming || 
              isGrantingRole ||
              roleLoading ||
              (!address) ||
              (!canVerify && !hasAdminRole && !roleLoading)
            }
            className={isApproving 
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
              : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            }
          >
            {roleLoading ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Roles...
              </>
            ) : isGrantingRole ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                Granting Role...
              </>
            ) : isPending || isConfirming ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPending ? "Processing..." : "Confirming..."}
              </>
            ) : !address ? (
              <>
                <IconX className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            ) : !canVerify && !hasAdminRole ? (
              <>
                <IconX className="w-4 h-4 mr-2" />
                Verifier Role Required
              </>
            ) : (
              <>
                {isApproving ? (
                  <>
                    <IconCheck className="w-4 h-4 mr-2" />
                    {!canVerify && hasAdminRole ? 
                      `Grant Role & Pay ${(developerPayment / 1e18).toFixed(4)} AVAX` :
                      `Approve & Pay ${(developerPayment / 1e18).toFixed(4)} AVAX`
                    }
                  </>
                ) : (
                  <>
                    <IconX className="w-4 h-4 mr-2" />
                    {!canVerify && hasAdminRole ? "Grant Role & Dispute" : "Dispute Work"}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}