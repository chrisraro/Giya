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
import { signupSchema, type SignupInput } from "@/lib/validation/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Use react-hook-form with Zod validation
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
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
      role: "customer" as const,
    }
  })

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
          router.push("/auth/signup")
        }
      }
    }

    checkUser()
  }, [router, supabase])

  const handleRoleSelect = (role: "customer" | "business" | "influencer") => {
    setSelectedRole(role)
    form.setValue('role', role)
    // Save preferred role to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_role', role)
    }
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setError(null)
    form.reset()
  }

  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      setError("Please select a role first")
      return
    }

    // Validate form fields based on selected role
    let isValid = true

    if (selectedRole === "customer") {
      isValid = await form.trigger(['fullName'])
    } else if (selectedRole === "business") {
      isValid = await form.trigger(['businessName', 'businessCategory', 'address'])
    } else if (selectedRole === "influencer") {
      isValid = await form.trigger(['influencerFullName', 'influencerAddress'])
    }

    if (!isValid) {
      setError("Please fill in all required fields")
      return
    }

    setIsGoogleLoading(true)
    setError(null)

    try {
      // Get form data values
      const formData = form.getValues()

      // Save form data and role to localStorage for use after Google auth
      const googleSignupData = {
        role: selectedRole,
        formData: { ...formData }
      }
      
      if (typeof window !== 'undefined') {
        // Save to localStorage
        localStorage.setItem('google_signup_data', JSON.stringify(googleSignupData))
        
        // Save referral code if present
        const urlParams = new URLSearchParams(window.location.search)
        const refCode = urlParams.get('ref')
        if (refCode) {
          localStorage.setItem('affiliate_referral_code', refCode)
        }
        
        // Also save to a cookie for server-side access
        document.cookie = `google_signup_data=${JSON.stringify(googleSignupData)}; path=/`
        if (refCode) {
          document.cookie = `affiliate_referral_code=${refCode}; path=/`
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

    // Trigger validation for the selected role
    let isValid = true
    if (selectedRole === "customer") {
      isValid = await form.trigger(['email', 'password', 'confirmPassword', 'fullName'])
    } else if (selectedRole === "business") {
      isValid = await form.trigger(['email', 'password', 'confirmPassword', 'businessName', 'businessCategory', 'address'])
    } else if (selectedRole === "influencer") {
      isValid = await form.trigger(['email', 'password', 'confirmPassword', 'influencerFullName', 'influencerAddress'])
    }

    if (!isValid) {
      setError("Please fix validation errors")
      setIsLoading(false)
      return
    }

    try {
      const formData = form.getValues()

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
                          {...form.register("fullName", { required: selectedRole === "customer" })}
                        />
                        {form.formState.errors.fullName && (
                          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nickname">Nickname (Optional)</Label>
                        <Input
                          id="nickname"
                          type="text"
                          {...form.register("nickname")}
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
                          {...form.register("businessName", { required: selectedRole === "business" })}
                        />
                        {form.formState.errors.businessName && (
                          <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="businessCategory">Business Category</Label>
                        <Select
                          value={form.watch("businessCategory")}
                          onValueChange={(value) => form.setValue("businessCategory", value)}
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
                        {form.formState.errors.businessCategory && (
                          <p className="text-sm text-destructive">{form.formState.errors.businessCategory.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          type="text"
                          {...form.register("address", { required: selectedRole === "business" })}
                        />
                        {form.formState.errors.address && (
                          <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gmapsLink">Google Maps Link (Optional)</Label>
                        <Input
                          id="gmapsLink"
                          type="url"
                          placeholder="https://maps.google.com/..."
                          {...form.register("gmapsLink")}
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
                          {...form.register("influencerFullName", { required: selectedRole === "influencer" })}
                        />
                        {form.formState.errors.influencerFullName && (
                          <p className="text-sm text-destructive">{form.formState.errors.influencerFullName.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="influencerAddress">Address</Label>
                        <Input
                          id="influencerAddress"
                          type="text"
                          {...form.register("influencerAddress", { required: selectedRole === "influencer" })}
                        />
                        {form.formState.errors.influencerAddress && (
                          <p className="text-sm text-destructive">{form.formState.errors.influencerAddress.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="facebookLink">Facebook Link (Optional)</Label>
                        <Input
                          id="facebookLink"
                          type="url"
                          placeholder="https://facebook.com/..."
                          {...form.register("facebookLink")}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tiktokLink">TikTok Link (Optional)</Label>
                        <Input
                          id="tiktokLink"
                          type="url"
                          placeholder="https://tiktok.com/..."
                          {...form.register("tiktokLink")}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="twitterLink">Twitter Link (Optional)</Label>
                        <Input
                          id="twitterLink"
                          type="url"
                          placeholder="https://twitter.com/..."
                          {...form.register("twitterLink")}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="youtubeLink">YouTube Link (Optional)</Label>
                        <Input
                          id="youtubeLink"
                          type="url"
                          placeholder="https://youtube.com/..."
                          {...form.register("youtubeLink")}
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
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...form.register("confirmPassword")}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                    )}
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