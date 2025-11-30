"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function MetaBusinessConnection() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = async () => {
    if (!accessToken || !adAccountId) {
      toast.error("Please fill in all fields")
      return
    }

    setIsConnecting(true)

    try {
      const response = await fetch("/api/meta-ads/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          adAccountId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsConnected(true)
        toast.success("Meta Business Suite connected!", {
          description: "Your ad data will now sync automatically",
        })
        
        // Clear sensitive data from state
        setAccessToken("")
      } else {
        toast.error("Failed to connect", {
          description: result.error || "Please check your credentials",
        })
      }
    } catch (error) {
      console.error("Error connecting to Meta:", error)
      toast.error("Connection failed", {
        description: "Unable to connect to Meta Business Suite",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Meta Business Suite Integration
        </CardTitle>
        <CardDescription>
          Connect your Meta Business account to automatically sync ad spend and conversion data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Connected!</strong> Your Meta Business Suite is now linked. Ad data will sync automatically.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll need a Meta access token and ad account ID. Follow the setup guide below.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Meta Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter your Meta access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from Meta Business Suite → Settings → System Users
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adAccountId">Ad Account ID</Label>
                <Input
                  id="adAccountId"
                  type="text"
                  placeholder="act_XXXXXXXXX"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: act_XXXXXXXXX (find in Ads Manager → Settings)
                </p>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isConnecting || !accessToken || !adAccountId}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Meta Business Suite"
                )}
              </Button>
            </div>
          </>
        )}

        {/* Setup Guide */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-2 text-sm">Setup Guide</h4>
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Go to Meta Business Suite → Settings → Business Settings</li>
            <li>Navigate to "System Users" and create a new system user</li>
            <li>Generate an access token with "ads_read" permission</li>
            <li>Copy your Ad Account ID from Ads Manager → Settings</li>
            <li>Paste both values above and click "Connect"</li>
          </ol>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.open("https://business.facebook.com/settings", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Meta Business Settings
          </Button>
        </div>

        {/* Security Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-xs">
            <strong>Security:</strong> Your access token is stored securely and never shared. It's only used to fetch your ad analytics data.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
