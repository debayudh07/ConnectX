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
import { useBountyMarketplace, useTransactionStatus } from "@/contractsABI/contractHooks"
import { BountyStructure } from "@/contractsABI/contractTypes"
import { formatEther } from "viem"
import { toast } from "sonner"
import { IconX, IconLoader2, IconCoin, IconAlertTriangle } from "@tabler/icons-react"

interface CancelBountyModalProps {
  bounty: BountyStructure
  children: React.ReactNode
}

export function CancelBountyModal({ bounty, children }: CancelBountyModalProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  
  const { cancelBounty, hash, isPending } = useBountyMarketplace()
  const { isConfirming, isConfirmed } = useTransactionStatus(hash)

  // Show success message when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      toast.success(`✅ Bounty #${bounty.id} cancelled successfully! Refund has been processed.`)
      setOpen(false)
      setReason("")
    }
  }, [isConfirmed, bounty.id])

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancelling this bounty")
      return
    }

    try {
      await cancelBounty(bounty.id, reason)
      toast.success("🔄 Bounty cancellation initiated! Processing refund...")
    } catch (error: unknown) {
      console.error('Error cancelling bounty:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (errorMessage.includes('bounty cannot be cancelled')) {
        toast.error('⚠️ This bounty cannot be cancelled in its current state')
      } else if (errorMessage.includes('not authorized')) {
        toast.error('🚫 Not authorized to cancel this bounty')
      } else {
        toast.error(`❌ Error cancelling bounty: ${errorMessage || 'Unknown error'}`)
      }
    }
  }

  const canCancel = bounty.status === 0 || (bounty.status === 1 && bounty.claimedBy !== '0x0000000000000000000000000000000000000000')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconX className="w-5 h-5 text-red-600" />
            Cancel Bounty #{bounty.id.toString()}
          </DialogTitle>
          <DialogDescription>
            This action will cancel the bounty and refund the reward amount back to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bounty Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">Bounty Details</div>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                {formatEther(bounty.rewardAmount)} AVAX
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="break-all">
                <strong>Repository:</strong> 
                <span className="block text-xs mt-1 font-mono bg-muted px-2 py-1 rounded">
                  {bounty.repositoryUrl}
                </span>
              </div>
              <div>
                <strong>Description:</strong> 
                <span className="block mt-1">{bounty.description}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</div>
                <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {bounty.status === 0 
                    ? "Cancelling this open bounty will refund the full amount to you."
                    : "This bounty has been claimed. Cancellation may only be possible if the claim period has expired."
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Refund Info */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IconCoin className="w-5 h-5 text-green-600" />
              <div className="font-medium">Refund Information</div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Refund Amount:</span>
                <span className="font-mono text-green-600">{formatEther(bounty.rewardAmount)} AVAX</span>
              </div>
              <div className="text-muted-foreground mt-1">
                The full bounty amount will be returned to your wallet.
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're cancelling this bounty (e.g., requirements changed, issue resolved, etc.)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {!canCancel && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <IconX className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-red-800 dark:text-red-200">Cannot Cancel</div>
                  <div className="text-red-700 dark:text-red-300 mt-1">
                    This bounty cannot be cancelled in its current state. Check the bounty status and claim duration.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Keep Bounty
          </Button>
          <Button
            onClick={handleCancel}
            disabled={!reason.trim() || !canCancel || isPending || isConfirming}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isPending || isConfirming ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPending ? "Cancelling..." : "Confirming..."}
              </>
            ) : (
              <>
                <IconX className="w-4 h-4 mr-2" />
                Cancel Bounty & Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}