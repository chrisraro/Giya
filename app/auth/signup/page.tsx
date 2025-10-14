"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Building2, Megaphone, User, ArrowRight, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<"customer" | "business" | "influencer" | null>(null)
  const [formData, setFormData] = useState({
    // Customer fields
    fullName: "",
    nickname: "",
    // Business fields
    businessName: "",
    businessCategory: "",
    address: "",
    gmapsLink: "",
    // Influencer fields
    influencerFullName: "",
    influencerAddress: "",
    facebookLink: "",
    tiktokLink: "",
    twitterLink: "",
    youtubeLink: "",
    // Common fields
    email: "",
    password: "",
    confirmPassword: "",
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

  const handleRoleSelect = (role: "customer" | "business" | "influencer") => {
    setSelectedRole(role)
    // Save preferred role to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_role', role)
    }
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setError(null)
  }

  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      setError("Please select a role first")
      return
    }

    // Validate required fields based on role
    if (selectedRole === "customer" && !formData.fullName) {
      setError("Please enter your full name")
      return
    }
    
    if (selectedRole === "business" && (!formData.businessName || !formData.businessCategory || !formData.address)) {
      setError("Please fill in all required business information")
      return
    }
    
    if (selectedRole === "influencer" && (!formData.influencerFullName || !formData.influencerAddress)) {
      setError("Please enter your full name and address")
      return
    }

    setIsGoogleLoading(true)
    setError(null)

    try {
      // Save form data and role to localStorage for use after Google auth
      const googleSignupData = {
        role: selectedRole,
        formData: { ...formData }
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('google_signup_data', JSON.stringify(googleSignupData))
        
        // Save referral code if present
        const urlParams = new URLSearchParams(window.location.search)
        const refCode = urlParams.get('ref')
        if (refCode) {
          localStorage.setItem('affiliate_referral_code', refCode)
        }
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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) {
      setError("Please select a role first")
      return
    }

    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      let signupData: any = {
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/setup/${selectedRole}`,
        }
      }

      // Add role-specific data
      if (selectedRole === "customer") {
        signupData.options.data = {
          role: "customer",
          full_name: formData.fullName,
          nickname: formData.nickname,
        }
      } else if (selectedRole === "business") {
        signupData.options.data = {
          role: "business",
          business_name: formData.businessName,
          business_category: formData.businessCategory,
          address: formData.address,
          gmaps_link: formData.gmapsLink,
        }
      } else if (selectedRole === "influencer") {
        signupData.options.data = {
          role: "influencer",
          full_name: formData.influencerFullName,
          address: formData.influencerAddress,
          facebook_link: formData.facebookLink,
          tiktok_link: formData.tiktokLink,
          twitter_link: formData.twitterLink,
          youtube_link: formData.youtubeLink,
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp(signupData)

      if (signUpError) throw signUpError

      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Render role selection screen
  if (!selectedRole) {
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

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Customer Account</CardTitle>
                <CardDescription>Join Giya and start earning rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleRoleSelect("customer")}
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
                <CardTitle className="text-2xl">Business Account</CardTitle>
                <CardDescription>Set up your loyalty program on Giya</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleRoleSelect("business")}
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
                <CardTitle className="text-2xl">Influencer Account</CardTitle>
                <CardDescription>Join Giya to promote businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleRoleSelect("influencer")}
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

  // Render role-specific signup form
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={handleBackToRoles} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {selectedRole === "customer" && "Create Customer Account"}
              {selectedRole === "business" && "Create Business Account"}
              {selectedRole === "influencer" && "Create Influencer Account"}
            </CardTitle>
            <CardDescription>
              {selectedRole === "customer" && "Join Giya and start earning rewards"}
              {selectedRole === "business" && "Set up your loyalty program on Giya"}
              {selectedRole === "influencer" && "Promote businesses and earn rewards"}
            </CardDescription>
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
                    Validating fields...
                  </>
                ) : (
                  <>
                    <Icons.google className="mr-2 h-4 w-4" />
                    Continue with Google
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
              
              <form onSubmit={handleEmailSignup}>
                <div className="flex flex-col gap-4">
                  {/* Role-specific fields */}
                  {selectedRole === "customer" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nickname">Nickname (Optional)</Label>
                        <Input
                          id="nickname"
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  
                  {selectedRole === "business" && (
                    <>
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
                    </>
                  )}
                  
                  {selectedRole === "influencer" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="influencerFullName">Full Name</Label>
                        <Input
                          id="influencerFullName"
                          type="text"
                          required
                          value={formData.influencerFullName}
                          onChange={(e) => setFormData({ ...formData, influencerFullName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="influencerAddress">Address</Label>
                        <Input
                          id="influencerAddress"
                          type="text"
                          required
                          value={formData.influencerAddress}
                          onChange={(e) => setFormData({ ...formData, influencerAddress: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="facebookLink">Facebook Link (Optional)</Label>
                        <Input
                          id="facebookLink"
                          type="url"
                          placeholder="https://facebook.com/..."
                          value={formData.facebookLink}
                          onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tiktokLink">TikTok Link (Optional)</Label>
                        <Input
                          id="tiktokLink"
                          type="url"
                          placeholder="https://tiktok.com/..."
                          value={formData.tiktokLink}
                          onChange={(e) => setFormData({ ...formData, tiktokLink: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="twitterLink">Twitter Link (Optional)</Label>
                        <Input
                          id="twitterLink"
                          type="url"
                          placeholder="https://twitter.com/..."
                          value={formData.twitterLink}
                          onChange={(e) => setFormData({ ...formData, twitterLink: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="youtubeLink">YouTube Link (Optional)</Label>
                        <Input
                          id="youtubeLink"
                          type="url"
                          placeholder="https://youtube.com/..."
                          value={formData.youtubeLink}
                          onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Common fields */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
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