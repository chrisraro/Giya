import { createClient } from '@/lib/supabase/client';

// Function to track affiliate attribution when a customer uploads a receipt
export async function trackAffiliateAttribution(
  customerId: string, 
  businessId: string, 
  receiptId: string
): Promise<void> {
  const supabase = createClient();
  
  try {
    // Check if customer has an affiliate referral code in session storage
    let referralCode: string | null = null;
    
    if (typeof window !== 'undefined') {
      // Check session storage for referral code
      referralCode = sessionStorage.getItem('affiliate_referral_code');
      
      // If not in session storage, check URL parameters
      if (!referralCode) {
        const urlParams = new URLSearchParams(window.location.search);
        referralCode = urlParams.get('ref');
        
        // Save to session storage for future use
        if (referralCode) {
          sessionStorage.setItem('affiliate_referral_code', referralCode);
        }
      }
    }
    
    // If we have a referral code, find the corresponding affiliate link
    if (referralCode) {
      const { data: affiliateLink, error: linkError } = await supabase
        .from('affiliate_links')
        .select('id, influencer_id')
        .eq('unique_code', referralCode)
        .eq('business_id', businessId)
        .single();
        
      if (linkError) {
        console.warn('Affiliate link not found for referral code:', referralCode);
        return;
      }
      
      // Update the receipt with the affiliate link ID
      const { error: updateError } = await supabase
        .from('receipts')
        .update({ affiliate_link_id: affiliateLink.id })
        .eq('id', receiptId);
        
      if (updateError) {
        console.error('Error updating receipt with affiliate link:', updateError);
        return;
      }
      
      // Create an affiliate conversion record
      const { error: conversionError } = await supabase
        .from('affiliate_conversions')
        .insert({
          affiliate_link_id: affiliateLink.id,
          customer_id: customerId,
          converted_at: new Date().toISOString()
        });
        
      if (conversionError) {
        console.error('Error creating affiliate conversion:', conversionError);
        return;
      }
      
      console.log('Affiliate attribution tracked successfully');
    }
  } catch (error) {
    console.error('Error tracking affiliate attribution:', error);
  }
}

// Enhanced function to get affiliate earnings for a business with better filtering
export async function getAffiliateEarnings(businessId: string, days: number = 30) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('affiliate_conversions')
      .select(`
        id,
        converted_at,
        affiliate_links (influencer_id, unique_code),
        customers (full_name),
        receipts (total_amount, points_earned)
      `)
      .eq('affiliate_links.business_id', businessId)
      .gte('converted_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('converted_at', { ascending: false });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    return [];
  }
}

// Enhanced function to calculate affiliate commissions with better accuracy
export async function calculateAffiliateCommissions(businessId: string) {
  const supabase = createClient();
  
  try {
    // Get all affiliate conversions for this business in the last 30 days
    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select(`
        id,
        created_at,
        affiliate_links (id, influencer_id, unique_code, commission_rate),
        receipts!affiliate_conversions_receipt_id_fkey (total_amount, points_earned)
      `)
      .eq('affiliate_links.business_id', businessId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
    if (conversionsError) throw conversionsError;
    
    // Calculate commissions based on actual commission rates
    const commissions = conversions.map(conversion => {
      const receipt = conversion.receipts?.[0];
      const amount = receipt?.total_amount || 0;
      // Use the commission rate from the affiliate link, default to 5% if not set
      const commissionRate = conversion.affiliate_links?.[0]?.commission_rate || 0.05;
      const commission = amount * commissionRate;
      
      return {
        affiliate_link_id: conversion.affiliate_links?.[0]?.id,
        influencer_id: conversion.affiliate_links?.[0]?.influencer_id,
        receipt_amount: amount,
        commission_rate: commissionRate,
        commission_earned: commission,
        conversion_id: conversion.id,
        conversion_date: conversion.created_at
      };
    });
    
    return commissions;
  } catch (error) {
    console.error('Error calculating affiliate commissions:', error);
    return [];
  }
}

// Function to generate a unique affiliate referral code
export async function generateAffiliateReferralCode(businessId: string, influencerId: string): Promise<string> {
  const supabase = createClient();
  
  try {
    // Generate a unique 8-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';
    
    // Ensure uniqueness by checking against existing codes
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      referralCode = '';
      for (let i = 0; i < 8; i++) {
        referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Check if this code already exists
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('unique_code', referralCode)
        .eq('business_id', businessId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        isUnique = true;
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Unable to generate unique referral code after maximum attempts');
    }
    
    return referralCode;
  } catch (error) {
    console.error('Error generating affiliate referral code:', error);
    throw error;
  }
}

// Function to create a new affiliate link
export async function createAffiliateLink(
  businessId: string, 
  influencerId: string, 
  commissionRate: number = 0.05
): Promise<{ success: boolean; referralCode?: string; error?: string }> {
  const supabase = createClient();
  
  try {
    // Generate a unique referral code
    const referralCode = await generateAffiliateReferralCode(businessId, influencerId);
    
    // Create the affiliate link record
    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({
        business_id: businessId,
        influencer_id: influencerId,
        unique_code: referralCode,
        commission_rate: commissionRate,
        created_at: new Date().toISOString()
      })
      .select('id, unique_code')
      .single();
      
    if (error) throw error;
    
    return { success: true, referralCode: data.unique_code };
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create affiliate link' 
    };
  }
}

// Function to get top performing affiliates for a business
export async function getTopAffiliates(businessId: string, limit: number = 10) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('affiliate_conversions')
      .select(`
        affiliate_links (id, influencer_id, unique_code),
        receipts!affiliate_conversions_receipt_id_fkey (total_amount)
      `)
      .eq('affiliate_links.business_id', businessId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Group by influencer and calculate total earnings
    const affiliateStats: Record<string, { influencerId: string; referralCode: string; totalEarnings: number; conversionCount: number }> = {};
    
    data.forEach(conversion => {
      const influencerId = conversion.affiliate_links?.[0]?.influencer_id;
      const referralCode = conversion.affiliate_links?.[0]?.unique_code;
      const amount = conversion.receipts?.[0]?.total_amount || 0;
      
      if (influencerId && referralCode) {
        if (!affiliateStats[influencerId]) {
          affiliateStats[influencerId] = {
            influencerId,
            referralCode,
            totalEarnings: 0,
            conversionCount: 0
          };
        }
        
        affiliateStats[influencerId].totalEarnings += amount;
        affiliateStats[influencerId].conversionCount += 1;
      }
    });
    
    // Convert to array and sort by total earnings
    const topAffiliates = Object.values(affiliateStats)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);
    
    return topAffiliates;
  } catch (error) {
    console.error('Error fetching top affiliates:', error);
    return [];
  }
}