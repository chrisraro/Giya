import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if there's a referral code in cookies
        const referralCode = cookieStore.get('affiliate_referral_code')?.value
        
        // If there's a referral code, update user metadata
        if (referralCode) {
          await supabase.auth.updateUser({
            data: {
              referral_code: referralCode
            }
          })
        }
        
        // Check if user already has a role in user_metadata (from signup)
        if (user.user_metadata?.role) {
          // User already has a role, redirect to appropriate dashboard
          let redirectPath = "/"
          switch (user.user_metadata.role) {
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
          // Check if user already has a profile in the database (for existing users)
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

          if (!profileError && profile) {
            // User has a profile, redirect to appropriate dashboard
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
            // User doesn't have a role yet, redirect to role selection
            return NextResponse.redirect(new URL("/auth/role-selection", request.url))
          }
        }
      }
    }
  }

  // Return to the login page if there's an error
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
}