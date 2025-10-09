"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestRedemptionQuery() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const testQuery = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) throw new Error("Not authenticated")
        
        console.log("Current user:", user.id)
        
        // Test 1: Simple redemption query
        console.log("Test 1: Simple redemption query")
        const { data: simpleData, error: simpleError } = await supabase
          .from("redemptions")
          .select("id, customer_id, reward_id, business_id")
          .eq("customer_id", user.id)
          .limit(5)
          
        console.log("Simple query result:", simpleData, simpleError)
        
        // Test 2: Redemption with rewards join
        console.log("Test 2: Redemption with rewards join")
        const { data: rewardJoinData, error: rewardJoinError } = await supabase
          .from("redemptions")
          .select(`
            id,
            customer_id,
            reward_id,
            rewards (
              reward_name,
              points_required
            )
          `)
          .eq("customer_id", user.id)
          .limit(5)
          
        console.log("Reward join result:", rewardJoinData, rewardJoinError)
        
        // Test 3: Redemption with businesses join
        console.log("Test 3: Redemption with businesses join")
        const { data: businessJoinData, error: businessJoinError } = await supabase
          .from("redemptions")
          .select(`
            id,
            customer_id,
            business_id,
            businesses (
              business_name
            )
          `)
          .eq("customer_id", user.id)
          .limit(5)
          
        console.log("Business join result:", businessJoinData, businessJoinError)
        
        // Test 4: Full query
        console.log("Test 4: Full query")
        const { data: fullData, error: fullError } = await supabase
          .from("redemptions")
          .select(`
            id,
            redeemed_at,
            status,
            business_id,
            reward_id,
            rewards (
              reward_name,
              points_required
            ),
            businesses (
              business_name
            )
          `)
          .eq("customer_id", user.id)
          .limit(5)
          
        console.log("Full query result:", fullData, fullError)
        
        setResult({
          simple: { data: simpleData, error: simpleError },
          rewardJoin: { data: rewardJoinData, error: rewardJoinError },
          businessJoin: { data: businessJoinData, error: businessJoinError },
          full: { data: fullData, error: fullError }
        })
      } catch (err) {
        console.error("Test error:", err)
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    
    testQuery()
  }, [])

  if (loading) {
    return <div className="p-4">Loading test results...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Redemption Query Test Results</h1>
      
      {result && Object.entries(result).map(([key, value]: [string, any]) => (
        <div key={key} className="mb-6">
          <h2 className="text-xl font-semibold capitalize">{key} Query</h2>
          {value.error ? (
            <div className="text-red-500">
              <p>Error: {value.error.message}</p>
              <p>Code: {value.error.code}</p>
            </div>
          ) : (
            <div>
              <p className="text-green-500">Success</p>
              <pre className="bg-gray-100 p-2 mt-2 rounded">
                {JSON.stringify(value.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}