"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function InfluencerSignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    address: "",
    facebookLink: "",
    tiktokLink: "",
    twitterLink: "",
    youtubeLink: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/setup/influencer`,
          data: {
            role: "influencer",
            full_name: formData.fullName,
            address: formData.address,
            facebook_link: formData.facebookLink,
            tiktok_link: formData.tiktokLink,
            twitter_link: formData.twitterLink,
            youtube_link: formData.youtubeLink,
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
            <CardTitle className="text-2xl">Create Influencer Account</CardTitle>
            <CardDescription>Promote businesses and earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
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
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Social Media Links (Optional)</h3>
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="facebookLink">Facebook</Label>
                      <Input
                        id="facebookLink"
                        type="url"
                        placeholder="https://facebook.com/..."
                        value={formData.facebookLink}
                        onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tiktokLink">TikTok</Label>
                      <Input
                        id="tiktokLink"
                        type="url"
                        placeholder="https://tiktok.com/@..."
                        value={formData.tiktokLink}
                        onChange={(e) => setFormData({ ...formData, tiktokLink: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="twitterLink">X (Twitter)</Label>
                      <Input
                        id="twitterLink"
                        type="url"
                        placeholder="https://x.com/..."
                        value={formData.twitterLink}
                        onChange={(e) => setFormData({ ...formData, twitterLink: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="youtubeLink">YouTube</Label>
                      <Input
                        id="youtubeLink"
                        type="url"
                        placeholder="https://youtube.com/@..."
                        value={formData.youtubeLink}
                        onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                      />
                    </div>
                  </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
