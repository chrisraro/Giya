"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Link2 } from "lucide-react"
import { toast } from "sonner"

interface InfluencerData {
  id: string
  full_name: string
  profile_pic_url: string | null
  total_points: number
  facebook_link: string | null
  tiktok_link: string | null
  twitter_link: string | null
  youtube_link: string | null
}

export default function InfluencerProfileSettings() {
  const [influencerData, setInfluencerData] = useState<InfluencerData | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    facebook_link: "",
    tiktok_link: "",
    twitter_link: "",
    youtube_link: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch influencer data
        const { data: influencer, error: influencerError } = await supabase
          .from("influencers")
          .select("*")
          .eq("id", user.id)
          .single()

        if (influencerError) throw influencerError

        setInfluencerData(influencer)
        setFormData({
          full_name: influencer.full_name || "",
          facebook_link: influencer.facebook_link || "",
          tiktok_link: influencer.tiktok_link || "",
          twitter_link: influencer.twitter_link || "",
          youtube_link: influencer.youtube_link || "",
        })
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!influencerData) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("influencers")
        .update({
          full_name: formData.full_name,
          facebook_link: formData.facebook_link || null,
          tiktok_link: formData.tiktok_link || null,
          twitter_link: formData.twitter_link || null,
          youtube_link: formData.youtube_link || null,
        })
        .eq("id", influencerData.id)

      if (error) throw error

      toast.success("Profile updated successfully!")
      
      // Update local state
      setInfluencerData({
        ...influencerData,
        ...formData,
        facebook_link: formData.facebook_link || null,
        tiktok_link: formData.tiktok_link || null,
        twitter_link: formData.twitter_link || null,
        youtube_link: formData.youtube_link || null,
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!influencerData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load influencer data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="text-2xl font-bold">Influencer Profile Settings</h1>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add links to your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_link">Facebook</Label>
                <Input
                  id="facebook_link"
                  name="facebook_link"
                  value={formData.facebook_link}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_link">TikTok</Label>
                <Input
                  id="tiktok_link"
                  name="tiktok_link"
                  value={formData.tiktok_link}
                  onChange={handleInputChange}
                  placeholder="https://tiktok.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_link">Twitter/X</Label>
                <Input
                  id="twitter_link"
                  name="twitter_link"
                  value={formData.twitter_link}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_link">YouTube</Label>
                <Input
                  id="youtube_link"
                  name="youtube_link"
                  value={formData.youtube_link}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}