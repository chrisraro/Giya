"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, QrCode, TrendingUp, Gift, Award, Settings, Building2, Tag, RefreshCw, Check, Star } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { OptimizedImage } from "@/components/optimized-image"
import { toast } from "sonner"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Html5QrScanner } from "@/components/html5-qr-scanner";
import { PunchCardScanner } from "@/components/punch-card-scanner";

// Use the HTML5 QR scanner component with proper error handling
const QrScanner = Html5QrScanner;

// Import types from the hook
import type { CustomerData, BusinessPoints, Transaction, Redemption } from "@/hooks/use-dashboard-data"

// Import new components
import { MobileCustomerBottomNav } from "@/components/mobile-customer-bottom-nav"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

interface BusinessDiscovery {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
  points_per_currency: number
  rewards_count?: number
  exclusive_offers_count?: number
  max_discount?: number
}

interface Reward {
  id: string
  reward_name: string
  points_required: number
  business_id: string
  business_name: string
  business_profile_pic?: string | null
  image_url?: string | null
  customer_points?: number
}

interface Discount {
  id: string
  discount_value: number
  business_id: string
  business_name: string
  business_profile_pic?: string | null
  image_url?: string | null
}

interface ExclusiveOffer {
  id: string
  offer_name: string
  business_id: string
  business_name: string
  business_profile_pic?: string | null
  product_name: string
  original_price: number | null
  discounted_price: number | null
  discount_percentage: number | null
  image_url: string | null
}

interface Deal {
  id: string
  title: string
  business_id: string
  business_name: string
  business_profile_pic?: string | null
  deal_type: string // 'discount' | 'exclusive'
  discount_percentage: number | null
  discount_value: number | null
  original_price: number | null
  exclusive_price: number | null
  image_url: string | null
  description: string | null
  is_active: boolean
  validity_start: string | null
  validity_end: string | null
}

