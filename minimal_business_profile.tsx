// Minimal business profile page to isolate the error
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function MinimalBusinessProfilePage({ params }: PageProps) {
  console.log("=== MINIMAL: Starting business profile for ID:", params.id)
  
  try {
    // Create Supabase client
    const supabase = await createServerClient()
    console.log("=== MINIMAL: Supabase client created")

    // Fetch only business details
    console.log("=== MINIMAL: Fetching business details...")
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name, business_category")
      .eq("id", params.id)
      .single()

    if (businessError || !business) {
      console.log("=== MINIMAL: Business not found or error:", businessError?.message)
      notFound()
    }

    console.log("=== MINIMAL: Business data:", business)

    // Fetch only rewards count
    console.log("=== MINIMAL: Fetching rewards count...")
    const { count: rewardsCount, error: rewardsError } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("business_id", params.id)
      .eq("is_active", true)

    console.log("=== MINIMAL: Rewards count:", rewardsCount, "Error:", rewardsError?.message)

    // Fetch only discount offers count
    console.log("=== MINIMAL: Fetching discount offers count...")
    const { count: discountOffersCount, error: discountError } = await supabase
      .from("discount_offers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", params.id)
      .eq("is_active", true)

    console.log("=== MINIMAL: Discount offers count:", discountOffersCount, "Error:", discountError?.message)

    // Fetch only exclusive offers count
    console.log("=== MINIMAL: Fetching exclusive offers count...")
    const { count: exclusiveOffersCount, error: exclusiveError } = await supabase
      .from("exclusive_offers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", params.id)
      .eq("is_active", true)

    console.log("=== MINIMAL: Exclusive offers count:", exclusiveOffersCount, "Error:", exclusiveError?.message)

    return (
      <div style={{ padding: '2rem' }}>
        <h1>Minimal Business Profile</h1>
        <div>
          <h2>{business.business_name}</h2>
          <p>Category: {business.business_category}</p>
          <p>Rewards Count: {rewardsCount || 0}</p>
          <p>Discount Offers Count: {discountOffersCount || 0}</p>
          <p>Exclusive Offers Count: {exclusiveOffersCount || 0}</p>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error("=== MINIMAL: Server Components error:", error)
    console.error("=== MINIMAL: Error message:", error?.message)
    console.error("=== MINIMAL: Error stack:", error?.stack)
    
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h1>Minimal Debug Error</h1>
        <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
        <pre>{error?.stack || "No stack trace"}</pre>
      </div>
    )
  }
}