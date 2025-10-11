import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    console.log("=== API TEST: Starting business test")
    
    // Create Supabase client
    const supabase = await createServerClient()
    console.log("=== API TEST: Supabase client created")

    // Test business query with the specific ID from the error
    console.log("=== API TEST: Fetching business details...")
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name, business_category")
      .eq("id", "515f2f48-d984-43a5-b202-a6a258769db4")
      .single()

    console.log("=== API TEST: Business result:", { business, businessError })

    if (businessError || !business) {
      console.log("=== API TEST: Business not found or error:", businessError?.message)
      return NextResponse.json({ error: "Business not found", details: businessError?.message }, { status: 404 })
    }

    // Test rewards query
    console.log("=== API TEST: Fetching rewards...")
    const { data: rewards, error: rewardsError } = await supabase
      .from("rewards")
      .select("*")
      .eq("business_id", "515f2f48-d984-43a5-b202-a6a258769db4")
      .eq("is_active", true)

    console.log("=== API TEST: Rewards result:", { count: rewards?.length, rewardsError })

    // Test discount offers query
    console.log("=== API TEST: Fetching discount offers...")
    const { data: discountOffers, error: discountError } = await supabase
      .from("discount_offers")
      .select("*")
      .eq("business_id", "515f2f48-d984-43a5-b202-a6a258769db4")
      .eq("is_active", true)

    console.log("=== API TEST: Discount offers result:", { count: discountOffers?.length, discountError })

    // Test exclusive offers query
    console.log("=== API TEST: Fetching exclusive offers...")
    const { data: exclusiveOffers, error: exclusiveError } = await supabase
      .from("exclusive_offers")
      .select("*")
      .eq("business_id", "515f2f48-d984-43a5-b202-a6a258769db4")
      .eq("is_active", true)

    console.log("=== API TEST: Exclusive offers result:", { count: exclusiveOffers?.length, exclusiveError })

    return NextResponse.json({
      success: true,
      business,
      rewardsCount: rewards?.length || 0,
      discountOffersCount: discountOffers?.length || 0,
      exclusiveOffersCount: exclusiveOffers?.length || 0,
      rewardsError: rewardsError?.message,
      discountError: discountError?.message,
      exclusiveError: exclusiveError?.message
    })
  } catch (error: any) {
    console.error("=== API TEST: Error:", error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}