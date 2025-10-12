"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Megaphone, User } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profileError && profile) {
          // Redirect based on role
          switch (profile.role) {
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
        } else {
          // If no profile, check user metadata
          const userRole = user.user_metadata?.role
          if (userRole) {
            router.push(`/auth/setup/${userRole}`)
          }
        }
      }
    }

    checkUser()
  }, [router, supabase])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-6">
          <Image src="/giya-logo.png" alt="Giya Logo" width={80} height={80} className="object-contain" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join Giya</h1>
          <p className="text-muted-foreground">Choose your account type to get started</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Customer Account</CardTitle>
              <CardDescription>Join Giya to start earning rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/auth/signup/customer")} 
                className="w-full"
                variant="default"
              >
                Sign Up as Customer
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Business Account</CardTitle>
              <CardDescription>Join Giya to offer rewards to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/auth/signup/business")} 
                className="w-full"
                variant="default"
              >
                Sign Up as Business
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Influencer Account</CardTitle>
              <CardDescription>Join Giya to promote businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/auth/signup/influencer")} 
                className="w-full"
                variant="default"
              >
                Sign Up as Influencer
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4 text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}