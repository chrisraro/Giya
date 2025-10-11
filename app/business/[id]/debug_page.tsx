// Debug version of business profile page with enhanced error handling
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function DebugBusinessProfilePage({ params }: PageProps) {
  console.log("=== DEBUG: Starting business profile for ID:", params.id)
  
  let business: any = null;
  let rewards: any[] = [];
  let discountOffers: any[] = [];
  let exclusiveOffers: any[] = [];
  let supabaseClient: any = null;
  
  try {
    supabaseClient = await createServerClient()
    console.log("=== DEBUG: Supabase client created")

    // Fetch business details with detailed error handling
    try {
      console.log("=== DEBUG: Fetching business details...")
      const businessResult = await supabaseClient.from("businesses").select("*").eq("id", params.id).single()
      console.log("=== DEBUG: Business query result:", {
        hasData: !!businessResult.data,
        hasError: !!businessResult.error,
        error: businessResult.error?.message,
        status: businessResult.status
      })
      
      if (businessResult.error || !businessResult.data) {
        console.log("=== DEBUG: Business not found, returning 404")
        notFound()
      }
      business = businessResult.data
      console.log("=== DEBUG: Business data retrieved:", business?.business_name)
    } catch (businessError) {
      console.error("=== DEBUG: Error fetching business:", businessError)
      notFound()
    }

    // Fetch business rewards with detailed error handling
    try {
      console.log("=== DEBUG: Fetching business rewards...")
      const rewardsResult = await supabaseClient
        .from("rewards")
        .select("*")
        .eq("business_id", params.id)
        .eq("is_active", true)
        .order("points_required", { ascending: true })
      
      console.log("=== DEBUG: Rewards query result:", {
        count: rewardsResult.data?.length,
        hasError: !!rewardsResult.error,
        error: rewardsResult.error?.message,
        status: rewardsResult.status
      })
      
      rewards = rewardsResult.data || []
    } catch (rewardsError) {
      console.error("=== DEBUG: Error fetching rewards:", rewardsError)
      rewards = []
    }

    // Fetch discount offers with detailed error handling
    try {
      console.log("=== DEBUG: Fetching discount offers...")
      const discountOffersResult = await supabaseClient
        .from("discount_offers")
        .select("*")
        .eq("business_id", params.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      
      console.log("=== DEBUG: Discount offers query result:", {
        count: discountOffersResult.data?.length,
        hasError: !!discountOffersResult.error,
        error: discountOffersResult.error?.message,
        status: discountOffersResult.status
      })
      
      discountOffers = discountOffersResult.data || []
    } catch (discountError) {
      console.error("=== DEBUG: Error fetching discount offers:", discountError)
      discountOffers = []
    }

    // Fetch exclusive offers with detailed error handling
    try {
      console.log("=== DEBUG: Fetching exclusive offers...")
      const exclusiveOffersResult = await supabaseClient
        .from("exclusive_offers")
        .select("*")
        .eq("business_id", params.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      
      console.log("=== DEBUG: Exclusive offers query result:", {
        count: exclusiveOffersResult.data?.length,
        hasError: !!exclusiveOffersResult.error,
        error: exclusiveOffersResult.error?.message,
        status: exclusiveOffersResult.status
      })
      
      exclusiveOffers = exclusiveOffersResult.data || []
    } catch (exclusiveError) {
      console.error("=== DEBUG: Error fetching exclusive offers:", exclusiveError)
      exclusiveOffers = []
    }

  } catch (error: any) {
    console.error("=== DEBUG: Server Components error:", error)
    console.error("=== DEBUG: Error name:", error?.name)
    console.error("=== DEBUG: Error message:", error?.message)
    console.error("=== DEBUG: Error stack:", error?.stack)
    notFound()
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>DEBUG: Business Profile</h1>
      <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
        <h2>Business Info</h2>
        <p><strong>ID:</strong> {business?.id || 'N/A'}</p>
        <p><strong>Name:</strong> {business?.business_name || 'N/A'}</p>
        <p><strong>Category:</strong> {business?.business_category || 'N/A'}</p>
      </div>
      
      <div style={{ backgroundColor: '#e0f0ff', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
        <h2>Counts</h2>
        <p><strong>Rewards:</strong> {rewards?.length || 0}</p>
        <p><strong>Discount Offers:</strong> {discountOffers?.length || 0}</p>
        <p><strong>Exclusive Offers:</strong> {exclusiveOffers?.length || 0}</p>
      </div>
      
      <div style={{ backgroundColor: '#fff0e0', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
        <h2>Debug Info</h2>
        <p><strong>Business ID Param:</strong> {params.id}</p>
        <p><strong>Supabase Client:</strong> {supabaseClient ? 'Available' : 'Not Available'}</p>
      </div>
    </div>
  )
}