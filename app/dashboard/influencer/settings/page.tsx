// TEMPORARILY DISABLED - INFLUENCER FEATURE COMING SOON
// This page will be re-enabled in a future update

"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function InfluencerSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect influencer users to home page
    router.push("/")
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Influencer Hub Coming Soon</CardTitle>
          <CardDescription>
            The Influencer Hub feature is currently under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the homepage...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}