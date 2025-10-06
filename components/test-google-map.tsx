"use client"

import { useEffect, useState } from "react"

export function TestGoogleMap() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isKeySet, setIsKeySet] = useState(false)

  useEffect(() => {
    // Check if the API key is set
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
    setApiKey(key)
    setIsKeySet(!!key && key.length > 0)
  }, [])

  if (!isKeySet) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Google Maps API Key Not Found</h3>
        <p className="text-yellow-700 mt-2">
          Please add your Google Maps API key to your environment variables:
        </p>
        <pre className="bg-yellow-100 p-2 mt-2 rounded text-sm">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
        </pre>
        <p className="text-yellow-700 mt-2">
          Add this to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-semibold text-green-800">Google Maps API Key Detected</h3>
      <p className="text-green-700 mt-2">
        Your Google Maps API key is set and ready to use.
      </p>
      <div className="mt-3 text-sm text-green-600">
        <p>Key status: <span className="font-mono">SET</span></p>
        <p>Key length: <span className="font-mono">{apiKey?.length} characters</span></p>
      </div>
    </div>
  )
}