export default function CustomerDashboard() {
  const [discoveredBusinesses, setDiscoveredBusinesses] = useState<any[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [exclusiveOffers, setExclusiveOffers] = useState<ExclusiveOffer[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const { data, isLoading, error, refetch } = useDashboardData({ userType: 'customer' })

  // Fetch businesses where customer has transactions and their offers
  useEffect(() => {
    const fetchBusinessesWithTransactionsAndOffers = async () => {
      try {
        // First, fetch all businesses where this customer has transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from("points_transactions")
          .select("business_id")
          .eq("customer_id", data?.customer?.id)

        if (transactionError) {
          console.error("Error fetching customer transactions:", transactionError)
          throw transactionError
        }

        // Get unique business IDs from transactions
        const transactionBusinessIds = [...new Set(transactionData?.map((item: any) => item.business_id) || [])]
        
        // Also include businesses where customer has redemptions
        const { data: redemptionData, error: redemptionError } = await supabase
          .from("redemptions")
          .select("business_id")
          .eq("customer_id", data?.customer?.id)

        let businessIds = transactionBusinessIds

        if (!redemptionError && redemptionData) {
          // Get unique business IDs from redemptions
          const redemptionBusinessIds = [...new Set(redemptionData.map((item: any) => item.business_id))]
          // Combine both arrays and remove duplicates
          businessIds = [...new Set([...transactionBusinessIds, ...redemptionBusinessIds])]
        }

        if (businessIds.length === 0) {
          setDiscoveredBusinesses([])
          setRewards([])
          setDiscounts([])
          setExclusiveOffers([])
          return
        }

        // Fetch business details
        const { data: businessesData, error: businessesError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency")
          .in("id", businessIds)

        if (businessesError) {
          console.error("Error fetching business details:", businessesError)
          throw businessesError
        }

        setDiscoveredBusinesses(businessesData || [])

        // Fetch rewards from businesses where customer has transactions
        const { data: rewardsData, error: rewardsError } = await supabase
          .from("rewards")
          .select(`
            id, 
            reward_name, 
            points_required,
            image_url,
            business_id,
            businesses!inner (business_name, profile_pic_url)
          `)
          .in("business_id", businessIds)
          .eq("is_active", true)
          .limit(10)

        if (rewardsError) {
          console.error("Error fetching rewards:", rewardsError)
        } else if (rewardsData) {
          // Fetch customer points for each business
          const rewardsWithPoints = await Promise.all(rewardsData.map(async (reward: any) => {
            // Get customer points for this business
            const { data: pointsData, error: pointsError } = await supabase
              .from("points_transactions")
              .select("points_earned")
              .eq("customer_id", data?.customer?.id)
              .eq("business_id", reward.business_id)

            let totalPoints = 0
            if (!pointsError && pointsData) {
              totalPoints = pointsData.reduce((sum: number, transaction: any) => sum + transaction.points_earned, 0)
              
              // Subtract redeemed points
              const { data: redemptionsData, error: redemptionsError } = await supabase
                .from("redemptions")
                .select("points_redeemed")
                .eq("customer_id", data?.customer?.id)
                .eq("business_id", reward.business_id)
                
              if (!redemptionsError && redemptionsData) {
                const redeemedPoints = redemptionsData.reduce((sum: number, redemption: any) => sum + redemption.points_redeemed, 0)
                totalPoints -= redeemedPoints
              }
            }

            return {
              id: reward.id,
              reward_name: reward.reward_name,
              points_required: reward.points_required,
              image_url: reward.image_url,
              business_id: reward.business_id,
              business_name: reward.businesses?.business_name || 'Unknown Business',
              business_profile_pic: reward.businesses?.profile_pic_url || null,
              customer_points: totalPoints
            }
          }))

          setRewards(rewardsWithPoints)
        }

        // Fetch discounts from businesses where customer has transactions
        const { data: discountsData, error: discountsError } = await supabase
          .from("discount_offers")
          .select(`
            id, 
            discount_value,
            image_url,
            business_id,
            businesses!inner (business_name, profile_pic_url)
          `)
          .in("business_id", businessIds)
          .eq("is_active", true)
          .limit(10)

        if (discountsError) {
          console.error("Error fetching discounts:", discountsError)
        } else if (discountsData) {
          const formattedDiscounts = discountsData.map((discount: any) => ({
            id: discount.id,
            discount_value: discount.discount_value,
            image_url: discount.image_url,
            business_id: discount.business_id,
            business_name: discount.businesses?.business_name || 'Unknown Business',
            business_profile_pic: discount.businesses?.profile_pic_url || null
          }))
          setDiscounts(formattedDiscounts)
        }

        // Fetch exclusive offers from businesses where customer has transactions
        const { data: exclusiveOffersData, error: exclusiveOffersError } = await supabase
          .from("exclusive_offers")
          .select(`
            id,
            title,
            product_name,
            original_price,
            discounted_price,
            discount_percentage,
            image_url,
            business_id,
            businesses!inner (business_name, profile_pic_url)
          `)
          .in("business_id", businessIds)
          .eq("is_active", true)
          .limit(10)

        if (exclusiveOffersError) {
          console.error("Error fetching exclusive offers:", exclusiveOffersError)
        } else if (exclusiveOffersData) {
          const formattedExclusiveOffers = exclusiveOffersData.map((offer: any) => ({
            id: offer.id,
            offer_name: offer.title,
            product_name: offer.product_name,
            original_price: offer.original_price,
            discounted_price: offer.discounted_price,
            discount_percentage: offer.discount_percentage,
            image_url: offer.image_url,
            business_id: offer.business_id,
            business_name: offer.businesses?.business_name || 'Unknown Business',
            business_profile_pic: offer.businesses?.profile_pic_url || null
          }))
          setExclusiveOffers(formattedExclusiveOffers)
        }

        // Fetch unified deals from businesses where customer has transactions
        const { data: dealsData, error: dealsError } = await supabase
          .from("deals")
          .select(`
            id,
            title,
            description,
            deal_type,
            discount_percentage,
            discount_value,
            original_price,
            exclusive_price,
            image_url,
            is_active,
            validity_start,
            validity_end,
            business_id,
            businesses!inner (business_name, profile_pic_url)
          `)
          .in("business_id", businessIds)
          .eq("is_active", true)
          .or("validity_end.is.null,validity_end.gt.now()")
          .limit(10)

        if (dealsError) {
          console.error("Error fetching deals:", dealsError)
        } else if (dealsData) {
          const formattedDeals = dealsData.map((deal: any) => ({
            id: deal.id,
            title: deal.title,
            description: deal.description,
            deal_type: deal.deal_type,
            discount_percentage: deal.discount_percentage,
            discount_value: deal.discount_value,
            original_price: deal.original_price,
            exclusive_price: deal.exclusive_price,
            image_url: deal.image_url,
            is_active: deal.is_active,
            validity_start: deal.validity_start,
            validity_end: deal.validity_end,
            business_id: deal.business_id,
            business_name: deal.businesses?.business_name || 'Unknown Business',
            business_profile_pic: deal.businesses?.profile_pic_url || null
          }))
          setDeals(formattedDeals)
        }
      } catch (error) {
        console.error("Error fetching businesses with transactions and offers:", error)
        setDiscoveredBusinesses([])
        setRewards([])
        setDiscounts([])
        setExclusiveOffers([])
        setDeals([])
      }
    }

    if (data?.customer?.id) {
      fetchBusinessesWithTransactionsAndOffers()
    }
  }, [data?.customer?.id, supabase])

  // Add real-time subscription for redemption validations
  useEffect(() => {
    // Only subscribe if we have customer data
    if (!data?.customer?.id) {
      return;
    }

    console.log("[v0] Setting up redemption validation subscription for customer:", data.customer.id);
    
    const channel = supabase
      .channel('redemption-validation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
          filter: 'status=eq.validated'
        },
        (payload: any) => {
          console.log("[v0] Received redemption validation update:", payload);
          // Check if this redemption belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('Redemption Validated!', {
              description: `Your redemption has been validated by the business.`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            refetch()
          }
        }
      )
      .subscribe((status: any) => {
        console.log("[v0] Redemption validation subscription status:", status);
      })

    // Cleanup function
    return () => {
      console.log("[v0] Cleaning up redemption validation subscription");
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn("[v0] Error cleaning up redemption validation subscription:", error);
      }
    }
  }, [data?.customer?.id, refetch])

  // Add real-time subscription for new transactions
  useEffect(() => {
    // Only subscribe if we have customer data
    if (!data?.customer?.id) {
      return;
    }

    console.log("[v0] Setting up transaction subscription for customer:", data.customer.id);
    
    const channel = supabase
      .channel('customer-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions'
        },
        (payload: any) => {
          console.log("[v0] Received new transaction:", payload);
          // Check if this transaction belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('New Transaction!', {
              description: `You've earned ${payload.new.points_earned} points!`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            refetch()
          }
        }
      )
      .subscribe((status: any) => {
        console.log("[v0] Transaction subscription status:", status);
      })

    // Cleanup function
    return () => {
      console.log("[v0] Cleaning up transaction subscription");
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn("[v0] Error cleaning up transaction subscription:", error);
      }
    }
  }, [data?.customer?.id, refetch])

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [scannedBusinessId, setScannedBusinessId] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showRedemptionQR, setShowRedemptionQR] = useState(false)
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>("")
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showPunchCardScanner, setShowPunchCardScanner] = useState(false)

  const handleQrScan = () => {
    setIsQrScannerOpen(true)
  }

  const handleQrScanSuccess = async (data: string) => {
    try {
      // Assume the QR code contains the business ID
      const businessId = data
      
      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single()

      if (businessError) throw businessError

      if (businessData) {
        setScannedBusinessId(businessId)
        // Redirect to the business page
        router.push(`/business/${businessId}`)
      } else {
        toast.error("Business not found")
      }
    } catch (error) {
      console.error("Error processing QR code:", error)
      toast.error("Failed to process QR code")
    } finally {
      setIsQrScannerOpen(false)
    }
  }

  const handleClaimReward = async (reward: Reward) => {
    if (!data?.customer?.id) {
      toast.error("You must be logged in to claim rewards")
      return
    }

    if (reward.customer_points && reward.customer_points < reward.points_required) {
      toast.error("Not enough points to claim this reward")
      return
    }

    // Show confirmation dialog first
    setSelectedReward(reward)
    setShowRedeemDialog(true)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !data?.customer?.id) {
      return
    }

    setIsRedeeming(true)

    try {
      const redemptionCode = `GIYA-REDEEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      console.log("[Claim Reward] Attempting to create redemption:", {
        customer_id: data.customer.id,
        reward_id: selectedReward.id,
        business_id: selectedReward.business_id,
        points_redeemed: selectedReward.points_required,
        redemption_qr_code: redemptionCode
      })

      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          customer_id: data.customer.id,
          reward_id: selectedReward.id,
          business_id: selectedReward.business_id,
          points_redeemed: selectedReward.points_required,
          redemption_qr_code: redemptionCode,
          status: "pending",
        })
        .select()
        .single()

      if (redemptionError) {
        console.error("[Claim Reward] Database error:", redemptionError)
        throw redemptionError
      }

      console.log("[Claim Reward] Redemption created successfully:", redemption)

      // Update local rewards state to reflect the point deduction
      setRewards(prevRewards => 
        prevRewards.map(r => 
          r.id === selectedReward.id 
            ? { ...r, customer_points: (r.customer_points || 0) - selectedReward.points_required }
            : r
        )
      )

      toast.success("Reward claimed! Show the QR code to the business.")

      // Set QR code data
      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        reward: selectedReward,
        redemption: redemption,
      })
      
      // Close confirmation dialog first
      setShowRedeemDialog(false)
      setIsRedeeming(false)
      
      // Wait for dialog animation to complete before opening QR dialog
      setTimeout(() => {
        console.log("[Claim Reward] Opening QR Code dialog with code:", redemptionCode)
        setShowRedemptionQR(true)
      }, 300)
    } catch (error) {
      console.error("[Claim Reward] Failed to claim reward:", error)
      toast.error("Failed to claim reward: " + (error instanceof Error ? error.message : "Unknown error"))
      setIsRedeeming(false)
    }
  }

  const handleRedeemDiscount = async (discount: Discount) => {
    if (!data?.customer?.id) {
      toast.error("You must be logged in to redeem discounts")
      return
    }

    try {
      // For discount offers, we generate a QR code that the business can scan
      const redemptionCode = `GIYA-DISCOUNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${discount.id}`

      console.log("[Redeem Discount] Generating QR code:", redemptionCode)

      toast.success("Discount ready! Show the QR code to the business when making a purchase.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        offer: discount,
        type: "discount"
      })
      setShowRedemptionQR(true)

      console.log("[Redeem Discount] Modal state set - should be visible now")
    } catch (error) {
      console.error("[Redeem Discount] Failed to process discount:", error)
      toast.error("Failed to process discount")
    }
  }

  const handleRedeemExclusiveOffer = async (offer: ExclusiveOffer) => {
    if (!data?.customer?.id) {
      toast.error("You must be logged in to redeem exclusive offers")
      return
    }

    try {
      // For exclusive offers, we generate a QR code that the business can scan
      const redemptionCode = `GIYA-EXCLUSIVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${offer.id}`

      console.log("[Redeem Exclusive] Generating QR code:", redemptionCode)

      toast.success("Exclusive offer ready! Show the QR code to the business to claim your offer.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        offer: offer,
        type: "exclusive"
      })
      setShowRedemptionQR(true)

      console.log("[Redeem Exclusive] Modal state set - should be visible now")
    } catch (error) {
      console.error("[Redeem Exclusive] Failed to process exclusive offer:", error)
      toast.error("Failed to process exclusive offer")
    }
  }

  const handleRefresh = async () => {
    try {
      // Refetch all data
      await refetch()
      
      // Also manually refetch discovered businesses and offers
      const fetchDiscoveredBusinessesAndOffers = async () => {
        try {
          // First, fetch discovered businesses for this customer
          const { data: discoveredData, error: discoveredError } = await supabase
            .from("customer_businesses")
            .select("business_id")
            .eq("customer_id", data?.customer?.id)

          if (discoveredError) {
            console.error("Error fetching discovered businesses:", discoveredError)
            throw discoveredError
          }

          const businessIds = discoveredData?.map((item: any) => item.business_id) || []
          
          if (businessIds.length === 0) {
            setDiscoveredBusinesses([])
            setRewards([])
            setDiscounts([])
            setExclusiveOffers([])
            setDeals([])
            return
          }

          // Fetch business details
          const { data: businessesData, error: businessesError } = await supabase
            .from("businesses")
            .select("id, business_name, business_category, profile_pic_url, points_per_currency")
            .in("id", businessIds)

          if (businessesError) {
            console.error("Error fetching business details:", businessesError)
            throw businessesError
          }

          setDiscoveredBusinesses(businessesData || [])

          // Fetch rewards from discovered businesses
          const { data: rewardsData, error: rewardsError } = await supabase
            .from("rewards")
            .select(`
              id, 
              reward_name, 
              points_required,
              image_url,
              business_id,
              businesses!inner (business_name, profile_pic_url)
            `)
            .in("business_id", businessIds)
            .eq("is_active", true)
            .limit(10)

          if (rewardsError) {
            console.error("Error fetching rewards:", rewardsError)
          } else if (rewardsData) {
            // Fetch customer points for each business
            const rewardsWithPoints = await Promise.all(rewardsData.map(async (reward: any) => {
              // Get customer points for this business
              const { data: pointsData, error: pointsError } = await supabase
                .from("points_transactions")
                .select("points_earned")
                .eq("customer_id", data?.customer?.id)
                .eq("business_id", reward.business_id)

              let totalPoints = 0
              if (!pointsError && pointsData) {
                totalPoints = pointsData.reduce((sum: number, transaction: any) => sum + transaction.points_earned, 0)
                
                // Subtract redeemed points
                const { data: redemptionsData, error: redemptionsError } = await supabase
                  .from("redemptions")
                  .select("points_redeemed")
                  .eq("customer_id", data?.customer?.id)
                  .eq("business_id", reward.business_id)
                  
                if (!redemptionsError && redemptionsData) {
                  const redeemedPoints = redemptionsData.reduce((sum: number, redemption: any) => sum + redemption.points_redeemed, 0)
                  totalPoints -= redeemedPoints
                }
              }

              return {
                id: reward.id,
                reward_name: reward.reward_name,
                points_required: reward.points_required,
                image_url: reward.image_url,
                business_id: reward.business_id,
                business_name: reward.businesses?.business_name || 'Unknown Business',
                business_profile_pic: reward.businesses?.profile_pic_url || null,
                customer_points: totalPoints
              }
            }))

            setRewards(rewardsWithPoints)
          }

          // Fetch discounts from discovered businesses
          const { data: discountsData, error: discountsError } = await supabase
            .from("discount_offers")
            .select(`
              id, 
              discount_value,
              image_url,
              business_id,
              businesses!inner (business_name, profile_pic_url)
            `)
            .in("business_id", businessIds)
            .eq("is_active", true)
            .limit(10)

          if (discountsError) {
            console.error("Error fetching discounts:", discountsError)
          } else if (discountsData) {
            const formattedDiscounts = discountsData.map((discount: any) => ({
              id: discount.id,
              discount_value: discount.discount_value,
              image_url: discount.image_url,
              business_id: discount.business_id,
              business_name: discount.businesses?.business_name || 'Unknown Business',
              business_profile_pic: discount.businesses?.profile_pic_url || null
            }))
            setDiscounts(formattedDiscounts)
          }

          // Fetch exclusive offers from discovered businesses
          const { data: exclusiveOffersData, error: exclusiveOffersError } = await supabase
            .from("exclusive_offers")
            .select(`
              id, 
              title,
              product_name,
              original_price,
              discounted_price,
              discount_percentage,
              image_url,
              business_id,
              businesses!inner (business_name, profile_pic_url)
            `)
            .in("business_id", businessIds)
            .eq("is_active", true)
            .limit(10)

          if (exclusiveOffersError) {
            console.error("Error fetching exclusive offers:", exclusiveOffersError)
          } else if (exclusiveOffersData) {
            const formattedExclusiveOffers = exclusiveOffersData.map((offer: any) => ({
              id: offer.id,
              offer_name: offer.title,
              product_name: offer.product_name,
              original_price: offer.original_price,
              discounted_price: offer.discounted_price,
              discount_percentage: offer.discount_percentage,
              image_url: offer.image_url,
              business_id: offer.business_id,
              business_name: offer.businesses?.business_name || 'Unknown Business',
              business_profile_pic: offer.businesses?.profile_pic_url || null
            }))
            setExclusiveOffers(formattedExclusiveOffers)
          }
        } catch (error) {
          console.error("Error fetching discovered businesses and offers:", error)
          setDiscoveredBusinesses([])
          setRewards([])
          setDiscounts([])
          setExclusiveOffers([])
        }
      }

      if (data?.customer?.id) {
        await fetchDiscoveredBusinessesAndOffers()
      }
      
      toast.success("Data refreshed successfully!")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    }
  }

  // Add a refresh button to the UI
  const renderRefreshButton = () => (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh}
      className="ml-2"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  )

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Loading..."
        breadcrumbs={[]}
      >
        {/* Main Content with skeleton loading */}
        <div className="flex flex-col gap-6">
          {/* Greeting skeleton */}
          <Skeleton className="h-8 w-64" />
          
          {/* QR Code Card skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="h-48 w-48 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>

          {/* Rewards Section skeleton */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileCustomerBottomNav 
                  onQrScan={handleQrScan} 
                  onPunchCardScan={() => router.push('/dashboard/customer/punch-cards')}
                />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Error Loading Dashboard</CardTitle>
              <CardDescription className="text-center">
                There was an error loading your dashboard. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-destructive text-center">
                {(error as any) instanceof Error ? (error as any).message : "An unknown error occurred"}
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileCustomerBottomNav 
                  onQrScan={handleQrScan} 
                  onPunchCardScan={() => router.push('/dashboard/customer/punch-cards')}
                />
      </DashboardLayout>
    )
  }

  // QR Code Card Component
  const QrCodeCard = ({ qrCodeData }: { qrCodeData: string }) => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Your QR Code</CardTitle>
        <CardDescription className="text-center">
          Show this to businesses for transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG value={qrCodeData} size={192} />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          This QR code is unique to you. Businesses can scan it to award points.
        </p>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout
      userRole="customer"
      userName={data?.customer?.full_name || "Customer"}
      breadcrumbs={[]}
    >
      {/* Hide most content on mobile since we have bottom nav */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-6">
          {/* Customer QR Code - Prominent for easy scanning */}
          {data?.customer?.qr_code_data && (
            <div className="flex items-center justify-between">
              <QrCodeCard 
                qrCodeData={data?.customer?.qr_code_data || ""}
              />
            </div>
          )}

          {/* Rewards Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Top Rewards</h2>
            </div>
            {rewards.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card 
                    key={reward.id} 
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${reward.image_url ? 'p-0' : ''}`}
                    onClick={() => router.push(`/business/${reward.business_id}`)}
                  >
                    {reward.image_url ? (
                      <>
                        <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                          <OptimizedImage
                            src={reward.image_url}
                            alt={reward.reward_name || "Reward"}
                            width={400}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardHeader className="p-4 bg-transparent">
                          <div className="flex items-center gap-3">
                            {reward.business_profile_pic ? (
                              <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                <OptimizedImage 
                                  src={reward.business_profile_pic} 
                                  alt={reward.business_name || "Business"} 
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{reward.reward_name}</p>
                              <p className="text-sm text-muted-foreground truncate">{reward.business_name}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Points required</span>
                              <span className="font-medium">{reward.points_required}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Your points</span>
                              <span className="font-medium text-primary">{reward.customer_points || 0}</span>
                            </div>
                          </div>
                          <Button 
                            className="w-full mt-4" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(reward);
                            }}
                            disabled={!reward.customer_points || reward.customer_points < reward.points_required}
                          >
                            <Gift className="mr-2 h-4 w-4" />
                            {reward.customer_points && reward.customer_points >= reward.points_required 
                              ? "Claim Reward" 
                              : `Need ${reward.points_required - (reward.customer_points || 0)} more points`}
                          </Button>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {reward.business_profile_pic ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <OptimizedImage 
                                src={reward.business_profile_pic} 
                                alt={reward.business_name || "Business"} 
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{reward.reward_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{reward.business_name}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Points required</span>
                            <span className="font-medium">{reward.points_required}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your points</span>
                            <span className="font-medium text-primary">{reward.customer_points || 0}</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimReward(reward);
                          }}
                          disabled={!reward.customer_points || reward.customer_points < reward.points_required}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          {reward.customer_points && reward.customer_points >= reward.points_required 
                            ? "Claim Reward" 
                            : `Need ${reward.points_required - (reward.customer_points || 0)} more points`}
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No rewards available from your discovered businesses yet.</p>
            )}
          </div>

          {/* Discounts Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Top Discounts</h2>
            </div>
            {discounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {discounts.map((discount) => (
                  <Card 
                    key={discount.id}
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${discount.image_url ? 'p-0' : ''}`}
                    onClick={() => router.push(`/business/${discount.business_id}`)}
                  >
                    {discount.image_url ? (
                      <>
                        <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                          <OptimizedImage
                            src={discount.image_url}
                            alt={discount.business_name || "Discount"}
                            width={400}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardHeader className="p-4 bg-transparent">
                          <div className="flex items-center gap-3">
                            {discount.business_profile_pic ? (
                              <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                <OptimizedImage 
                                  src={discount.business_profile_pic} 
                                  alt={discount.business_name || "Business"} 
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{discount.business_name}</p>
                              <p className="text-sm text-muted-foreground">Discount Offer</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Discount</span>
                            <span className="font-medium">{discount.discount_value}%</span>
                          </div>
                          <Button 
                            className="w-full mt-4" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeemDiscount(discount);
                            }}
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            Redeem Now
                          </Button>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {discount.business_profile_pic ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <OptimizedImage 
                                src={discount.business_profile_pic} 
                                alt={discount.business_name || "Business"} 
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{discount.business_name}</p>
                            <p className="text-sm text-muted-foreground">Discount Offer</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Discount</span>
                          <span className="font-medium">{discount.discount_value}%</span>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRedeemDiscount(discount);
                          }}
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          Redeem Now
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No discounts available from your discovered businesses yet.</p>
            )}
          </div>

          {/* Deals Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Deals & Promotions</h2>
            </div>
            {deals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {deals.map((deal) => (
                  <Card
                    key={deal.id}
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${deal.image_url ? 'p-0' : ''}`}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    {deal.image_url ? (
                      <>
                        <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                          <OptimizedImage
                            src={deal.image_url}
                            alt={deal.title || "Deal"}
                            width={400}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardHeader className="p-4 bg-transparent">
                          <div className="flex items-center gap-3">
                            {deal.business_profile_pic ? (
                              <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                <OptimizedImage
                                  src={deal.business_profile_pic}
                                  alt={deal.business_name || "Business"}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{deal.business_name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{deal.deal_type} Deal</p>
                            </div>
                          </div>
                          <CardTitle className="mt-3 text-lg truncate">{deal.title}</CardTitle>
                          {deal.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{deal.description}</p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="mt-4 space-y-3">
                            {deal.deal_type === 'discount' && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Discount</span>
                                  <span className="font-medium">
                                    {deal.discount_percentage ? `${deal.discount_percentage}%` : `${deal.discount_value}`}
                                  </span>
                                </div>
                                {deal.original_price && deal.exclusive_price && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Price</span>
                                    <div className="flex items-center gap-2">
                                      <span className="line-through text-sm text-muted-foreground">${deal.original_price}</span>
                                      <span className="font-medium text-red-600">${deal.exclusive_price}</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            {deal.deal_type === 'exclusive' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Special Price</span>
                                <span className="font-medium">${deal.exclusive_price}</span>
                              </div>
                            )}
                            {deal.validity_end && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Valid until</span>
                                <span className="font-medium text-xs">{new Date(deal.validity_end).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to the deals page where deals can be viewed and redeemed
                              router.push(`/deals/${deal.id}`);
                            }}
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            View Deal
                          </Button>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {deal.business_profile_pic ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <OptimizedImage
                                src={deal.business_profile_pic}
                                alt={deal.business_name || "Business"}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{deal.business_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{deal.deal_type} Deal</p>
                          </div>
                        </div>
                        <CardTitle className="mt-3 text-lg truncate">{deal.title}</CardTitle>
                        {deal.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{deal.description}</p>
                        )}
                        <div className="mt-4 space-y-2">
                          {deal.deal_type === 'discount' && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Discount</span>
                              <span className="font-medium">
                                {deal.discount_percentage ? `${deal.discount_percentage}%` : `${deal.discount_value}`}
                              </span>
                            </div>
                          )}
                          {deal.deal_type === 'exclusive' && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Special Price</span>
                              <span className="font-medium">${deal.exclusive_price}</span>
                            </div>
                          )}
                          {deal.validity_end && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Valid until</span>
                              <span className="font-medium text-xs">{new Date(deal.validity_end).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/deals/${deal.id}`);
                          }}
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          View Deal
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="w-full">
                <p className="text-muted-foreground text-center py-4">No deals available from your discovered businesses yet.</p>
              </div>
            )}
          </div>

          {/* Exclusive Offers Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Exclusive Offers</h2>
            </div>
            {exclusiveOffers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exclusiveOffers.map((offer) => (
                  <Card 
                    key={offer.id} 
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${offer.image_url ? 'p-0' : ''}`}
                    onClick={() => router.push(`/business/${offer.business_id}`)}
                  >
                    {offer.image_url ? (
                      <>
                        <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                          <OptimizedImage
                            src={offer.image_url}
                            alt={offer.offer_name || "Exclusive Offer"}
                            width={400}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardHeader className="p-4 bg-transparent">
                          <div className="flex items-center gap-3">
                            {offer.business_profile_pic ? (
                              <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                <OptimizedImage 
                                  src={offer.business_profile_pic} 
                                  alt={offer.business_name || "Business"} 
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{offer.offer_name}</p>
                              <p className="text-sm text-muted-foreground truncate">{offer.business_name}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="mt-3">
                            <p className="text-sm font-medium text-muted-foreground">{offer.product_name}</p>
                            <div className="mt-2 space-y-1">
                              {offer.original_price && (
                                <p className="text-sm text-muted-foreground line-through">
                                  ₱{offer.original_price.toFixed(2)}
                                </p>
                              )}
                              <p className="text-xl font-bold text-primary">
                                {offer.discounted_price ? `₱${offer.discounted_price.toFixed(2)}` : "Special Offer"}
                              </p>
                              {offer.discount_percentage && (
                                <p className="text-sm text-green-600 font-medium">
                                  Save {offer.discount_percentage.toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            className="w-full mt-4" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeemExclusiveOffer(offer);
                            }}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Redeem Now
                          </Button>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {offer.business_profile_pic ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <OptimizedImage 
                                src={offer.business_profile_pic} 
                                alt={offer.business_name || "Business"} 
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{offer.offer_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{offer.business_name}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground">{offer.product_name}</p>
                          <div className="mt-2 space-y-1">
                            {offer.original_price && (
                              <p className="text-sm text-muted-foreground line-through">
                                ₱{offer.original_price.toFixed(2)}
                              </p>
                            )}
                            <p className="text-xl font-bold text-primary">
                              {offer.discounted_price ? `₱${offer.discounted_price.toFixed(2)}` : "Special Offer"}
                            </p>
                            {offer.discount_percentage && (
                              <p className="text-sm text-green-600 font-medium">
                                Save {offer.discount_percentage.toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRedeemExclusiveOffer(offer);
                          }}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Redeem Now
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No exclusive offers available from your discovered businesses yet.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile View - Simplified Content */}
      <div className="md:hidden flex flex-col gap-6">
        {/* Customer QR Code - Prominent for easy scanning */}
        {data?.customer?.qr_code_data && (
          <div className="flex items-center justify-between">
            <QrCodeCard 
              qrCodeData={data?.customer?.qr_code_data || ""}
            />
          </div>
        )}

        {/* Rewards Section - Carousel for mobile */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Rewards</h2>
          </div>
          {rewards.length > 0 ? (
            <div className="md:hidden">
              <Carousel
                opts={{
                  align: "start",
                  slidesToScroll: 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {rewards.map((reward) => (
                    <CarouselItem key={reward.id} className="basis-[85%] md:basis-1/2 lg:basis-1/3 pl-2">
                      <div className="p-1">
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${reward.image_url ? 'p-0' : ''}`}
                          onClick={() => router.push(`/business/${reward.business_id}`)}
                        >
                          {reward.image_url ? (
                            <>
                              <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                                <OptimizedImage
                                  src={reward.image_url}
                                  alt={reward.reward_name || "Reward"}
                                  width={400}
                                  height={160}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex items-center gap-3">
                                  {reward.business_profile_pic ? (
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                      <OptimizedImage 
                                        src={reward.business_profile_pic} 
                                        alt={reward.business_name} 
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                      <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{reward.reward_name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{reward.business_name}</p>
                                  </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Points required</span>
                                    <span className="font-medium">{reward.points_required}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Your points</span>
                                    <span className="font-medium text-primary">{reward.customer_points || 0}</span>
                                  </div>
                                </div>
                                <Button 
                                  className="w-full mt-4" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaimReward(reward);
                                  }}
                                  disabled={!reward.customer_points || reward.customer_points < reward.points_required}
                                >
                                  <Gift className="mr-2 h-4 w-4" />
                                  {reward.customer_points && reward.customer_points >= reward.points_required 
                                    ? "Claim Reward" 
                                    : `Need ${reward.points_required - (reward.customer_points || 0)} more points`}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {reward.business_profile_pic ? (
                                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                    <OptimizedImage 
                                      src={reward.business_profile_pic} 
                                      alt={reward.business_name || "Business"} 
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{reward.reward_name}</p>
                                  <p className="text-sm text-muted-foreground truncate">{reward.business_name}</p>
                                </div>
                              </div>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Points required</span>
                                  <span className="font-medium">{reward.points_required}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Your points</span>
                                  <span className="font-medium text-primary">{reward.customer_points || 0}</span>
                                </div>
                              </div>
                              <Button 
                                className="w-full mt-4" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimReward(reward);
                                }}
                                disabled={!reward.customer_points || reward.customer_points < reward.points_required}
                              >
                                <Gift className="mr-2 h-4 w-4" />
                                {reward.customer_points && reward.customer_points >= reward.points_required 
                                  ? "Claim Reward" 
                                  : `Need ${reward.points_required - (reward.customer_points || 0)} more points`}
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No rewards available from your discovered businesses yet.</p>
          )}
        </div>

        {/* Discounts Section - Carousel for mobile */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Discounts</h2>
          </div>
          {discounts.length > 0 ? (
            <div className="md:hidden">
              <Carousel
                opts={{
                  align: "start",
                  slidesToScroll: 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {discounts.map((discount) => (
                    <CarouselItem key={discount.id} className="basis-[85%] md:basis-1/2 lg:basis-1/3 pl-2">
                      <div className="p-1">
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${discount.image_url ? 'p-0' : ''}`}
                          onClick={() => router.push(`/business/${discount.business_id}`)}
                        >
                          {discount.image_url ? (
                            <>
                              <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                                <OptimizedImage
                                  src={discount.image_url}
                                  alt={discount.business_name || "Discount"}
                                  width={400}
                                  height={160}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex items-center gap-3">
                                  {discount.business_profile_pic ? (
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                      <OptimizedImage 
                                        src={discount.business_profile_pic} 
                                        alt={discount.business_name} 
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                      <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{discount.business_name}</p>
                                    <p className="text-sm text-muted-foreground">Discount Offer</p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Discount</span>
                                  <span className="font-medium">{discount.discount_value}%</span>
                                </div>
                                <Button 
                                  className="w-full mt-4" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRedeemDiscount(discount);
                                  }}
                                >
                                  <Tag className="mr-2 h-4 w-4" />
                                  Redeem Now
                                </Button>
                              </div>
                            </>
                          ) : (
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {discount.business_profile_pic ? (
                                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                    <OptimizedImage 
                                      src={discount.business_profile_pic} 
                                      alt={discount.business_name || "Business"} 
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{discount.business_name}</p>
                                  <p className="text-sm text-muted-foreground">Discount Offer</p>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Discount</span>
                                <span className="font-medium">{discount.discount_value}%</span>
                              </div>
                              <Button 
                                className="w-full mt-4" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRedeemDiscount(discount);
                                }}
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                Redeem Now
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No discounts available from your discovered businesses yet.</p>
          )}
        </div>

        {/* Deals Section - Carousel for mobile */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Deals & Promotions</h2>
          </div>
          {deals.length > 0 ? (
            <div className="md:hidden">
              <Carousel
                opts={{
                  align: "start",
                  slidesToScroll: 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {deals.map((deal) => (
                    <CarouselItem key={deal.id} className="basis-[85%] md:basis-1/2 lg:basis-1/3 pl-2">
                      <div className="p-1">
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${deal.image_url ? 'p-0' : ''}`}
                          onClick={() => router.push(`/deals/${deal.id}`)}
                        >
                          {deal.image_url ? (
                            <>
                              <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                                <OptimizedImage
                                  src={deal.image_url}
                                  alt={deal.title || "Deal"}
                                  width={400}
                                  height={160}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex items-center gap-3">
                                  {deal.business_profile_pic ? (
                                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                      <OptimizedImage
                                        src={deal.business_profile_pic}
                                        alt={deal.business_name}
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                      <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{deal.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{deal.business_name}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{deal.description}</p>
                                <div className="mt-4 space-y-2">
                                  {deal.deal_type === 'discount' && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Discount</span>
                                      <span className="font-medium">
                                        {deal.discount_percentage ? `${deal.discount_percentage}%` : `${deal.discount_value}`}
                                      </span>
                                    </div>
                                  )}
                                  {deal.deal_type === 'exclusive' && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Special Price</span>
                                      <span className="font-medium">${deal.exclusive_price}</span>
                                    </div>
                                  )}
                                  {deal.validity_end && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Valid until</span>
                                      <span className="font-medium text-xs">{new Date(deal.validity_end).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  className="w-full mt-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/deals/${deal.id}`);
                                  }}
                                >
                                  <Tag className="mr-2 h-4 w-4" />
                                  View Deal
                                </Button>
                              </div>
                            </>
                          ) : (
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {deal.business_profile_pic ? (
                                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                    <OptimizedImage
                                      src={deal.business_profile_pic}
                                      alt={deal.business_name || "Business"}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{deal.title}</p>
                                  <p className="text-sm text-muted-foreground truncate">{deal.business_name}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{deal.description}</p>
                              <div className="mt-4 space-y-2">
                                {deal.deal_type === 'discount' && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Discount</span>
                                    <span className="font-medium">
                                      {deal.discount_percentage ? `${deal.discount_percentage}%` : `${deal.discount_value}`}
                                    </span>
                                  </div>
                                )}
                                {deal.deal_type === 'exclusive' && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Special Price</span>
                                    <span className="font-medium">${deal.exclusive_price}</span>
                                  </div>
                                )}
                                {deal.validity_end && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Valid until</span>
                                    <span className="font-medium text-xs">{new Date(deal.validity_end).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                className="w-full mt-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/deals/${deal.id}`);
                                }}
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                View Deal
                              </Button>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No deals available from your discovered businesses yet.</p>
          )}
        </div>

      </div>
      
      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>Confirm your reward redemption</DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-secondary p-4">
                <div className="mb-3 flex items-center gap-3">
                  {selectedReward.business_profile_pic ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <OptimizedImage 
                        src={selectedReward.business_profile_pic} 
                        alt={selectedReward.business_name || "Business"} 
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{selectedReward.business_name?.charAt(0) || 'B'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedReward.reward_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedReward.business_name}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points to redeem:</span>
                  <span className="text-lg font-bold text-primary">{selectedReward.points_required}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Remaining points:</span>
                  <span className="font-semibold">
                    {(selectedReward.customer_points || 0) - selectedReward.points_required}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowRedeemDialog(false)
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleConfirmRedeem()
                  }} 
                  disabled={isRedeeming} 
                  className="flex-1"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Scan QR Code</DialogTitle>
          {isQrScannerOpen && (
            <QrScanner
              onScanSuccess={handleQrScanSuccess}
              onClose={() => setIsQrScannerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Punch Card Scanner */}
      <PunchCardScanner 
        isOpen={showPunchCardScanner} 
        onClose={() => setShowPunchCardScanner(false)} 
        onPunchAdded={() => {
          // Refresh dashboard data when a punch is added
          refetch()
        }} 
      />
      
      {/* Redemption QR Code Dialog */}
      <Dialog open={showRedemptionQR} onOpenChange={setShowRedemptionQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Redemption QR Code</DialogTitle>
            <DialogDescription className="text-center">Show this QR code to the business to validate your reward</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border bg-white p-6">
              <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
            </div>

            {redemptionDetails && (
              <div className="rounded-lg border bg-secondary p-4">
                {redemptionDetails.type === "discount" ? (
                  <>
                    <h3 className="font-semibold mb-2">{redemptionDetails.offer.business_name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-bold text-primary">{redemptionDetails.offer.discount_value}%</span>
                    </div>
                  </>
                ) : redemptionDetails.type === "exclusive" ? (
                  <>
                    <h3 className="font-semibold mb-2">{redemptionDetails.offer.offer_name}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{redemptionDetails.offer.product_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-primary">
                          {redemptionDetails.offer.discounted_price 
                            ? `₱${redemptionDetails.offer.discounted_price.toFixed(2)}` 
                            : "Special Offer"}
                        </span>
                      </div>
                      {redemptionDetails.offer.discount_percentage && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Savings:</span>
                          <span className="font-bold text-green-600">
                            {redemptionDetails.offer.discount_percentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-2">{redemptionDetails.reward.reward_name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Points redeemed:</span>
                      <span className="font-bold text-primary">{redemptionDetails.reward.points_required}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              This QR code is valid for one-time use. The business will scan it to validate your redemption.
            </p>

            <Button onClick={() => setShowRedemptionQR(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Bottom Navigation */}
      <MobileCustomerBottomNav 
        onQrScan={handleQrScan}
        onPunchCardScan={() => setShowPunchCardScanner(true)}
      />
    </DashboardLayout>
  )
}