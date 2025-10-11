// Debug version of business profile page to isolate Server Components error
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function DebugBusinessProfilePage({ params }: PageProps) {
  try {
    const supabase = await createServerClient()

    // Fetch business details
    console.log("Fetching business details for ID:", params.id)
    const { data: business, error } = await supabase.from("businesses").select("*").eq("id", params.id).single()
    console.log("Business query result:", { business, error })

    if (error || !business) {
      console.log("Business not found, returning 404")
      notFound()
    }

    // Fetch business rewards
    console.log("Fetching rewards for business ID:", params.id)
    const { data: rewards } = await supabase
      .from("rewards")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("points_required", { ascending: true })
    console.log("Rewards query result:", rewards?.length || 0)

    // Fetch discount offers
    console.log("Fetching discount offers for business ID:", params.id)
    const { data: discountOffers } = await supabase
      .from("discount_offers")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    console.log("Discount offers query result:", discountOffers?.length || 0)

    // Fetch exclusive offers
    console.log("Fetching exclusive offers for business ID:", params.id)
    const { data: exclusiveOffers } = await supabase
      .from("exclusive_offers")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    console.log("Exclusive offers query result:", exclusiveOffers?.length || 0)

    return (
      <div>
        <h1>Debug Business Profile</h1>
        <p>Business Name: {business.business_name}</p>
        <p>Rewards Count: {rewards?.length || 0}</p>
        <p>Discount Offers Count: {discountOffers?.length || 0}</p>
        <p>Exclusive Offers Count: {exclusiveOffers?.length || 0}</p>
      </div>
    )
  } catch (error) {
    console.error("Server Components error:", error)
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the business profile.</p>
        <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }
}