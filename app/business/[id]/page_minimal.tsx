import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function BusinessProfilePage({ params }: PageProps) {
  let business: any = null;
  let rewards: any[] = [];
  let discountOffers: any[] = [];
  let exclusiveOffers: any[] = [];
  let supabaseClient: any = null;
  
  try {
    supabaseClient = await createServerClient()

    // Fetch business details
    const businessResult = await supabaseClient.from("businesses").select("*").eq("id", params.id).single()
    if (businessResult.error || !businessResult.data) {
      notFound()
    }
    business = businessResult.data

    // Fetch business rewards
    const rewardsResult = await supabaseClient
      .from("rewards")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("points_required", { ascending: true })
    rewards = rewardsResult.data || []

    // Fetch discount offers
    const discountOffersResult = await supabaseClient
      .from("discount_offers")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    discountOffers = discountOffersResult.data || []

    // Fetch exclusive offers
    const exclusiveOffersResult = await supabaseClient
      .from("exclusive_offers")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    exclusiveOffers = exclusiveOffersResult.data || []

  } catch (error) {
    console.error("Server Components error:", error)
    notFound()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Business Profile</h1>
      <div>
        <h2>{business?.business_name || 'Business'}</h2>
        <p>Category: {business?.business_category || 'Category'}</p>
        <p>Rewards: {rewards?.length || 0}</p>
        <p>Discount Offers: {discountOffers?.length || 0}</p>
        <p>Exclusive Offers: {exclusiveOffers?.length || 0}</p>
      </div>
    </div>
  )
}