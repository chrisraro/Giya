"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Megaphone, User } from "lucide-react"
import Image from "next/image"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-6">
          <Image src="/giya-logo.png" alt="Giya Logo" width={80} height={80} className="object-contain" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join Giya</h1>
          <p className="text-muted-foreground">Choose your account type to get started</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Earn points and redeem rewards at local businesses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/signup/customer">Sign up as Customer</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Business</CardTitle>
              <CardDescription>Create loyalty programs and engage with customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/signup/business">Sign up as Business</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Influencer</CardTitle>
              <CardDescription>Promote businesses and earn rewards through referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/signup/influencer">Sign up as Influencer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4 text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
