"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function BlobConfigTestPage() {
  const [envVars, setEnvVars] = useState({
    blobTokenExists: false,
    blobTokenValue: "",
  })
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if environment variables are set
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    setEnvVars({
      blobTokenExists: !!blobToken,
      blobTokenValue: blobToken ? `${blobToken.substring(0, 10)}...` : "Not set",
    })
  }, [])

  const testBlobUpload = async () => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      // Test the upload API route
      const response = await fetch('/api/blob/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'test/test-file.txt',
          contentType: 'text/plain',
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`Success! Upload URL generated: ${data.url}`)
        toast.success("Blob upload test successful!")
      } else {
        setTestResult(`Error: ${data.error}`)
        toast.error(`Blob upload test failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Test error:", error)
      setTestResult(`Exception: ${error.message}`)
      toast.error(`Blob upload test exception: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Vercel Blob Configuration Test</CardTitle>
          <CardDescription>Check if Vercel Blob is properly configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="font-medium">BLOB_READ_WRITE_TOKEN</p>
                <p className={`mt-1 ${envVars.blobTokenExists ? 'text-green-600' : 'text-red-600'}`}>
                  {envVars.blobTokenExists ? '✓ Set' : '✗ Not set'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Value: {envVars.blobTokenValue}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Test Blob Upload</h3>
            <Button 
              onClick={testBlobUpload} 
              disabled={isLoading || !envVars.blobTokenExists}
            >
              {isLoading ? "Testing..." : "Test Blob Upload"}
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <p className="font-medium">Test Result:</p>
                <p className="mt-1 font-mono text-sm">{testResult}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Instructions</h3>
            <div className="space-y-2 text-sm">
              <p>
                1. Make sure you have set the <code className="bg-muted px-1 rounded">BLOB_READ_WRITE_TOKEN</code> environment variable in your Vercel project settings.
              </p>
              <p>
                2. The token should be obtained from your Vercel Blob storage settings.
              </p>
              <p>
                3. If the environment variable is not set, the API routes will fail with a 500 error.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}