"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, Camera, Smartphone, Building2 } from "lucide-react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { toast } from "sonner"
import { MobileCustomerBottomNav } from "@/components/mobile-customer-bottom-nav"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function CustomerDiscoverPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedBusiness, setScannedBusiness] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleQrScan = () => {
    setIsScanning(true)
    setIsDialogOpen(true)
  }

  useEffect(() => {
    if (isDialogOpen && isScanning && !scannedBusiness) {
      startScanner()
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [isDialogOpen, isScanning, scannedBusiness])

  const startScanner = () => {
    if (scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scannerRef.current = scanner

    scanner.render(
      async (decodedText: string) => {
        // QR code scanned successfully
        scanner.clear()
        scannerRef.current = null
        
        try {
          // Parse the QR code data (should contain business ID)
          const businessId = decodedText
          
          // Fetch business details
          const { data: businessData, error: businessError } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", businessId)
            .single()

          if (businessError) throw businessError

          if (businessData) {
            setScannedBusiness(businessData)
          } else {
            toast.error("Business not found")
          }
        } catch (error) {
          console.error("Error processing QR code:", error)
          toast.error("Failed to process QR code")
        }
      },
      (errorMessage) => {
        // Error scanning QR code
        console.warn("QR scanning error:", errorMessage)
      }
    )
  }

  const handleDiscoverBusiness = async () => {
    if (!scannedBusiness) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to discover businesses")
        return
      }

      // Check if business is already discovered
      const { data: existingDiscovery, error: existingError } = await supabase
        .from("customer_businesses")
        .select("*")
        .eq("customer_id", user.id)
        .eq("business_id", scannedBusiness.id)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError
      }

      if (existingDiscovery) {
        toast.info("Business already discovered")
        setIsDialogOpen(false)
        setScannedBusiness(null)
        setIsScanning(false)
        return
      }

      // Add business to customer's discovered businesses
      const { error: insertError } = await supabase
        .from("customer_businesses")
        .insert({
          customer_id: user.id,
          business_id: scannedBusiness.id
        })

      if (insertError) {
        throw insertError
      }

      // Also create an initial transaction record for this business
      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          customer_id: user.id,
          business_id: scannedBusiness.id,
          amount_spent: 0,
          points_earned: 0,
          transaction_date: new Date().toISOString()
        })

      if (transactionError) {
        console.warn("Could not create initial transaction record:", transactionError)
        // Don't throw error here as the discovery was successful
      }

      toast.success("Business discovered successfully!")
      setIsDialogOpen(false)
      setScannedBusiness(null)
      setIsScanning(false)
      
      // Redirect to customer dashboard to show the newly discovered business
      router.push(`/dashboard/customer`)
    } catch (error) {
      console.error("Error discovering business:", error)
      toast.error("Failed to discover business: " + (error as Error).message)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setScannedBusiness(null)
    setIsScanning(false)
  }

  return (
    <DashboardLayout
      userRole="customer"
      userName="Customer"
      breadcrumbs={[
        { label: "Discover" }
      ]}
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Discover New Businesses</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Point your camera at a business QR code to discover them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-md aspect-square bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
              
              <Button 
                onClick={handleQrScan}
                className="w-full max-w-md"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Scan QR Code
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                Scan a business QR code to discover their rewards, discounts, and exclusive offers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Scan a business QR code with your camera
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Discover</h3>
                <p className="text-sm text-muted-foreground">
                  Discover their rewards and offers
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Save</h3>
                <p className="text-sm text-muted-foreground">
                  Save to your discovered businesses after first transaction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* QR Scanner Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {scannedBusiness ? "Business Found" : "Scan QR Code"}
            </DialogTitle>
          </DialogHeader>
          
          {isScanning && !scannedBusiness ? (
            <div className="flex flex-col items-center gap-4">
              <div id="reader" className="w-full" />
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          ) : scannedBusiness ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {scannedBusiness.profile_pic_url ? (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden">
                    <img 
                      src={scannedBusiness.profile_pic_url} 
                      alt={scannedBusiness.business_name} 
                      className="object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                ) : (
                  <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{scannedBusiness.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{scannedBusiness.business_category}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={handleDiscoverBusiness}>
                  Discover Business
                </Button>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Mobile Bottom Navigation */}
      <MobileCustomerBottomNav onQrScan={handleQrScan} />
    </DashboardLayout>
  )
}