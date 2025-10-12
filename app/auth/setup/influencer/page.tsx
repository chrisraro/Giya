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

export default function InfluencerSetupPage() {
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
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

      // Check if influencer profile already exists
      const { data: influencerProfile, error: influencerError } = await supabase
        .from("influencers")
        .select("id")
        .eq("id", user.id)
        .single()

      if (influencerProfile && !influencerError) {
        // Influencer profile already exists, redirect to dashboard
        router.push("/dashboard/influencer")
        return
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

      // Check if influencer profile already exists
      const { data: existingInfluencer, error: influencerCheckError } = await supabase
        .from("influencers")
        .select("id")
        .eq("id", user.id)
        .single()

      if (existingInfluencer && !influencerCheckError) {
        // Influencer profile already exists, redirect to dashboard
        router.push("/dashboard/influencer")
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

      if (!existingProfile && profileCheckError?.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          role: "influencer",
          email: user.email!,
        })

        if (profileError) throw profileError
      }

      // Create influencer record
      const { error: influencerError } = await supabase.from("influencers").insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || "Influencer Name",
        profile_pic_url: profilePicUrl,
        address: user.user_metadata?.address || "Address",
        facebook_link: user.user_metadata?.facebook_link || null,
        tiktok_link: user.user_metadata?.tiktok_link || null,
        twitter_link: user.user_metadata?.twitter_link || null,
        youtube_link: user.user_metadata?.youtube_link || null,
      })

      if (influencerError) throw influencerError

      router.push("/dashboard/influencer")
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