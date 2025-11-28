"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, MapPin, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { GoogleMap } from "@/components/google-map"
import { BusinessQRCode } from "@/components/business-qr-code"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { ProfileImageUpload } from "@/components/profile-image-upload"
import { DomErrorBoundary } from "@/components/shared/dom-error-boundary"

interface BusinessData {
  id: string
  business_name: string
  business_category: string
  address: string
  gmaps_link: string | null
  profile_pic_url: string | null
  points_per_currency: number
  business_hours: any
  description: string | null
  access_link: string | null
  access_qr_code: string | null
  latitude: number | null
  longitude: number | null
  meta_pixel_id: string | null
}

export default function BusinessProfileSettings() {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [formData, setFormData] = useState({
    business_name: "",
    business_category: "",
    address: "",
    gmaps_link: "",
    points_per_currency: 100,
    description: "",
    meta_pixel_id: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedReferralLink, setCopiedReferralLink] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isComponentMounted = useRef(true)
  
  // Get Google Maps API key from environment variables
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  useEffect(() => {
    isComponentMounted.current = true
    fetchData()
    
    // Cleanup function
    return () => {
      isComponentMounted.current = false
    }
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isComponentMounted.current) {
          router.push("/auth/login")
        }
        return
      }

      // Fetch business data
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", user.id)
        .single()

      if (businessError) throw businessError

      if (isComponentMounted.current) {
        setBusinessData(business)
        setFormData({
          business_name: business.business_name || "",
          business_category: business.business_category || "",
          address: business.address || "",
          gmaps_link: business.gmaps_link || "",
          points_per_currency: business.points_per_currency || 100,
          description: business.description || "",
          meta_pixel_id: business.meta_pixel_id || ""
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      if (isComponentMounted.current) {
        toast.error("Failed to load profile data")
      }
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false)
      }
    }
  }

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
      const updateData = {
        business_name: formData.business_name,
        business_category: formData.business_category,
        address: formData.address,
        gmaps_link: formData.gmaps_link || null,
        points_per_currency: formData.points_per_currency,
        description: formData.description || null,
        meta_pixel_id: formData.meta_pixel_id || null
      }

      const { error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", businessData.id)

      if (error) throw error

      if (isComponentMounted.current) {
        toast.success("Profile updated successfully!")
        
        // Update local state
        setBusinessData({
          ...businessData,
          ...formData
        } as BusinessData)
      }
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      if (isComponentMounted.current) {
        toast.error("Failed to update profile")
      }
    } finally {
      if (isComponentMounted.current) {
        setIsSaving(false)
      }
    }
  }

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (businessData && isComponentMounted.current) {
      setBusinessData({
        ...businessData,
        profile_pic_url: newImageUrl
      })
    }
  }

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/?ref=${businessData?.id}`
    navigator.clipboard.writeText(referralLink)
    setCopiedReferralLink(true)
    toast.success("Referral link copied to clipboard!")
    setTimeout(() => setCopiedReferralLink(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!businessData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
    <DomErrorBoundary fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Temporary Error</CardTitle>
            <CardDescription>There was an issue loading the settings page. Please refresh the page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-secondary">
        <header className="border-b bg-background">
          <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
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

        <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
              <BreadcrumbItem>
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
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your business, services, and what makes you unique..."
                      rows={4}
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
                      Paste the Google Maps link to your business location
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

              {/* Meta Pixel Integration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Meta Pixel Integration</CardTitle>
                  <CardDescription>
                    Connect your Meta (Facebook) Pixel to track conversions from your referral link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                    <Input
                      id="meta_pixel_id"
                      name="meta_pixel_id"
                      value={formData.meta_pixel_id}
                      onChange={handleInputChange}
                      placeholder="123456789012345"
                    />
                    <p className="text-sm text-muted-foreground">
                      Find your Pixel ID in Meta Events Manager. This tracks when customers sign up via your referral link.
                    </p>
                    <a 
                      href="https://www.facebook.com/business/help/952192354843755?id=1205376682832142" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      How to find your Pixel ID
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Referral Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${businessData?.id}`}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyReferralLink}
                      >
                        {copiedReferralLink ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this link in your Meta ads. When customers click it, they're automatically 
                      redirected to customer signup for better conversion tracking.
                    </p>
                  </div>

                  {formData.meta_pixel_id && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <h4 className="font-medium text-blue-900 mb-2">✓ Pixel Connected</h4>
                      <p className="text-sm text-blue-700">
                        Your Meta Pixel (<code className="font-mono">{formData.meta_pixel_id}</code>) will track:
                      </p>
                      <ul className="text-sm text-blue-700 list-disc list-inside mt-2 space-y-1">
                        <li>CompleteRegistration when customers sign up via your link</li>
                        <li>Purchase events for first-time transactions from referred customers</li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">
                          ✨ New Feature: Referral links now auto-redirect to signup for better tracking!
                        </p>
                      </div>
                    </div>
                  )}
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
              <BusinessQRCode 
                businessId={businessData.id}
                businessName={businessData.business_name}
                accessLink={businessData.access_link}
                accessQRCode={businessData.access_qr_code}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Location Preview</CardTitle>
                  <CardDescription>Preview of your business location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.gmaps_link ? (
                    <GoogleMap 
                      url={formData.gmaps_link} 
                      address={formData.address} 
                      apiKey={googleMapsApiKey}
                    />
                  ) : (
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                      <div className="text-center p-4">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No Google Maps link provided
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Add a Google Maps link to preview your location
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </main>
      </div>
    </DomErrorBoundary>
  )
}