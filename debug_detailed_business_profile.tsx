// Detailed debug version of business profile page to identify exact error source
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function DebugDetailedBusinessProfilePage({ params }: PageProps) {
  console.log("=== DEBUG: Starting business profile debug for ID:", params.id)
  
  try {
    const supabase = await createServerClient()
    console.log("=== DEBUG: Supabase client created successfully")

    // Test 1: Fetch business details
    console.log("=== DEBUG: Fetching business details...")
    const businessResult = await supabase.from("businesses").select("*").eq("id", params.id).single()
    console.log("=== DEBUG: Business query result:", {
      data: !!businessResult.data,
      error: businessResult.error?.message,
      status: businessResult.status
    })

    if (businessResult.error || !businessResult.data) {
      console.log("=== DEBUG: Business not found, returning 404")
      console.log("=== DEBUG: Business error details:", businessResult.error)
      notFound()
    }

    const business = businessResult.data
    console.log("=== DEBUG: Business data retrieved:", {
      id: business.id,
      name: business.business_name,
      category: business.business_category
    })

    // Test 2: Fetch business rewards
    console.log("=== DEBUG: Fetching rewards...")
    const rewardsResult = await supabase
      .from("rewards")
      .select("*")
      .eq("business_id", params.id)
      .eq("is_active", true)
      .order("points_required", { ascending: true })
    console.log("=== DEBUG: Rewards query result:", {
      count: rewardsResult.data?.length,
      error: rewardsResult.error?.message,
      status: rewardsResult.status
    })

    // Test 3: Fetch discount offers with simplified query
    console.log("=== DEBUG: Fetching discount offers...")
    const discountOffersResult = await supabase
      .from("discount_offers")
      .select("*") // Simplified query
      .eq("business_id", params.id)
      .eq("is_active", true)
    console.log("=== DEBUG: Discount offers query result:", {
      count: discountOffersResult.data?.length,
      error: discountOffersResult.error?.message,
      status: discountOffersResult.status
    })

    // Test 4: Fetch exclusive offers with simplified query
    console.log("=== DEBUG: Fetching exclusive offers...")
    const exclusiveOffersResult = await supabase
      .from("exclusive_offers")
      .select("*") // Simplified query
      .eq("business_id", params.id)
      .eq("is_active", true)
    console.log("=== DEBUG: Exclusive offers query result:", {
      count: exclusiveOffersResult.data?.length,
      error: exclusiveOffersResult.error?.message,
      status: exclusiveOffersResult.status
    })

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Business Profile</h1>
        <div className="bg-green-100 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold">Success!</h2>
          <p>All queries completed successfully.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold">Business Info</h3>
            <p>ID: {business.id}</p>
            <p>Name: {business.business_name}</p>
            <p>Category: {business.business_category}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold">Counts</h3>
            <p>Rewards: {rewardsResult.data?.length || 0}</p>
            <p>Discount Offers: {discountOffersResult.data?.length || 0}</p>
            <p>Exclusive Offers: {exclusiveOffersResult.data?.length || 0}</p>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error("=== DEBUG: Server Components error:", error)
    console.error("=== DEBUG: Error name:", error?.name)
    console.error("=== DEBUG: Error message:", error?.message)
    console.error("=== DEBUG: Error stack:", error?.stack)
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Debug Error</h1>
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-xl font-semibold">Server Components Error</h2>
          <p>Error: {error instanceof Error ? error.message : "Unknown error"}</p>
          <p>Name: {error?.name || "Unknown"}</p>
          <pre className="mt-2 text-xs overflow-auto">
            {error?.stack || "No stack trace"}
          </pre>
        </div>
      </div>
    )
  }
}