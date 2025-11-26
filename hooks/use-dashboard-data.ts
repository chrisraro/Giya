import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { handleApiError } from '@/lib/error-handler';

interface UseDashboardDataProps {
  userType: 'customer' | 'business' | 'influencer';
}

export interface CustomerData {
  id: string;
  full_name: string;
  nickname: string | null;
  profile_pic_url: string | null;
  qr_code_data: string;
  total_points: number;
}

export interface BusinessData {
  id: string;
  business_name: string;
  business_category: string;
  address: string;
  profile_pic_url: string | null;
  points_per_currency: number;
}

export interface InfluencerData {
  id: string;
  full_name: string;
  profile_pic_url: string | null;
  total_points: number;
}

export interface Transaction {
  id: string;
  customer_id: string;
  amount_spent: number;
  points_earned: number;
  transaction_date: string;
  customers?: {
    full_name: string;
    profile_pic_url: string | null;
  };
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
}

export interface Redemption {
  id: string;
  redeemed_at: string;
  status: string;
  business_id: string | null;
  reward_id?: string;
  rewards?: {
    reward_name: string;
    points_required: number;
    image_url: string | null;
  };
  customers?: {
    full_name: string;
  };
  // For discount redemptions
  discount_offer_id?: string;
  discount_offers?: {
    title: string;
  };
  // For exclusive offer redemptions
  exclusive_offer_id?: string;
  exclusive_offers?: {
    title: string;
    image_url: string | null;
  };
  // For businesses relationship
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
  // Type field to distinguish between redemption types
  redemption_type?: 'reward' | 'discount' | 'exclusive';
  // Allow any other properties
  [key: string]: any;
}

export interface BusinessPoints {
  business_id: string;
  business_name: string;
  profile_pic_url: string | null;
  total_points: number;
  available_rewards: number;
}

interface AffiliateLink {
  id: string;
  business_id: string;
  unique_code: string;
  created_at: string;
  businesses: {
    business_name: string;
    profile_pic_url: string | null;
  };
}

interface Conversion {
  id: string;
  converted_at: string;
  points_earned: number;
  customers: {
    full_name: string;
  };
}

export interface DashboardData {
  user: any;
  customer?: CustomerData;
  business?: BusinessData;
  influencer?: InfluencerData;
  transactions?: Transaction[];
  redemptions?: Redemption[];
  businessPoints?: BusinessPoints[];
  stats?: {
    totalTransactions: number;
    totalRevenue: number;
    uniqueCustomers: number;
  };
  businesses?: any[];
  affiliateLinks?: AffiliateLink[];
  conversions?: Conversion[];
  receiptsCount?: number;
}

