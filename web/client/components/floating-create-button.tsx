"use client"

import { CreateBountyModal } from "@/components/create-bounty-modal"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"

export function FloatingCreateButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <CreateBountyModal>
        <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-500/30 text-white">
          <IconPlus className="w-6 h-6" />
          <span className="sr-only">Create Bounty</span>
        </Button>
      </CreateBountyModal>
    </div>
  )
}