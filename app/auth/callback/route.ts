import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const state = searchParams.get("state") // Get the state parameter for CSRF protection

  // Note: Supabase OAuth automatically handles CSRF protection via the state parameter
  // The state parameter is verified by Supabase internally during exchangeCodeForSession

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // ============================================================
        // NEW META PIXEL ATTRIBUTION LOGIC (First Touch)
        // ============================================================
        // Check if there's a referral business ID from the cookie
        const referralBusinessId = cookieStore.get('referral_business_id')?.value
        let isNewSignup = false
        let referringBusinessPixelId: string | null = null
        
        if (referralBusinessId) {
          // Check if user already has a profile with referred_by set
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('referred_by, created_at')
            .eq('id', user.id)
            .single()
          
          // Only set referred_by if it's currently NULL (First Touch Attribution)
          if (existingProfile && !existingProfile.referred_by) {
            await supabase
              .from('profiles')
              .update({ referred_by: referralBusinessId })
              .eq('id', user.id)
            
            console.log(`[Auth Callback] Attributed user ${user.id} to business ${referralBusinessId}`)
            
            // Check if this is a new signup (created within last 5 minutes)
            const createdAt = new Date(existingProfile.created_at)
            const now = new Date()
            const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60
            isNewSignup = minutesSinceCreation < 5
            
            // Get the referring business's pixel ID
            const { data: referringBusiness } = await supabase
              .from('businesses')
              .select('meta_pixel_id')
              .eq('id', referralBusinessId)
              .single()
            
            if (referringBusiness?.meta_pixel_id) {
              referringBusinessPixelId = referringBusiness.meta_pixel_id
              console.log(`[Auth Callback] Will fire CompleteRegistration for pixel: ${referringBusinessPixelId}`)
            }
          } else if (!existingProfile) {
            // Profile doesn't exist yet - will be created in setup, mark as new signup
            isNewSignup = true
            
            // Get the referring business's pixel ID
            const { data: referringBusiness } = await supabase
              .from('businesses')
              .select('meta_pixel_id')
              .eq('id', referralBusinessId)
              .single()
            
            if (referringBusiness?.meta_pixel_id) {
              referringBusinessPixelId = referringBusiness.meta_pixel_id
              
              // Store pixel ID in cookie for setup page to fire event
              cookieStore.set('meta_pixel_tracking', JSON.stringify({
                pixelId: referringBusinessPixelId,
                eventType: 'CompleteRegistration',
                businessId: referralBusinessId
              }), {
                maxAge: 60 * 10, // 10 minutes
                httpOnly: false, // Need to be accessible from client
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              })
              
              console.log(`[Auth Callback] Stored pixel tracking cookie for setup page: ${referringBusinessPixelId}`)
            }
          }
        }
        
        // ============================================================
        // LEGACY AFFILIATE CODE (for influencer system - if still needed)
        // ============================================================
        const affiliateReferralCode = cookieStore.get('affiliate_referral_code')?.value
        
        // If there's an affiliate referral code, update user metadata
        if (affiliateReferralCode) {
          await supabase.auth.updateUser({
            data: {
              referral_code: affiliateReferralCode
            }
          })
        }
        
        // Check if user already has a role in user_metadata (from signup)
        if (user.user_metadata?.role) {
          // Prevent influencer access - feature disabled
          if (user.user_metadata.role === "influencer") {
            return NextResponse.redirect(new URL("/auth/signup?error=influencer_disabled", request.url))
          }
          
          // Redirect to appropriate setup page
          let redirectPath = "/"
          switch (user.user_metadata.role) {
            case "customer":
              redirectPath = "/auth/setup/customer"
              break
            case "business":
              redirectPath = "/auth/setup/business"
              break
            default:
              redirectPath = "/"
          }
          const response = NextResponse.redirect(new URL(redirectPath, request.url))
          response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
          response.headers.set('Pragma', 'no-cache')
          response.headers.set('Expires', '0')
          
          // Add Meta Pixel tracking cookie to response if available
          if (referringBusinessPixelId) {
            response.cookies.set('meta_pixel_tracking', JSON.stringify({
              pixelId: referringBusinessPixelId,
              eventType: 'CompleteRegistration',
              businessId: referralBusinessId
            }), {
              maxAge: 60 * 10, // 10 minutes
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            })
          }
          
          return response
        } else {
          // Check if this is a Google or Facebook signup with form data
          // Try to get form data from cookies
          const googleSignupDataCookie = cookieStore.get('google_signup_data')?.value
          const facebookSignupDataCookie = cookieStore.get('facebook_signup_data')?.value
          
          const signupDataCookie = googleSignupDataCookie || facebookSignupDataCookie
          const cookieName = googleSignupDataCookie ? 'google_signup_data' : 'facebook_signup_data'
          
          if (signupDataCookie) {
            try {
              const signupData = JSON.parse(signupDataCookie)
              const { role, formData } = signupData
              
              // Prevent influencer access - feature disabled
              if (role === "influencer") {
                const response = NextResponse.redirect(new URL("/auth/signup?error=influencer_disabled", request.url))
                response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' })
                return response
              }
              
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
                default:
                  redirectPath = "/"
              }
              
              const response = NextResponse.redirect(new URL(redirectPath, request.url))
              // Set the expired cookie to clean up
              response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' })
              
              // Add Meta Pixel tracking cookie to response if available
              if (referringBusinessPixelId) {
                response.cookies.set('meta_pixel_tracking', JSON.stringify({
                  pixelId: referringBusinessPixelId,
                  eventType: 'CompleteRegistration',
                  businessId: referralBusinessId
                }), {
                  maxAge: 60 * 10, // 10 minutes
                  httpOnly: false,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/'
                })
              }
              
              // Add cache control headers
              response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
              response.headers.set('Pragma', 'no-cache')
              response.headers.set('Expires', '0')
              return response
            } catch (parseError) {
              console.error("Error parsing OAuth signup data:", parseError)
            }
          }
          
          // Check if user already has a profile in the database (for existing users)
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

          if (!profileError && profile) {
            // Prevent influencer access - feature disabled
            if (profile.role === "influencer") {
              return NextResponse.redirect(new URL("/auth/signup?error=influencer_disabled", request.url))
            }
            
            // User has a profile, redirect to appropriate dashboard
            let redirectPath = "/"
            switch (profile.role) {
              case "customer":
                redirectPath = "/dashboard/customer"
                break
              case "business":
                redirectPath = "/dashboard/business"
                break
              case "admin":
                redirectPath = "/admin/dashboard"
                break
              default:
                redirectPath = "/"
            }
            
            // Use forceRefresh to clear any cached redirects
            const response = NextResponse.redirect(new URL(redirectPath, request.url))
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
            response.headers.set('Pragma', 'no-cache')
            response.headers.set('Expires', '0')
            return response
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