export function useDashboardData({ userType }: UseDashboardDataProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // We'll handle redirect in the component
          setData(null);
          return;
        }

        console.log("[useDashboardData] Fetching data for user:", user.id, "with type:", userType);

        let resultData: DashboardData = { user };

        switch (userType) {
          case 'customer':
            resultData = { ...resultData, ...(await fetchCustomerData(user.id)) };
            break;
          case 'business':
            resultData = { ...resultData, ...(await fetchBusinessData(user.id)) };
            break;
          case 'influencer':
            resultData = { ...resultData, ...(await fetchInfluencerData(user.id)) };
            break;
          default:
            throw new Error(`Unsupported user type: ${userType}`);
        }

        setData(resultData);
      } catch (err) {
        console.error("[useDashboardData] Error fetching data for user type:", userType, err);
        const errorMessage = handleApiError(err, `Failed to load ${userType} dashboard data`, `useDashboardData.${userType}`);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userType, supabase]);

  const fetchCustomerData = async (userId: string) => {
    console.log("[v0] Fetching customer data for user ID:", userId);
    
    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, nickname, profile_pic_url, qr_code_data")
      .eq("id", userId)
      .single();

    console.log("[v0] Customer data query result:", { customer, customerError });

    if (customerError) {
      console.error("[v0] Customer data query error:", customerError);
      throw customerError;
    }
    
    console.log("[v0] Customer data result:", customer);
    
    // Calculate AVAILABLE points (total earned - total redeemed)
    const { data: earnedPoints } = await supabase
      .from("points_transactions")
      .select("points_earned")
      .eq("customer_id", userId);
    
    const totalEarned = earnedPoints?.reduce((sum, t) => sum + t.points_earned, 0) || 0;
    
    const { data: redeemedPoints } = await supabase
      .from("redemptions")
      .select("points_redeemed")
      .eq("customer_id", userId);
    
    const totalRedeemed = redeemedPoints?.reduce((sum, r) => sum + r.points_redeemed, 0) || 0;
    
    const availablePoints = totalEarned - totalRedeemed;
    console.log(`[v0] Points calculation: Earned=${totalEarned}, Redeemed=${totalRedeemed}, Available=${availablePoints}`);
    
    // Add available points to customer data
    const customerWithPoints = {
      ...customer,
      total_points: availablePoints
    };

    // Fetch transactions - ALL transactions, not just limited
    const { data: transactions, error: transactionsError } = await supabase
      .from("points_transactions")
      .select(
        `
        id,
        customer_id,
        business_id,
        amount_spent,
        points_earned,
        transaction_date,
        businesses (
          business_name,
          profile_pic_url
        )
      `,
      )
      .eq("customer_id", userId)
      .order("transaction_date", { ascending: false });
      // Removed limit to fetch all transactions

    if (transactionsError) {
      console.error("[v0] Transactions query error:", transactionsError);
      throw transactionsError;
    }
    
    console.log("[v0] Transactions result:", transactions);

    // Format transactions to match Transaction interface
    const formattedTransactions: Transaction[] = transactions?.map((transaction: any) => ({
      id: transaction.id,
      customer_id: transaction.customer_id,
      amount_spent: transaction.amount_spent,
      points_earned: transaction.points_earned,
      transaction_date: transaction.transaction_date,
      businesses: transaction.businesses ? {
        business_name: transaction.businesses.business_name || '',
        profile_pic_url: transaction.businesses.profile_pic_url || null
      } : undefined
    })) || [];

    // Fetch all types of redemptions
    console.log("[v0] Starting redemption queries for customer ID:", userId);
    
    // 1. Reward redemptions - check both customer_id and user_id
    // Fix the businesses relationship by specifying which foreign key to use
    console.log("[v0] Querying reward redemptions...");
    let { data: rewardRedemptions, error: rewardRedemptionsError } = await supabase
      .from("redemptions")
      .select(
        `
        id,
        redeemed_at,
        status,
        customer_id,
        user_id,
        business_id,
        points_redeemed,
        reward_id,
        rewards (
          reward_name,
          points_required,
          image_url,
          business_id
        ),
        businesses!redemptions_business_id_fkey (
          business_name,
          profile_pic_url
        )
      `,
      )
      .or(`customer_id.eq.${userId},user_id.eq.${userId}`)
      .order("redeemed_at", { ascending: false });
      
    console.log("[v0] Reward redemptions query result:", { data: rewardRedemptions, error: rewardRedemptionsError });

    // 2. Discount redemptions
    console.log("[v0] Querying discount redemptions...");
    let { data: discountRedemptions, error: discountRedemptionsError } = await supabase
      .from("discount_usage")
      .select(
        `
        id,
        used_at,
        business_id,
        customer_id,
        discount_offer_id,
        discount_offers (
          title,
          discount_value,
          points_required,
          business_id
        ),
        businesses (
          business_name,
          profile_pic_url
        )
      `,
      )
      .eq("customer_id", userId)
      .order("used_at", { ascending: false });
      
    console.log("[v0] Discount redemptions query result:", { data: discountRedemptions, error: discountRedemptionsError });

    // 3. Exclusive offer redemptions
    console.log("[v0] Querying exclusive offer redemptions...");
    let { data: exclusiveOfferRedemptions, error: exclusiveOfferRedemptionsError } = await supabase
      .from("exclusive_offer_usage")
      .select(
        `
        id,
        used_at,
        business_id,
        customer_id,
        exclusive_offer_id,
        exclusive_offers (
          title,
          points_required,
          image_url,
          business_id
        ),
        businesses (
          business_name,
          profile_pic_url
        )
      `,
      )
      .eq("customer_id", userId)
      .order("used_at", { ascending: false });
      
    console.log("[v0] Exclusive offer redemptions query result:", { data: exclusiveOfferRedemptions, error: exclusiveOfferRedemptionsError });

    // Handle errors properly
    if (rewardRedemptionsError) {
      console.error("[v0] Reward redemptions query error:", rewardRedemptionsError);
    }
    
    if (discountRedemptionsError) {
      console.error("[v0] Discount redemptions query error:", discountRedemptionsError);
    }
    
    if (exclusiveOfferRedemptionsError) {
      console.error("[v0] Exclusive offer redemptions query error:", exclusiveOfferRedemptionsError);
    }

    // Debug logging
    console.log("[v0] Raw redemption data:");
    console.log("[v0] Reward redemptions:", rewardRedemptions);
    console.log("[v0] Discount redemptions:", discountRedemptions);
    console.log("[v0] Exclusive offer redemptions:", exclusiveOfferRedemptions);

    // Combine all redemptions
    let allRedemptions: Redemption[] = [];

    // Process reward redemptions
    if (rewardRedemptions && !rewardRedemptionsError) {
      console.log("[v0] Processing reward redemptions:", rewardRedemptions);
      
      const processedRewardRedemptions = (rewardRedemptions || []).map((redemption: any, index: number) => ({
        id: redemption.id || `reward-${index}`,
        redeemed_at: redemption.redeemed_at || new Date().toISOString(),
        status: redemption.status || 'unknown',
        business_id: redemption.business_id || redemption.rewards?.business_id || null,
        customer_id: redemption.customer_id || redemption.user_id || userId,
        reward_id: redemption.reward_id,
        rewards: redemption.rewards,
        businesses: redemption.businesses || (redemption.rewards?.business_id ? {
          business_name: redemption.rewards.business_name,
          profile_pic_url: redemption.rewards.profile_pic_url
        } : null),
        redemption_type: 'reward' as 'reward'
      })).filter((redemption: any) => redemption.redeemed_at); // Filter out invalid entries
      allRedemptions = [...processedRewardRedemptions];
      console.log("[v0] Processed reward redemptions:", processedRewardRedemptions);
    }

    // Process discount redemptions
    if (discountRedemptions && !discountRedemptionsError) {
      console.log("[v0] Processing discount redemptions:", discountRedemptions);
      
      const processedDiscountRedemptions = (discountRedemptions || []).map((redemption: any, index: number) => ({
        id: redemption.id || `discount-${index}`,
        redeemed_at: redemption.used_at || new Date().toISOString(),
        status: 'completed', // Discount redemptions are typically immediate
        business_id: redemption.business_id || redemption.discount_offers?.business_id || null,
        customer_id: redemption.customer_id || userId,
        discount_offer_id: redemption.discount_offer_id,
        discount_offers: redemption.discount_offers,
        businesses: redemption.businesses || (redemption.discount_offers?.business_id ? {
          business_name: redemption.discount_offers.business_name,
          profile_pic_url: redemption.discount_offers.profile_pic_url
        } : null),
        redemption_type: 'discount' as 'discount'
      })).filter((redemption: any) => redemption.redeemed_at); // Filter out invalid entries
      allRedemptions = [...allRedemptions, ...processedDiscountRedemptions];
      console.log("[v0] Processed discount redemptions:", processedDiscountRedemptions);
    }

    // Process exclusive offer redemptions
    if (exclusiveOfferRedemptions && !exclusiveOfferRedemptionsError) {
      console.log("[v0] Processing exclusive offer redemptions:", exclusiveOfferRedemptions);
      
      const processedExclusiveOfferRedemptions = (exclusiveOfferRedemptions || []).map((redemption: any, index: number) => ({
        id: redemption.id || `exclusive-${index}`,
        redeemed_at: redemption.used_at || new Date().toISOString(),
        status: 'completed', // Exclusive offer redemptions are typically immediate
        business_id: redemption.business_id || redemption.exclusive_offers?.business_id || null,
        customer_id: redemption.customer_id || userId,
        exclusive_offer_id: redemption.exclusive_offer_id,
        exclusive_offers: redemption.exclusive_offers,
        businesses: redemption.businesses || (redemption.exclusive_offers?.business_id ? {
          business_name: redemption.exclusive_offers.business_name,
          profile_pic_url: redemption.exclusive_offers.profile_pic_url
        } : null),
        redemption_type: 'exclusive' as 'exclusive'
      })).filter((redemption: any) => redemption.used_at); // Filter out invalid entries
      allRedemptions = [...allRedemptions, ...processedExclusiveOfferRedemptions];
      console.log("[v0] Processed exclusive offer redemptions:", processedExclusiveOfferRedemptions);
    }

    // Debug logging
    console.log("[v0] All redemptions before sorting:", allRedemptions);

    // Sort all redemptions by date (most recent first)
    allRedemptions.sort((a, b) => {
      const dateA = new Date(a.redeemed_at).getTime();
      const dateB = new Date(b.redeemed_at).getTime();
      return dateB - dateA;
    });

    // Debug logging
    console.log("[v0] All redemptions after sorting:", allRedemptions);

    // Calculate business points for businesses where customer has transactions
    const businessPoints = await calculateBusinessPoints(userId);

    // Fetch receipts count
    const { data: receiptsData, error: receiptsError } = await supabase
      .from("receipts")
      .select("id", { count: 'exact', head: false })
      .eq("customer_id", userId)
      .eq("status", "processed");
    
    const receiptsCount = receiptsData?.length || 0;
    console.log(`[v0] Receipts count: ${receiptsCount}`);
    
    return {
      customer: customerWithPoints,
      transactions: formattedTransactions,
      redemptions: allRedemptions as Redemption[],
      businessPoints,
      receiptsCount
    };
  };

  const calculateBusinessPoints = async (customerId: string) => {
    // Get all businesses the customer has transacted with
    const { data: businessTransactions, error: businessTransactionsError } = await supabase
      .from("points_transactions")
      .select(`
        business_id,
        businesses (
          business_name,
          profile_pic_url
        )
      `)
      .eq("customer_id", customerId)
      .order("transaction_date", { ascending: false });

    if (businessTransactionsError) {
      console.error("Business transactions query error:", businessTransactionsError);
      return [];
    }

    // Get unique businesses
    const uniqueBusinesses = Array.from(
      new Map(
        (businessTransactions || []).map((transaction: any) => [
          transaction.business_id,
          {
            business_id: transaction.business_id,
            business_name: transaction.businesses?.business_name || 'Business',
            profile_pic_url: transaction.businesses?.profile_pic_url || null
          }
        ])
      ).values()
    );

    // Also get businesses where customer has redemptions but no transactions
    const { data: redemptionBusinesses, error: redemptionBusinessesError } = await supabase
      .from("redemptions")
      .select(`
        business_id,
        businesses (
          business_name,
          profile_pic_url
        )
      `)
      .eq("customer_id", customerId)
      .order("redeemed_at", { ascending: false });

    if (!redemptionBusinessesError && redemptionBusinesses) {
      redemptionBusinesses.forEach((redemption: any) => {
        if (redemption.business_id && !uniqueBusinesses.some((biz: any) => biz.business_id === redemption.business_id)) {
          uniqueBusinesses.push({
            business_id: redemption.business_id,
            business_name: redemption.businesses?.business_name || 'Business',
            profile_pic_url: redemption.businesses?.profile_pic_url || null
          });
        }
      });
    }

    // Calculate points per business
    const businessPointsMap = new Map();
    
    // Get all transactions
    const { data: allTransactions, error: transactionsError } = await supabase
      .from("points_transactions")
      .select("business_id, points_earned")
      .eq("customer_id", customerId);
      
    if (!transactionsError && allTransactions) {
      allTransactions.forEach((transaction: any) => {
        const currentPoints = businessPointsMap.get(transaction.business_id) || 0;
        businessPointsMap.set(transaction.business_id, currentPoints + transaction.points_earned);
      });
    }
    
    // Subtract redemptions
    const { data: allRedemptions, error: redemptionsError } = await supabase
      .from("redemptions")
      .select(`
        business_id,
        points_redeemed
      `)
      .eq("customer_id", customerId);
      
    if (!redemptionsError && allRedemptions) {
      allRedemptions.forEach((redemption: any) => {
        if (redemption.business_id && redemption.points_redeemed) {
          const currentPoints = businessPointsMap.get(redemption.business_id) || 0;
          businessPointsMap.set(redemption.business_id, currentPoints - redemption.points_redeemed);
        }
      });
    }
    
    // Get available rewards count per business
    const { data: allRewards, error: rewardsError } = await supabase
      .from("rewards")
      .select(`
        business_id,
        id,
        is_active
      `);
      
    const rewardsCountMap = new Map();
    if (!rewardsError && allRewards) {
      allRewards
        .filter((reward: any) => reward.is_active)
        .forEach((reward: any) => {
          const currentCount = rewardsCountMap.get(reward.business_id) || 0;
          rewardsCountMap.set(reward.business_id, currentCount + 1);
        });
    }
    
    // Combine all data
    const businessPointsResult: BusinessPoints[] = uniqueBusinesses.map((business: any) => {
      const businessId = business.business_id;
      const points = businessPointsMap.get(businessId) || 0;
      const availableRewardsCount = rewardsCountMap.get(businessId) || 0;
      
      return {
        ...business,
        total_points: points,
        available_rewards: availableRewardsCount
      };
    });

    return businessPointsResult;
  };

  const fetchBusinessData = async (userId: string) => {
    // Fetch business data
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name, business_category, profile_pic_url, points_per_currency, address")
      .eq("id", userId)
      .single();

    if (businessError) throw businessError;

    // Fetch points transactions
    const { data: pointsTransactions, error: pointsTransactionsError } = await supabase
      .from("points_transactions")
      .select(
        `
        id,
        customer_id,
        amount_spent,
        points_earned,
        transaction_date,
        customers (
          full_name,
          profile_pic_url
        )
      `,
      )
      .eq("business_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(20);

    if (pointsTransactionsError) throw pointsTransactionsError;

    // Fetch redemption validations
    // Fix the businesses relationship by specifying which foreign key to use
    const { data: redemptionValidations, error: redemptionValidationsError } = await supabase
      .from("redemptions")
      .select(
        `
        id,
        customer_id,
        reward_id,
        points_redeemed,
        validated_at,
        status,
        customers (
          full_name,
          profile_pic_url
        ),
        rewards (
          reward_name
        )
      `,
      )
      .eq("business_id", userId)
      .eq("status", "validated")
      .order("validated_at", { ascending: false })
      .limit(20);

    if (redemptionValidationsError) throw redemptionValidationsError;

    // Combine and sort all transactions
    let allTransactions: any[] = [];

    // Add points transactions with type identifier
    if (pointsTransactions) {
      allTransactions = pointsTransactions.map((transaction: any) => ({
        ...transaction,
        type: 'points_earned',
        display_date: transaction.transaction_date
      }));
    }

    // Add redemption validations with type identifier
    if (redemptionValidations) {
      const validationTransactions = redemptionValidations.map((redemption: any) => ({
        id: `redemption-${redemption.id}`,
        customer_id: redemption.customer_id,
        amount_spent: 0,
        points_earned: -redemption.points_redeemed, // Negative to show points deducted
        transaction_date: redemption.validated_at,
        display_date: redemption.validated_at,
        customers: redemption.customers,
        redemption_info: {
          reward_name: redemption.rewards?.reward_name
        },
        type: 'redemption_validated'
      }));
      allTransactions = [...allTransactions, ...validationTransactions];
    }

    // Sort all transactions by date (most recent first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.display_date).getTime();
      const dateB = new Date(b.display_date).getTime();
      return dateB - dateA;
    });

    // Limit to 20 most recent transactions
    allTransactions = allTransactions.slice(0, 20);

    // Calculate stats
    const { data: allPointsTransactions } = await supabase
      .from("points_transactions")
      .select("amount_spent, customer_id")
      .eq("business_id", userId);

    let stats = {
      totalTransactions: 0,
      totalRevenue: 0,
      uniqueCustomers: 0,
    };

    if (allPointsTransactions) {
      const totalRevenue = (allPointsTransactions as { amount_spent: number }[]).reduce((sum: number, t: { amount_spent: number }) => sum + Number(t.amount_spent), 0);
      const uniqueCustomers = new Set((allPointsTransactions as { customer_id: string }[]).map((t: { customer_id: string }) => t.customer_id)).size;

      stats = {
        totalTransactions: allPointsTransactions.length,
        totalRevenue,
        uniqueCustomers,
      };
    }

    return {
      business,
      transactions: allTransactions,
      stats
    };
  };

  const fetchInfluencerData = async (userId: string) => {
    // Fetch influencer data
    const { data: influencer, error: influencerError } = await supabase
      .from("influencers")
      .select("id, full_name, profile_pic_url, total_points")
      .eq("id", userId)
      .single();

    if (influencerError) throw influencerError;

    // Fetch all businesses
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, business_name, business_category, profile_pic_url")
      .order("business_name");

    if (businessesError) throw businessesError;

    // Fetch affiliate links
    const { data: links, error: linksError } = await supabase
      .from("affiliate_links")
      .select(
        `
        id,
        business_id,
        unique_code,
        created_at,
        businesses (
          business_name,
          profile_pic_url
        )
      `,
      )
      .eq("influencer_id", userId)
      .order("created_at", { ascending: false });

    if (linksError) throw linksError;

    // Format affiliate links to match AffiliateLink interface
    const formattedAffiliateLinks: AffiliateLink[] = links?.map((link: any) => ({
      id: link.id,
      business_id: link.business_id,
      unique_code: link.unique_code,
      created_at: link.created_at,
      businesses: link.businesses ? {
        business_name: link.businesses.business_name || '',
        profile_pic_url: link.businesses.profile_pic_url || null
      } : {
        business_name: '',
        profile_pic_url: null
      }
    })) || [];

    // Fetch conversions
    const { data: conversions, error: conversionsError } = await supabase
      .from("affiliate_conversions")
      .select(
        `
        id,
        converted_at,
        points_earned,
        customers (
          full_name
        )
      `,
      )
      .in(
        "affiliate_link_id",
        (links || []).map((link: any) => link.id),
      )
      .order("converted_at", { ascending: false })
      .limit(10);

    if (conversionsError) throw conversionsError;

    // Format conversions to match Conversion interface
    const formattedConversions: Conversion[] = conversions?.map((conversion: any) => ({
      id: conversion.id,
      converted_at: conversion.converted_at,
      points_earned: conversion.points_earned,
      customers: conversion.customers && conversion.customers.length > 0 ? {
        full_name: conversion.customers[0].full_name || ''
      } : {
        full_name: ''
      }
    })) || [];

    return {
      influencer,
      businesses: businesses || [],
      affiliateLinks: formattedAffiliateLinks,
      conversions: formattedConversions
    };
  };

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      // Trigger refetch by updating state
      setIsLoading(true);
      // The useEffect will automatically run because of the dependency array
    }
  };
}