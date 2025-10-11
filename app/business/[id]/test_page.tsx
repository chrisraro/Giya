// Test page to check if the issue is with the specific business ID
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function TestBusinessProfilePage({ params }: PageProps) {
  console.log("=== TEST: Starting business profile test for ID:", params.id)
  
  try {
    const supabase = await createServerClient()
    console.log("=== TEST: Supabase client created")

    // Simple test - just fetch the business
    console.log("=== TEST: Fetching business...")
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, business_name, business_category")
      .eq("id", params.id)
      .single()

    console.log("=== TEST: Business query result:", { business, error })

    if (error || !business) {
      console.log("=== TEST: Business not found or error:", error?.message)
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h1>Business Not Found</h1>
          <p>Error: {error?.message || 'Business not found'}</p>
          <p>ID: {params.id}</p>
        </div>
      )
    }

    // If we get here, the business exists
    return (
      <div style={{ padding: '2rem' }}>
        <h1>TEST: Business Found Successfully</h1>
        <div>
          <p><strong>ID:</strong> {business.id}</p>
          <p><strong>Name:</strong> {business.business_name}</p>
          <p><strong>Category:</strong> {business.business_category}</p>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error("=== TEST: Server error:", error)
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h1>Server Error</h1>
        <p>Error: {error?.message || 'Unknown error'}</p>
        <p>ID: {params.id}</p>
        <pre>{error?.stack}</pre>
      </div>
    )
  }
}