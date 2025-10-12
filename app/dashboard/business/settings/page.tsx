"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, MapPin, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { GoogleMap } from "@/components/google-map"
// Add breadcrumb components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { ProfileImageUpload } from "@/components/profile-image-upload"

interface BusinessData {
  id: string
  business_name: string
  business_category: string
  address: string
  gmaps_link: string | null
  profile_pic_url: string | null
  points_per_currency: number
  business_hours: any
}

export default function BusinessProfileSettings() {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [formData, setFormData] = useState({
    business_name: "",
    business_category: "",
    address: "",
    gmaps_link: "",
    points_per_currency: 100,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Get Google Maps API key from environment variables
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

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

        // Fetch business data
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", user.id)
          .single()

        if (businessError) throw businessError

        setBusinessData(business)
        setFormData({
          business_name: business.business_name || "",
          business_category: business.business_category || "",
          address: business.address || "",
          gmaps_link: business.gmaps_link || "",
          points_per_currency: business.points_per_currency || 100,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessData) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          business_name: formData.business_name,
          business_category: formData.business_category,
          address: formData.address,
          gmaps_link: formData.gmaps_link || null,
          points_per_currency: formData.points_per_currency,
        })
        .eq("id", businessData.id)

      if (error) throw error

      toast.success("Profile updated successfully!")
      
      // Update local state
      setBusinessData({
        ...businessData,
        ...formData,
        gmaps_link: formData.gmaps_link || null,
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (businessData) {
      setBusinessData({
        ...businessData,
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

  if (!businessData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load business data</CardDescription>
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
              onClick={() => router.push("/dashboard/business")}
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
              <BreadcrumbLink href="/dashboard/business">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrent>
              Settings
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Business Profile Settings</h1>
            <p className="text-muted-foreground">Manage your business information and preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-6">
                  <ProfileImageUpload
                    currentImageUrl={businessData.profile_pic_url}
                    userId={businessData.id}
                    userType="business"
                    onImageUpdate={handleImageUpdate}
                    size="lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_category">Business Category</Label>
                  <Input
                    id="business_category"
                    name="business_category"
                    value={formData.business_category}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmaps_link">Google Maps Link</Label>
                  <Input
                    id="gmaps_link"
                    name="gmaps_link"
                    value={formData.gmaps_link}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a full Google Maps URL for your business location
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points_per_currency">Points Per Currency</Label>
                  <Input
                    id="points_per_currency"
                    name="points_per_currency"
                    type="number"
                    min="1"
                    value={formData.points_per_currency}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    How many points customers earn per peso spent (e.g., 1 point per ₱{formData.points_per_currency})
                  </p>
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
                <CardTitle>Location Preview</CardTitle>
                <CardDescription>How your location will appear to customers</CardDescription>
              </CardHeader>
              <CardContent>
                {formData.gmaps_link ? (
                  <div className="space-y-4">
                    <GoogleMap 
                      url={formData.gmaps_link} 
                      address={formData.address} 
                      apiKey={googleMapsApiKey}
                    />
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {formData.address}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Enter a Google Maps link to preview your location
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  )
}