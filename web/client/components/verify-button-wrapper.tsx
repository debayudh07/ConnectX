"use client"

import * as React from "react"
import { useAccount } from "wagmi"
import { useCanVerifyBounties } from "@/contractsABI/contractHooks"
import { Button } from "@/components/ui/button"
import { VerifierButton } from "@/components/verifier-button"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VerifyButtonWrapperProps {
  children: React.ReactNode
  className?: string
}

export function VerifyButtonWrapper({ children, className = "" }: VerifyButtonWrapperProps) {
  const { address } = useAccount()
  const { canVerify, hasVerifierRole, isLoading } = useCanVerifyBounties(address as `0x${string}`)

  if (isLoading) {
    return (
      <Button disabled size="sm" className={className}>
        Loading...
      </Button>
    )
  }

  if (!canVerify && !hasVerifierRole) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed">
                <Button disabled size="sm" className={`${className} opacity-50 cursor-not-allowed`}>
                  🔒 Verify (Need Role)
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You need VERIFIER_ROLE to verify bounties</p>
            </TooltipContent>
          </Tooltip>
          <VerifierButton size="sm" />
        </div>
      </TooltipProvider>
    )
  }

  return <>{children}</>
}