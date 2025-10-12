import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const cookieStore = cookies()
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profileError && profile) {
          // Redirect based on role
          let redirectPath = "/"
          switch (profile.role) {
            case "customer":
              redirectPath = "/dashboard/customer"
              break
            case "business":
              redirectPath = "/dashboard/business"
              break
            case "influencer":
              redirectPath = "/dashboard/influencer"
              break
            default:
              redirectPath = "/"
          }
          return NextResponse.redirect(new URL(redirectPath, request.url))
        } else {
          // If no profile, check user metadata for role
          const userRole = user.user_metadata?.role
          if (userRole) {
            const redirectPath = `/auth/setup/${userRole}`
            return NextResponse.redirect(new URL(redirectPath, request.url))
          } else {
            // Default redirect if no role found
            return NextResponse.redirect(new URL("/dashboard/customer", request.url))
          }
        }
      }
    }
  }

  // Return to the login page if there's an error
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
}