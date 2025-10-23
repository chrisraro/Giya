const { createClient } = require('@/lib/supabase/client');

async function debugCustomerData() {
  const supabase = createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Current User:', user);
    
    // Check customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('id', user.id)
      .single();
      
    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return;
    }
    
    console.log('Customer:', customer);
    
    // Check customer_businesses
    const { data: customerBusinesses, error: cbError } = await supabase
      .from('customer_businesses')
      .select('*')
      .eq('customer_id', customer.id);
      
    console.log('Customer Businesses:', customerBusinesses, cbError);
    
    // Check points_transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .limit(5);
      
    console.log('Transactions:', transactions, transactionsError);
    
    // Check redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select('*')
      .eq('customer_id', customer.id)
      .limit(5);
      
    console.log('Redemptions:', redemptions, redemptionsError);
    
    // Check discount_usage
    const { data: discountUsage, error: discountError } = await supabase
      .from('discount_usage')
      .select('*')
      .eq('customer_id', customer.id)
      .limit(5);
      
    console.log('Discount Usage:', discountUsage, discountError);
    
    // Check exclusive_offer_usage
    const { data: offerUsage, error: offerError } = await supabase
      .from('exclusive_offer_usage')
      .select('*')
      .eq('customer_id', customer.id)
      .limit(5);
      
    console.log('Exclusive Offer Usage:', offerUsage, offerError);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugCustomerData();