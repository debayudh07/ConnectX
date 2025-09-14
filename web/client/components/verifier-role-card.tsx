"use client"

import * as React from "react"
import { IconShield, IconShieldCheck, IconLoader } from "@tabler/icons-react"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { 
  useBountyMarketplace,
  useCanVerifyBounties,
  useTransactionStatus,
  ROLE_CONSTANTS
} from "@/contractsABI/contractHooks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function VerifierRoleCard() {
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

  if (!address) {
    return null
  }

  if (roleLoading) {
    return (
      <Card className="@container/card bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-white/20 border-2 backdrop-blur-sm">
        <CardHeader>
          <CardDescription className="text-white/80">Verifier Role</CardDescription>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <IconLoader className="w-5 h-5 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="@container/card bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-white/20 border-2 backdrop-blur-sm">
      <CardHeader>
        <CardDescription className="text-white/80">Verifier Role</CardDescription>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          {hasVerifierRole ? (
            <>
              <IconShieldCheck className="w-5 h-5 text-green-400" />
              Verified
            </>
          ) : (
            <>
              <IconShield className="w-5 h-5 text-yellow-400" />
              Not Verified
            </>
          )}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={`${hasVerifierRole ? 'bg-green-500/20 text-green-200 border-green-400/50' : 'bg-yellow-500/20 text-yellow-200 border-yellow-400/50'}`}>
            <IconShield className="w-3 h-3" />
            {hasVerifierRole ? "Verifier" : "Maintainer"}
          </Badge>
        </CardAction>
      </CardHeader>
      
      <CardFooter className="flex-col items-start gap-3">
        <div className="text-sm text-white/60 space-y-1">
          {hasVerifierRole ? (
            <div>
              ✅ You can verify and approve bounty payments
            </div>
          ) : (
            <div>
              ⚠️ You need VERIFIER_ROLE to approve payments
            </div>
          )}
        </div>
        
        {/* Role Status Information */}
        <div className="text-xs text-white/50 space-y-1">
          <div>Admin Role: {hasAdminRole ? "✅" : "❌"}</div>
          <div>Verifier Role: {hasVerifierRole ? "✅" : "❌"}</div>
          <div>Can Verify: {canVerify ? "✅" : "❌"}</div>
        </div>

        {/* Action Button */}
        {!hasVerifierRole && (
          <Button
            onClick={handleGrantVerifierRole}
            disabled={isPending || isConfirming || isGrantingRole}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {isPending || isConfirming || isGrantingRole ? (
              <>
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Granting Role..."}
              </>
            ) : (
              <>
                <IconShield className="w-4 h-4 mr-2" />
                Become Verifier
              </>
            )}
          </Button>
        )}

        {hasVerifierRole && (
          <div className="w-full text-center text-green-400 text-sm font-medium">
            🎉 You can now verify bounties!
          </div>
        )}
      </CardFooter>
    </Card>
  )
}