"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("No user data returned")
      }

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", authData.user.id)
        .eq("is_active", true)
        .single()

      if (adminError || !adminData) {
        // Not an admin, sign them out
        await supabase.auth.signOut()
        toast.error("Access denied", {
          description: "You don't have admin privileges"
        })
        return
      }

      // Update last login time
      await supabase
        .from("admins")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", adminData.id)

      toast.success("Welcome back!", {
        description: `Logged in as ${adminData.full_name}`
      })

      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Invalid credentials"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative h-16 w-16">
              <Image
                src="/giya-logo.png"
                alt="Giya Admin"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            Admin Portal
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@giya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 md:h-10 text-base"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 md:h-10 text-base"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 md:h-10 text-sm md:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              Admin access only. Unauthorized access is prohibited.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
