"use client"

import { useEffect } from "react"
import { RoleSelectionWizard } from "@/components/role-selection-wizard"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function RoleSelectionPage() {
  const router = useRouter()
  const supabase = createClient()

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // If not authenticated, redirect to login
        router.push("/auth/login")
      } else if (user.user_metadata?.role) {
        // If user already has a role, redirect to appropriate dashboard
        switch (user.user_metadata.role) {
          case "customer":
            router.push("/dashboard/customer")
            break
          case "business":
            router.push("/dashboard/business")
            break
          case "influencer":
            router.push("/dashboard/influencer")
            break
          default:
            router.push("/")
        }
      }
    }

    checkUser()
  }, [router, supabase])

  return <RoleSelectionWizard />
}