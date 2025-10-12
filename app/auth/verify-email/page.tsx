import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // Logic to resend the email
    } catch (error) {
      console.error("Failed to resend email:", error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder or</p>
            <Button 
              variant="link" 
              onClick={handleResendEmail}
              disabled={isResending}
              className="p-0 h-auto text-primary"
            >
              {isResending ? "Resending..." : "click here to resend"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
