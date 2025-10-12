"use client"

import type React from "react"
import { useEffect } from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profileError && profile) {
          // Redirect based on role
          switch (profile.role) {
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
          // If no profile, check user metadata
          const userRole = user.user_metadata?.role
          if (userRole) {
            router.push(`/auth/setup/${userRole}`)
          }
        }
      }
    }

    checkUser()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Starting login process for:", email)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.log("[v0] Sign in error:", signInError)
        throw signInError
      }

      console.log("[v0] Sign in successful, user ID:", data.user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      console.log("[v0] Profile lookup result:", { profile, profileError })

      // If profile doesn't exist, check user metadata for role and redirect to setup
      if (profileError || !profile) {
        console.log("[v0] Profile not found, checking user metadata")
        const userRole = data.user.user_metadata?.role
        console.log("[v0] User role from metadata:", userRole)

        if (userRole) {
          // Redirect to appropriate setup wizard
          router.push(`/auth/setup/${userRole}`)
          return
        } else {
          throw new Error("Account setup incomplete. Please contact support.")
        }
      }

      console.log("[v0] Profile found, redirecting to dashboard for role:", profile.role)

      // Redirect based on role
      switch (profile.role) {
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
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/giya-logo.png" alt="Giya Logo" width={80} height={80} className="object-contain" />
        </div>
        <Card className="p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back to Giya</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="underline underline-offset-4 text-primary">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}