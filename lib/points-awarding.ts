import { createClient } from '@/lib/supabase/client';

// Function to award points based on receipt data
export async function awardPointsFromReceipt(receiptId: string): Promise<{ success: boolean; pointsAwarded?: number; error?: string }> {
  const supabase = createClient();
  
  try {
    // Get the receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select(`
        id,
        customer_id,
        business_id,
        total_amount,
        points_earned,
        status,
        auth_method_used
      `)
      .eq('id', receiptId)
      .single();
      
    if (receiptError) throw receiptError;
    
    // Check if receipt is already processed
    if (receipt.status !== 'processed') {
      return { 
        success: false, 
        error: 'Receipt must be processed before awarding points' 
      };
    }
    
    // Check if points have already been awarded
    if (receipt.points_earned && receipt.points_earned > 0) {
      return { 
        success: false, 
        error: 'Points have already been awarded for this receipt' 
      };
    }
    
    // Get business points configuration
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('points_per_currency')
      .eq('id', receipt.business_id)
      .single();
      
    if (businessError) throw businessError;
    
    // Calculate points based on business configuration
    const pointsEarned = Math.floor(receipt.total_amount / business.points_per_currency);
    
    // Create points transaction
    const { error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        customer_id: receipt.customer_id,
        business_id: receipt.business_id,
        amount_spent: receipt.total_amount,
        points_earned: pointsEarned,
        transaction_date: new Date().toISOString()
      });
      
    if (transactionError) throw transactionError;
    
    // Update receipt with awarded points
    const { error: updateError } = await supabase
      .from('receipts')
      .update({ points_earned: pointsEarned })
      .eq('id', receiptId);
      
    if (updateError) throw updateError;
    
    // Update customer's total points
    const { error: customerError } = await supabase.rpc('update_customer_points', {
      customer_uuid: receipt.customer_id,
      points_to_add: pointsEarned
    });
    
    if (customerError) throw customerError;
    
    // If this was an affiliate referral, award commission points to influencer
    const { data: receiptWithAffiliate, error: affiliateError } = await supabase
      .from('receipts')
      .select('affiliate_link_id')
      .eq('id', receiptId)
      .single();
      
    if (!affiliateError && receiptWithAffiliate.affiliate_link_id) {
      // Get the affiliate link details
      const { data: affiliateLink, error: linkError } = await supabase
        .from('affiliate_links')
        .select('influencer_id')
        .eq('id', receiptWithAffiliate.affiliate_link_id)
        .single();
        
      if (!linkError && affiliateLink) {
        // Award commission points to influencer (10% of customer points)
        const commissionPoints = Math.floor(pointsEarned * 0.1);
        
        // Create commission transaction for influencer
        const { error: commissionError } = await supabase
          .from('points_transactions')
          .insert({
            customer_id: affiliateLink.influencer_id, // Using customer_id field for influencer
            business_id: receipt.business_id,
            amount_spent: receipt.total_amount,
            points_earned: commissionPoints,
            transaction_date: new Date().toISOString()
          });
          
        if (!commissionError) {
          // Update influencer's total points
          await supabase.rpc('update_influencer_points', {
            influencer_uuid: affiliateLink.influencer_id,
            points_to_add: commissionPoints
          });
        }
      }
    }
    
    return { success: true, pointsAwarded: pointsEarned };
  } catch (error) {
    console.error('Error awarding points from receipt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to award points' 
    };
  }
}

// Function to get customer points summary
export async function getCustomerPointsSummary(customerId: string) {
  const supabase = createClient();
  
  try {
    // Get total points from customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('total_points')
      .eq('id', customerId)
      .single();
      
    if (customerError) throw customerError;
    
    // Get points earned from receipts
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('points_earned')
      .eq('customer_id', customerId)
      .eq('status', 'processed');
      
    if (receiptsError) throw receiptsError;
    
    const totalReceiptPoints = receipts.reduce((sum, receipt) => sum + (receipt.points_earned || 0), 0);
    
    // Get points from redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select('points_redeemed')
      .eq('customer_id', customerId);
      
    if (redemptionsError) throw redemptionsError;
    
    const totalRedeemedPoints = redemptions.reduce((sum, redemption) => sum + (redemption.points_redeemed || 0), 0);
    
    return {
      totalPoints: customer.total_points,
      pointsFromReceipts: totalReceiptPoints,
      pointsRedeemed: totalRedeemedPoints,
      availablePoints: customer.total_points
    };
  } catch (error) {
    console.error('Error getting customer points summary:', error);
    return null;
  }
}

// Function to get business points analytics
export async function getBusinessPointsAnalytics(businessId: string) {
  const supabase = createClient();
  
  try {
    // Get total revenue from receipts
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('total_amount, points_earned')
      .eq('business_id', businessId)
      .eq('status', 'processed');
      
    if (receiptsError) throw receiptsError;
    
    const totalRevenue = receipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);
    const totalPointsAwarded = receipts.reduce((sum, receipt) => sum + (receipt.points_earned || 0), 0);
    
    // Get unique customers
    const uniqueCustomers = new Set(receipts.map(receipt => receipt.customer_id)).size;
    
    // Get total redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select('points_redeemed')
      .eq('business_id', businessId);
      
    if (redemptionsError) throw redemptionsError;
    
    const totalPointsRedeemed = redemptions.reduce((sum, redemption) => sum + (redemption.points_redeemed || 0), 0);
    
    return {
      totalRevenue,
      totalPointsAwarded,
      totalPointsRedeemed,
      uniqueCustomers,
      averageTransactionValue: receipts.length > 0 ? totalRevenue / receipts.length : 0,
      averagePointsPerTransaction: receipts.length > 0 ? totalPointsAwarded / receipts.length : 0
    };
  } catch (error) {
    console.error('Error getting business points analytics:', error);
    return null;
  }
}