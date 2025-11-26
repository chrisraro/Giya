"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Redirect to customer dashboard - this page has been replaced by Unified Scanner
export default function ProcessReceiptRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main dashboard with scanner open
    router.replace('/dashboard/customer?scanner=open')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to receipt scanner...</p>
      </div>
    </div>
  )
}
