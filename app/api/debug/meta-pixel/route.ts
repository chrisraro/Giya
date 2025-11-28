import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Debug endpoint to troubleshoot Meta Pixel conversion tracking
 * Usage: GET /api/debug/meta-pixel?businessId=YOUR_BUSINESS_ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")
    
    if (!businessId) {
      return NextResponse.json({ 
        error: "Missing businessId parameter",
        usage: "GET /api/debug/meta-pixel?businessId=YOUR_BUSINESS_ID"
      }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check cookies
    const referralCookie = cookieStore.get('referral_business_id')
    const trackingCookie = cookieStore.get('meta_pixel_tracking')
    
    // Check business info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, business_name, meta_pixel_id, is_active')
      .eq('id', businessId)
      .single()
    
    // Check referral stats
    const { count: referralCount, error: referralError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', businessId)
    
    // Get sample referred profiles
    const { data: sampleProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, referred_by, created_at')
      .eq('referred_by', businessId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Check current user's attribution
    let currentUserAttribution = null
    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, email, role, referred_by, created_at')
        .eq('id', user.id)
        .single()
      
      currentUserAttribution = userProfile
    }
    
    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        currentUser: user ? {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role
        } : null,
        cookies: {
          referralBusinessId: referralCookie?.value || null,
          metaPixelTracking: trackingCookie ? JSON.parse(trackingCookie.value) : null
        },
        business: business || null,
        businessError: businessError?.message || null,
        referralStats: {
          totalReferrals: referralCount || 0,
          sampleProfiles: sampleProfiles || [],
          error: referralError?.message || null
        },
        currentUserAttribution: currentUserAttribution,
        checks: {
          hasMetaPixelId: !!business?.meta_pixel_id,
          businessIsActive: business?.is_active || false,
          hasReferralCookie: !!referralCookie,
          hasTrackingCookie: !!trackingCookie,
          userIsAuthenticated: !!user
        }
      },
      recommendations: generateRecommendations({
        business,
        referralCookie,
        trackingCookie,
        referralCount,
        user,
        currentUserAttribution
      })
    })
    
  } catch (error) {
    console.error('[Debug Meta Pixel] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateRecommendations(data: any): string[] {
  const recommendations: string[] = []
  
  if (!data.business) {
    recommendations.push("❌ Business not found. Check if the businessId is correct.")
  } else {
    if (!data.business.meta_pixel_id) {
      recommendations.push("❌ Meta Pixel ID not configured. Go to Business Settings and add your Meta Pixel ID.")
    } else {
      recommendations.push(`✅ Meta Pixel ID found: ${data.business.meta_pixel_id}`)
    }
    
    if (!data.business.is_active) {
      recommendations.push("⚠️ Business account is inactive. Contact admin for approval.")
    }
  }
  
  if (!data.referralCookie) {
    recommendations.push("❌ No referral cookie found. Make sure you're accessing the site via referral link: /?ref=BUSINESS_ID")
  } else {
    recommendations.push(`✅ Referral cookie set for business: ${data.referralCookie.value}`)
  }
  
  if (data.referralCount === 0) {
    recommendations.push("⚠️ No referrals tracked yet. Test the flow:")
    recommendations.push("   1. Open incognito/private window")
    recommendations.push(`   2. Visit: /?ref=${data.business?.id}`)
    recommendations.push("   3. Sign up with Google/Facebook/Email")
    recommendations.push("   4. Complete profile setup")
    recommendations.push("   5. Check browser console for tracking logs")
  } else {
    recommendations.push(`✅ ${data.referralCount} referrals tracked successfully!`)
  }
  
  if (data.user && data.currentUserAttribution) {
    if (data.currentUserAttribution.referred_by === data.business?.id) {
      recommendations.push(`✅ Current user IS attributed to this business`)
    } else if (data.currentUserAttribution.referred_by) {
      recommendations.push(`⚠️ Current user is attributed to different business: ${data.currentUserAttribution.referred_by}`)
    } else {
      recommendations.push(`⚠️ Current user has NO attribution (referred_by is NULL)`)
    }
  }
  
  if (!data.trackingCookie && data.referralCookie) {
    recommendations.push("ℹ️ Referral cookie exists but tracking cookie not set. This is normal before signup completes.")
  }
  
  return recommendations
}
