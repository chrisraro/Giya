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
          // User already has a role, redirect to appropriate setup page
          let redirectPath = "/"
          switch (user.user_metadata.role) {
            case "customer":
              redirectPath = "/auth/setup/customer"
              break
            case "business":
              redirectPath = "/auth/setup/business"
              break
            case "influencer":
              redirectPath = "/auth/setup/influencer"
              break
            default:
              redirectPath = "/"
          }
          return NextResponse.redirect(new URL(redirectPath, request.url))
        } else {
          // Check if this is a Google signup with form data
          // Try to get form data from cookies
          const googleSignupDataCookie = cookieStore.get('google_signup_data')?.value
          
          if (googleSignupDataCookie) {
            try {
              const googleSignupData = JSON.parse(googleSignupDataCookie)
              const { role, formData } = googleSignupData
              
              // Update user metadata with role and form data
              const updateData: any = {
                data: {
                  role: role,
                }
              }
              
              // Add role-specific data
              if (role === "customer") {
                updateData.data.full_name = formData.fullName
                updateData.data.nickname = formData.nickname || null
              } else if (role === "business") {
                updateData.data.business_name = formData.businessName
                updateData.data.business_category = formData.businessCategory
                updateData.data.address = formData.address
                updateData.data.gmaps_link = formData.gmapsLink || null
              } else if (role === "influencer") {
                updateData.data.full_name = formData.influencerFullName
                updateData.data.address = formData.influencerAddress
                updateData.data.facebook_link = formData.facebookLink || null
                updateData.data.tiktok_link = formData.tiktokLink || null
                updateData.data.twitter_link = formData.twitterLink || null
                updateData.data.youtube_link = formData.youtubeLink || null
              }
              
              await supabase.auth.updateUser(updateData)
              
              // Clean up the cookie by setting it to expire
              const expiredCookie = `${googleSignupDataCookie}; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
              
              // Redirect to appropriate setup page
              let redirectPath = "/"
              switch (role) {
                case "customer":
                  redirectPath = "/auth/setup/customer"
                  break
                case "business":
                  redirectPath = "/auth/setup/business"
                  break
                case "influencer":
                  redirectPath = "/auth/setup/influencer"
                  break
                default:
                  redirectPath = "/"
              }
              
              const response = NextResponse.redirect(new URL(redirectPath, request.url))
              // Set the expired cookie to clean up
              response.cookies.set('google_signup_data', expiredCookie)
              return response
            } catch (parseError) {
              console.error("Error parsing google signup data:", parseError)
            }
          }
          
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
            // User doesn't have a role yet and no form data, redirect to signup
            return NextResponse.redirect(new URL("/auth/signup", request.url))
          }
        }
      }
    }
  }

  // Return to the login page if there's an error
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
}