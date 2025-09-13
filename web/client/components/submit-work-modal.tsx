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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useBountyMarketplace, useTransactionStatus } from "@/contractsABI/contractHooks"
import { BountyStructure } from "@/contractsABI/contractTypes"
import { formatEther } from "viem"
import { toast } from "sonner"
import { IconCode, IconLoader2, IconCheck, IconX } from "@tabler/icons-react"

interface SubmitWorkModalProps {
  bounty: BountyStructure
  children: React.ReactNode
}

export function SubmitWorkModal({ bounty, children }: SubmitWorkModalProps) {
  const [open, setOpen] = useState(false)
  const [prUrl, setPrUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [isRepoMatch, setIsRepoMatch] = useState(false)
  
  const { submitWork, hash, isPending } = useBountyMarketplace()
  const { isConfirming, isConfirmed } = useTransactionStatus(hash)

  // Show success message when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      toast.success(`🎉 Work submitted successfully for Bounty #${bounty.id}! Your submission is now under review.`)
      setOpen(false)
      setPrUrl("")
      setDescription("")
    }
  }, [isConfirmed, bounty.id])

  // Extract repository name from bounty's GitHub URL
  const getRepoFromUrl = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  // Validate PR URL format and check if it matches the bounty repository
  const validatePrUrl = (url: string) => {
    const prRegex = /^https:\/\/github\.com\/([^\/]+\/[^\/]+)\/pull\/(\d+)$/
    const match = url.match(prRegex)
    
    if (!match) {
      setIsValidUrl(false)
      setIsRepoMatch(false)
      return
    }
    
    setIsValidUrl(true)
    
    // Check if PR repository matches the bounty repository
    const prRepo = match[1]
    const bountyRepo = getRepoFromUrl(bounty.repositoryUrl)
    
    if (bountyRepo && prRepo.toLowerCase() === bountyRepo.toLowerCase()) {
      setIsRepoMatch(true)
    } else {
      setIsRepoMatch(false)
    }
  }

  const handlePrUrlChange = (url: string) => {
    setPrUrl(url)
    validatePrUrl(url)
  }

  const handleSubmit = async () => {
    if (!isValidUrl || !isRepoMatch) {
      toast.error("Please enter a valid PR URL that matches the bounty repository")
      return
    }

    if (!description.trim()) {
      toast.error("Please provide a description of your work")
      return
    }

    try {
      await submitWork(bounty.id, prUrl, description)
      toast.success("🎉 Work submission initiated! Check your wallet for confirmation.")
      setOpen(false)
      setPrUrl("")
      setDescription("")
    } catch (error: any) {
      console.error('Error submitting work:', error)
      
      if (error?.message?.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (error?.message?.includes('bounty not in claimed state')) {
        toast.error('⚠️ Bounty is not in claimed state')
      } else if (error?.message?.includes('only claimer can submit')) {
        toast.error('🚫 Only the claimer can submit work for this bounty')
      } else if (error?.message?.includes('already submitted')) {
        toast.error('📝 Work has already been submitted for this bounty')
      } else if (error?.message?.includes('PR URL required')) {
        toast.error('🔗 PR URL is required')
      } else {
        toast.error(`❌ Error submitting work: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  const bountyRepo = getRepoFromUrl(bounty.repositoryUrl)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCode className="w-5 h-5" />
            Submit Work for Bounty #{bounty.id.toString()}
          </DialogTitle>
          <DialogDescription>
            Submit your completed work for review. Make sure your PR addresses the GitHub issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bounty Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Bounty Details</div>
              <Badge variant="secondary">
                {formatEther(bounty.rewardAmount)} AVAX
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Repository: <code className="text-blue-600">{bountyRepo}</code></div>
              <div className="line-clamp-2">{bounty.description}</div>
            </div>
          </div>

          {/* PR URL Input */}
          <div className="space-y-2">
            <Label htmlFor="prUrl">Pull Request URL *</Label>
            <Input
              id="prUrl"
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => handlePrUrlChange(e.target.value)}
              className={
                prUrl && !isValidUrl ? "border-red-300" : 
                prUrl && isValidUrl && isRepoMatch ? "border-green-300" : ""
              }
            />
            <div className="flex items-center gap-2 text-xs">
              {prUrl && (
                <>
                  {isValidUrl ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <IconCheck className="w-3 h-3" />
                      Valid PR URL
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <IconX className="w-3 h-3" />
                      Invalid PR URL format
                    </div>
                  )}
                  {isValidUrl && (
                    <>
                      {isRepoMatch ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <IconCheck className="w-3 h-3" />
                          Repository matches
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <IconX className="w-3 h-3" />
                          Repository doesn't match bounty
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Work Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the work you've completed, how it addresses the issue, and any relevant implementation details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <div className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </div>
          </div>

          {/* Validation Summary */}
          {prUrl && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium mb-2">Submission Checklist:</div>
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-2 ${isValidUrl ? 'text-green-600' : 'text-red-600'}`}>
                  {isValidUrl ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
                  Valid GitHub PR URL format
                </div>
                <div className={`flex items-center gap-2 ${isRepoMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {isRepoMatch ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
                  PR is in the correct repository
                </div>
                <div className={`flex items-center gap-2 ${description.trim() ? 'text-green-600' : 'text-red-600'}`}>
                  {description.trim() ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
                  Work description provided
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidUrl || !isRepoMatch || !description.trim() || isPending || isConfirming}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isPending || isConfirming ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPending ? "Submitting..." : "Confirming..."}
              </>
            ) : (
              <>
                <IconCode className="w-4 h-4 mr-2" />
                Submit Work
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}