import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { validatePhoneNumber } from "@/lib/security-utils"

interface FacebookAuthFlowProps {
  onAuthComplete: (authMethod: 'facebook' | 'phone') => void
}

export function FacebookAuthFlow({ onAuthComplete }: FacebookAuthFlowProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)
  const [isPhoneLoading, setIsPhoneLoading] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [sentCode, setSentCode] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      
      // Store auth method in session for tracking
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_method', 'facebook')
      }
      
      onAuthComplete('facebook')
    } catch (error) {
      console.error('Facebook login error:', error)
      toast.error('Failed to authenticate with Facebook')
    } finally {
      setIsFacebookLoading(false)
    }
  }

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }
    
    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)')
      return
    }
    
    setIsPhoneLoading(true)
    
    try {
      // In a real implementation, we would send an SMS verification code
      // For demo purposes, we'll generate a mock 6-digit code
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString()
      setSentCode(mockCode)
      
      // Store phone number and auth method
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_method', 'phone')
        sessionStorage.setItem('phone_number', phoneNumber)
        sessionStorage.setItem('verification_code', mockCode)
      }
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`Verification code sent to ${phoneNumber}`)
    } catch (error) {
      console.error('Phone auth error:', error)
      toast.error('Failed to send verification code')
    } finally {
      setIsPhoneLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode) {
      toast.error('Please enter the verification code')
      return
    }
    
    // In a real implementation, we would verify the code with the backend
    // For demo, we'll check against the stored code
    const storedCode = typeof window !== 'undefined' ? sessionStorage.getItem('verification_code') : null
    
    if (verificationCode === storedCode) {
      setIsPhoneVerified(true)
      toast.success('Phone number verified successfully!')
      onAuthComplete('phone')
    } else {
      toast.error('Invalid verification code')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authenticate to Continue</CardTitle>
        <CardDescription>
          Please authenticate to verify your receipt and earn points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleFacebookLogin}
            disabled={isFacebookLoading || isPhoneLoading || isPhoneVerified}
            className="w-full"
          >
            {isFacebookLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Icons.facebook className="mr-2 h-4 w-4" />
                Continue with Facebook
              </>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with phone
              </span>
            </div>
          </div>
          
          {!isPhoneVerified ? (
            <>
              <form onSubmit={handleSendVerificationCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789 or +639123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                      disabled={isFacebookLoading || isPhoneLoading}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isFacebookLoading || isPhoneLoading || !phoneNumber}
                >
                  {isPhoneLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
              
              {sentCode && (
                <form onSubmit={handleVerifyCode} className="space-y-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isFacebookLoading || isPhoneLoading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isFacebookLoading || isPhoneLoading || !verificationCode}
                  >
                    Verify Code
                  </Button>
                </form>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>Phone number verified successfully!</span>
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  )
}