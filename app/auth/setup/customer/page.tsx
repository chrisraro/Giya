"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function CustomerSetupPage() {
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [referralInfluencer, setReferralInfluencer] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if customer profile already exists
      const { data: customerProfile, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .single()

      if (customerProfile && !customerError) {
        // Customer profile already exists, redirect to dashboard
        router.push("/dashboard/customer")
        return
      }

      // Check for referral code and fetch influencer info
      const referralCode = user.user_metadata?.referral_code || 
        (typeof window !== 'undefined' ? localStorage.getItem('affiliate_referral_code') : null)
      
      if (referralCode) {
        // Fetch influencer information for the referral code
        const { data: affiliateLink, error: linkError } = await supabase
          .from("affiliate_links")
          .select(`
            unique_code,
            influencers (
              full_name
            )
          `)
          .eq("unique_code", referralCode)
          .single()

        if (affiliateLink && !linkError) {
          setReferralInfluencer(affiliateLink.influencers)
          toast.success(`You were referred by ${affiliateLink.influencers.full_name}!`, {
            description: "You'll earn points and they'll get credit for referring you.",
            duration: 5000
          })
        }
      }

      setUserData(user)
    }

    checkUser()
  }, [router])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // Check if customer profile already exists
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .single()

      if (existingCustomer && !customerCheckError) {
        // Customer profile already exists, redirect to dashboard
        router.push("/dashboard/customer")
        return
      }

      let profilePicUrl = null

      // Upload profile picture if provided
      if (profilePic) {
        const fileExt = profilePic.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile-pics")
          .upload(fileName, profilePic)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-pics").getPublicUrl(fileName)
        profilePicUrl = publicUrl
      }

      // Check if profile record already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      // Fix the condition to properly check if profile exists
      if (!existingProfile && (profileCheckError?.code === 'PGRST116' || !profileCheckError)) {
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          role: "customer",
          email: user.email!,
        })

        if (profileError) throw profileError
      }

      // Generate QR code data
      const qrCodeData = `GIYA-${user.id.substring(0, 12).toUpperCase()}`

      // Get referral code from user metadata or localStorage
      const referralCode = user.user_metadata?.referral_code || 
        (typeof window !== 'undefined' ? localStorage.getItem('affiliate_referral_code') : null)

      // Create customer record with referral code if present
      const { error: customerError } = await supabase.from("customers").insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || "Customer Name",
        nickname: user.user_metadata?.nickname || null,
        profile_pic_url: profilePicUrl,
        qr_code_data: qrCodeData,
        referral_code: referralCode // Store the referral code
      })

      if (customerError) throw customerError

      // Clean up localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('affiliate_referral_code')
      }

      router.push("/dashboard/customer")
    } catch (error: unknown) {
      console.error("[v0] Setup error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during setup")
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/giya-logo.png" alt="Giya Logo" width={80} height={80} className="object-contain" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Add a profile picture to personalize your account</CardDescription>
          </CardHeader>
          <CardContent>
            {referralInfluencer && (
              <div className="mb-4 rounded-lg bg-primary/10 p-3">
                <p className="text-sm font-medium">
                  Referred by: <span className="text-primary">{referralInfluencer.full_name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  You and {referralInfluencer.full_name} will both earn points for your activity!
                </p>
              </div>
            )}
            <form onSubmit={handleSetup}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="profilePic">Profile Picture (Optional)</Label>
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Upload a profile picture to personalize your account</p>
                </div>
                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}