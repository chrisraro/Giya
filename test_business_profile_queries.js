// Test script to verify business profile queries
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBusinessProfileQueries(businessId) {
  console.log('Testing business profile queries for business ID:', businessId);
  
  try {
    // Test business details query
    console.log('1. Fetching business details...');
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    
    if (businessError) {
      console.error('Business query error:', businessError);
      return;
    }
    
    console.log('Business data:', business);
    
    // Test rewards query
    console.log('2. Fetching rewards...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    
    if (rewardsError) {
      console.error('Rewards query error:', rewardsError);
      return;
    }
    
    console.log('Rewards count:', rewards?.length || 0);
    
    // Test discount offers query
    console.log('3. Fetching discount offers...');
    const { data: discountOffers, error: discountError } = await supabase
      .from('discount_offers')
      .select(`
        id,
        business_id,
        title,
        description,
        discount_type,
        discount_value,
        minimum_purchase,
        is_active,
        usage_limit,
        used_count,
        valid_from,
        valid_until,
        is_first_visit_only
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (discountError) {
      console.error('Discount offers query error:', discountError);
      return;
    }
    
    console.log('Discount offers count:', discountOffers?.length || 0);
    
    // Test exclusive offers query
    console.log('4. Fetching exclusive offers...');
    const { data: exclusiveOffers, error: exclusiveError } = await supabase
      .from('exclusive_offers')
      .select(`
        id,
        business_id,
        title,
        description,
        product_name,
        original_price,
        discounted_price,
        discount_percentage,
        image_url,
        is_active,
        usage_limit,
        used_count,
        valid_from,
        valid_until
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (exclusiveError) {
      console.error('Exclusive offers query error:', exclusiveError);
      return;
    }
    
    console.log('Exclusive offers count:', exclusiveOffers?.length || 0);
    
    console.log('All queries completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test with a sample business ID
// Replace with an actual business ID from your database
const sampleBusinessId = 'YOUR_BUSINESS_ID_HERE';
testBusinessProfileQueries(sampleBusinessId);