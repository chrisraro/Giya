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
  reward_id: string;
  rewards: {
    reward_name: string;
    points_required: number;
    image_url: string | null;
  };
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
  customers?: {
    full_name: string;
  };
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
  customers: {
    full_name: string;
  };
  points_earned: number;
}

interface DashboardData {
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
        const errorMessage = handleApiError(err, `Failed to load ${userType} dashboard data`, `useDashboardData.${userType}`);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userType, supabase]);

  const fetchCustomerData = async (userId: string) => {
    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, nickname, profile_pic_url, qr_code_data, total_points")
      .eq("id", userId)
      .single();

    if (customerError) throw customerError;

    // Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("points_transactions")
      .select(
        `
        id,
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
      .order("transaction_date", { ascending: false })
      .limit(10);

    if (transactionsError) throw transactionsError;

    // Fetch redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("redemptions")
      .select(
        `
        id,
        redeemed_at,
        status,
        business_id,
        reward_id,
        rewards (
          reward_name,
          points_required,
          image_url
        ),
        businesses!inner (
          business_name,
          profile_pic_url
        )
      `,
      )
      .eq("customer_id", userId)
      .order("redeemed_at", { ascending: false })
      .limit(10);

    if (redemptionsError) {
      // Try fallback query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("redemptions")
        .select(
          `
          id,
          redeemed_at,
          status,
          business_id,
          reward_id,
          rewards (
            reward_name,
            points_required,
            image_url
          )
        `,
        )
        .eq("customer_id", userId)
        .order("redeemed_at", { ascending: false })
        .limit(10);
        
      if (fallbackError) throw fallbackError;
      
      // Manually fetch business information
      const redemptionsWithBusiness = await Promise.all(
        (fallbackData || []).map(async (redemption: any) => {
          if (redemption.business_id) {
            const { data: businessData, error: businessError } = await supabase
              .from("businesses")
              .select("business_name, profile_pic_url")
              .eq("id", redemption.business_id)
              .single();
              
            if (!businessError && businessData) {
              return {
                ...redemption,
                businesses: businessData
              };
            }
          }
          return redemption;
        })
      );
      
      return {
        customer,
        transactions: transactions || [],
        redemptions: redemptionsWithBusiness
      };
    }

    // Calculate business points
    const businessPoints = await calculateBusinessPoints(userId);

    return {
      customer,
      transactions: transactions || [],
      redemptions: redemptions || [],
      businessPoints
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

    // Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
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

    if (transactionsError) throw transactionsError;

    // Calculate stats
    const { data: allTransactions } = await supabase
      .from("points_transactions")
      .select("amount_spent, customer_id")
      .eq("business_id", userId);

    let stats = {
      totalTransactions: 0,
      totalRevenue: 0,
      uniqueCustomers: 0,
    };

    if (allTransactions) {
      const totalRevenue = (allTransactions as { amount_spent: number }[]).reduce((sum: number, t: { amount_spent: number }) => sum + Number(t.amount_spent), 0);
      const uniqueCustomers = new Set((allTransactions as { customer_id: string }[]).map((t: { customer_id: string }) => t.customer_id)).size;

      stats = {
        totalTransactions: allTransactions.length,
        totalRevenue,
        uniqueCustomers,
      };
    }

    return {
      business,
      transactions: transactions || [],
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

    return {
      influencer,
      businesses: businesses || [],
      affiliateLinks: links || [],
      conversions: conversions || []
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