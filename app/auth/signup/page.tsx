"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Megaphone, User, ArrowRight } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"

export default function SignupPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user already has a role
        if (user.user_metadata?.role) {
          // Redirect based on role
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
        } else {
          // User doesn't have a role yet, redirect to role selection
          router.push("/auth/role-selection")
        }
      }
    }

    checkUser()
  }, [router, supabase])

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      // The browser will automatically redirect to Google OAuth
      // After authentication, Google will redirect back to our callback URL
    } catch (error) {
      console.log("[v0] Google signup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during Google sign-up")
    } finally {
      setIsGoogleLoading(false)
    }
  }

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
        
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            className="w-full mb-4"
          >
            {isGoogleLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Signing up with Google...
              </>
            ) : (
              <>
                <Icons.google className="mr-2 h-4 w-4" />
                Sign up with Google
              </>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create Customer Account</CardTitle>
              <CardDescription>Join Giya and start earning rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  // Save preferred role to localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('preferred_role', 'customer')
                  }
                  router.push("/auth/signup/customer")
                }} 
                className="w-full"
                variant="default"
              >
                Sign Up as Customer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create Business Account</CardTitle>
              <CardDescription>Set up your loyalty program on Giya</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  // Save preferred role to localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('preferred_role', 'business')
                  }
                  router.push("/auth/signup/business")
                }} 
                className="w-full"
                variant="default"
              >
                Sign Up as Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create Influencer Account</CardTitle>
              <CardDescription>Join Giya to promote businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  // Save preferred role to localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('preferred_role', 'influencer')
                  }
                  router.push("/auth/signup/influencer")
                }} 
                className="w-full"
                variant="default"
              >
                Sign Up as Influencer
                <ArrowRight className="ml-2 h-4 w-4" />
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