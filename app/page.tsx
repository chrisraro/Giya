import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1"
import { HeroSection2 } from "@/components/pro-blocks/landing-page/hero-sections/hero-section-2"
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1"
import { BusinessDiscovery } from "@/components/business-discovery"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getReferralPixelId } from "@/lib/tracking/referral-tracking"
import { BusinessPixel } from "@/components/tracking/business-pixel"

export default async function Page() {
  // Check if user is authenticated
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect them to their dashboard
  if (user) {
    // Get user role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile) {
      // Redirect to appropriate dashboard based on role
      switch (profile.role) {
        case "customer":
          redirect("/dashboard/customer")
        case "business":
          redirect("/dashboard/business")
        case "influencer":
          redirect("/dashboard/influencer")
        default:
          // If no role found, redirect to customer dashboard as default
          redirect("/dashboard/customer")
      }
    }
  }

  // Get referral business pixel ID from cookie (if user came via ?ref=BUSINESS_ID)
  const referralPixelId = await getReferralPixelId()

  return (
    <main>
      {/* Dynamic Meta Pixel - Only loads if referred by a business */}
      <BusinessPixel pixelId={referralPixelId} />
      
      <LpNavbar1 />
      <HeroSection2 />
      <BusinessDiscovery />
      <Footer1 />
    </main>
  )
}