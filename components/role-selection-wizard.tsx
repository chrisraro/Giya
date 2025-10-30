"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface RoleSelectionWizardProps {
  onRoleSelected?: (role: "customer" | "business" | "influencer") => void
}

export function RoleSelectionWizard({ onRoleSelected }: RoleSelectionWizardProps) {
  const [selectedRole, setSelectedRole] = useState<"customer" | "business" | "influencer" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check if there's a preferred role from the signup process
  useEffect(() => {
    const checkPreferredRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        if (!user) throw new Error("No authenticated user found")
        
        // Check if user has a preferred role from signup
        const preferredRole = localStorage.getItem('preferred_role')
        if (preferredRole && (preferredRole === "customer" || preferredRole === "business" || preferredRole === "influencer")) {
          setSelectedRole(preferredRole)
        }
      } catch (error) {
        console.error("Error checking preferred role:", error)
      }
    }

    checkPreferredRole()
  }, [supabase])

  const handleRoleSelect = (role: "customer" | "business" | "influencer") => {
    setSelectedRole(role)
    // Save the selection to localStorage
    localStorage.setItem('preferred_role', role)
  }

  const handleContinue = async () => {
    if (!selectedRole) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Update the user's metadata with the selected role
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      if (!user) throw new Error("No authenticated user found")
      
      // Update user metadata with the selected role
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          role: selectedRole
        }
      })
      
      if (updateError) throw updateError
      
      // Clean up localStorage
      localStorage.removeItem('preferred_role')
      
      // Redirect to the appropriate setup page
      if (onRoleSelected) {
        onRoleSelected(selectedRole)
      } else {
        router.push(`/auth/setup/${selectedRole}`)
      }
    } catch (error) {
      console.error("Error setting user role:", error)
      setError(error instanceof Error ? error.message : "An error occurred while setting your role")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Account Type</CardTitle>
          <CardDescription>Select the type of account you want to create</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant={selectedRole === "customer" ? "default" : "outline"}
              className="justify-start h-auto py-4 px-4"
              onClick={() => handleRoleSelect("customer")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Customer</div>
                  <div className="text-sm text-muted-foreground">
                    Earn rewards by visiting businesses
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant={selectedRole === "business" ? "default" : "outline"}
              className="justify-start h-auto py-4 px-4"
              onClick={() => handleRoleSelect("business")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Business</div>
                  <div className="text-sm text-muted-foreground">
                    Offer rewards to your customers
                  </div>
                </div>
              </div>
            </Button>

            {/* Influencer Option - Temporarily Disabled */}
            {/* Uncomment when ready to launch influencer feature
            <Button
              variant={selectedRole === "influencer" ? "default" : "outline"}
              className="justify-start h-auto py-4 px-4"
              onClick={() => handleRoleSelect("influencer")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Influencer</div>
                  <div className="text-sm text-muted-foreground">
                    Promote businesses and earn rewards
                  </div>
                </div>
              </div>
            </Button>
            */}

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button
              className="w-full mt-4"
              disabled={!selectedRole || isLoading}
              onClick={handleContinue}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin">
                    <div className="h-full w-full rounded-full border-2 border-current border-t-transparent"></div>
                  </div>
                  Setting up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}