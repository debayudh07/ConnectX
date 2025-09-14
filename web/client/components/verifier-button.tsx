"use client"

import * as React from "react"
import { IconShield, IconShieldCheck, IconLoader } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { 
  useBountyMarketplace,
  useCanVerifyBounties,
  useTransactionStatus
} from "@/contractsABI/contractHooks"

import { Button } from "@/components/ui/button"

interface VerifierButtonProps {
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "secondary"
  className?: string
}

export function VerifierButton({ size = "sm", variant = "secondary", className = "" }: VerifierButtonProps) {
  const { address } = useAccount()
  const { grantVerifierRole, hash, isPending } = useBountyMarketplace()
  const { isConfirming, isConfirmed } = useTransactionStatus(hash)
  const { canVerify, hasVerifierRole, hasAdminRole, isLoading: roleLoading } = useCanVerifyBounties(address as `0x${string}`)

  const [isGrantingRole, setIsGrantingRole] = React.useState(false)

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && isGrantingRole) {
      toast.success("🎉 VERIFIER_ROLE granted successfully! You can now verify bounties.")
      setIsGrantingRole(false)
    }
  }, [isConfirmed, isGrantingRole])

  const handleGrantVerifierRole = async () => {
    if (!address) {
      toast.error("❌ Please connect your wallet")
      return
    }

    if (hasVerifierRole) {
      toast.info("✅ You already have the VERIFIER_ROLE!")
      return
    }

    try {
      setIsGrantingRole(true)
      toast.info("🔧 Granting VERIFIER_ROLE...")
      
      await grantVerifierRole(address)
      
    } catch (error: unknown) {
      console.error('💥 Error granting verifier role:', error)
      setIsGrantingRole(false)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('user rejected')) {
        toast.error('❌ Transaction was rejected by user')
      } else if (errorMessage.includes('AccessControl')) {
        toast.error('🚫 You need admin permissions to grant roles. Contact an admin.')
      } else {
        toast.error(`❌ Error granting role: ${errorMessage}`)
      }
    }
  }

  if (!address || roleLoading) {
    return null
  }

  // Show different button states
  if (hasVerifierRole) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`bg-green-500/20 text-green-200 border-green-400/50 hover:bg-green-500/20 ${className}`}
      >
        <IconShieldCheck className="w-4 h-4 mr-2" />
        Verifier
      </Button>
    )
  }

  return (
    <Button
      onClick={handleGrantVerifierRole}
      disabled={isPending || isConfirming || isGrantingRole}
      variant={variant}
      size={size}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      {isPending || isConfirming || isGrantingRole ? (
        <>
          <IconLoader className="w-4 h-4 mr-2 animate-spin" />
          {isConfirming ? "Confirming..." : "Granting..."}
        </>
      ) : (
        <>
          <IconShield className="w-4 h-4 mr-2" />
          Become Verifier
        </>
      )}
    </Button>
  )
}