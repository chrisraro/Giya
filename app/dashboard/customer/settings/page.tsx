"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, QrCode, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
// Add breadcrumb components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { ProfileImageUpload } from "@/components/profile-image-upload"

interface CustomerData {
  id: string
  full_name: string
  nickname: string | null
  profile_pic_url: string | null
  qr_code_data: string
  total_points: number
}

export default function CustomerProfileSettings() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch customer data
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", user.id)
          .single()

        if (customerError) throw customerError

        setCustomerData(customer)
        setFormData({
          full_name: customer.full_name || "",
          nickname: customer.nickname || "",
        })
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerData) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: formData.full_name,
          nickname: formData.nickname || null,
        })
        .eq("id", customerData.id)

      if (error) throw error

      toast.success("Profile updated successfully!")
      
      // Update local state
      setCustomerData({
        ...customerData,
        ...formData,
        nickname: formData.nickname || null,
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (customerData) {
      setCustomerData({
        ...customerData,
        profile_pic_url: newImageUrl
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!customerData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load customer data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard/customer")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/customer">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrent>
              Settings
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customer Profile Settings</h1>
            <p className="text-muted-foreground">Manage your profile information and preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-6">
                  <ProfileImageUpload
                    currentImageUrl={customerData.profile_pic_url}
                    userId={customerData.id}
                    userType="customer"
                    onImageUpdate={handleImageUpdate}
                    size="lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your QR Code</CardTitle>
                <CardDescription>This QR code is used to earn points at businesses</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG value={customerData.qr_code_data} size={200} level="H" />
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm font-medium text-muted-foreground">{customerData.qr_code_data}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Show this QR code at participating businesses to earn points
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  )
}