"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PendingApprovalPage() {
  const router = useRouter()

  const handleBackToHome = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your business account has been submitted for review by our administrators. You will receive an email notification once your account has been approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p className="mb-4">
              Thank you for signing up! Our team will review your business information and approve your account shortly.
            </p>
            <Button onClick={handleBackToHome} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}