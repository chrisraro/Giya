"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function BusinessSetupPage() {
  const [formData, setFormData] = useState({
    businessHours: "",
    pointsPerCurrency: "100",
  })
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

      // Parse business hours
      let businessHoursJson = null
      if (formData.businessHours) {
        try {
          businessHoursJson = { hours: formData.businessHours }
        } catch {
          businessHoursJson = { hours: formData.businessHours }
        }
      }

      // Create profile record
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        role: "business",
        email: user.email!,
      })

      if (profileError) throw profileError

      // Create business record
      const { error: businessError } = await supabase.from("businesses").insert({
        id: user.id,
        business_name: user.user_metadata.business_name,
        business_category: user.user_metadata.business_category,
        address: user.user_metadata.address,
        gmaps_link: user.user_metadata.gmaps_link || null,
        business_hours: businessHoursJson,
        profile_pic_url: profilePicUrl,
        points_per_currency: Number.parseInt(formData.pointsPerCurrency) || 100,
      })

      if (businessError) throw businessError

      router.push("/dashboard/business")
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
          <Image src="/giya-logo.jpg" alt="Giya Logo" width={80} height={80} className="object-contain" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Business Setup</CardTitle>
            <CardDescription>Configure your loyalty program settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="profilePic">Business Logo (Optional)</Label>
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <Textarea
                    id="businessHours"
                    placeholder="e.g., Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM"
                    value={formData.businessHours}
                    onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerCurrency">Points Configuration</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">1 point per</span>
                    <Input
                      id="pointsPerCurrency"
                      type="number"
                      min="1"
                      value={formData.pointsPerCurrency}
                      onChange={(e) => setFormData({ ...formData, pointsPerCurrency: e.target.value })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">pesos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: If set to 100, customers earn 1 point for every ₱100 spent
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
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
