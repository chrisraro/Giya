"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Icons } from "@/components/icons"

const BUSINESS_CATEGORIES = [
  "Food and Drinks",
  "Retail",
  "Health and Wellness",
  "Beauty and Spa",
  "Entertainment",
  "Services",
  "Other",
]

export default function BusinessSignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessCategory: "",
    address: "",
    gmapsLink: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/setup/business`,
          data: {
            role: "business",
            business_name: formData.businessName,
            business_category: formData.businessCategory,
            address: formData.address,
            gmaps_link: formData.gmapsLink,
          },
        },
      })

      if (signUpError) throw signUpError

      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      // Save role and form data to localStorage and cookie for callback access
      const googleSignupData = {
        role: "business",
        formData: { ...formData }
      }
      
      if (typeof window !== 'undefined') {
        // Save to localStorage
        localStorage.setItem('google_signup_data', JSON.stringify(googleSignupData))
        
        // Also save to a cookie for server-side access
        document.cookie = `google_signup_data=${JSON.stringify(googleSignupData)}; path=/`
      }

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
      <div className="w-full max-w-md">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/auth/signup">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Business Account</CardTitle>
            <CardDescription>Set up your loyalty program on Giya</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
                className="w-full"
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
              
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="businessCategory">Business Category</Label>
                    <Select
                      value={formData.businessCategory}
                      onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gmapsLink">Google Maps Link (Optional)</Label>
                    <Input
                      id="gmapsLink"
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={formData.gmapsLink}
                      onChange={(e) => setFormData({ ...formData, gmapsLink: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="business@example.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}