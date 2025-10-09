const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with anon key (respects RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODIwMDksImV4cCI6MjA3NTI1ODAwOX0.b_mdbhjjjgjFVnAHaKNw8fIUrhvaA2Wh59lIcYY-R_o'
);

async function checkRLSPolicies() {
  console.log('Checking RLS policies for redemptions table...');
  
  try {
    // Try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('Error getting user:', userError);
      console.log('This might indicate auth issues in production');
      return;
    }
    
    if (!user) {
      console.log('No user authenticated');
      console.log('In production, this could cause RLS policy violations');
      return;
    }
    
    console.log('Current user:', user.id);
    
    // Try to query redemptions with different filters
    console.log('\n1. Querying redemptions as current user...');
    const { data: userData, error: userError2 } = await supabase
      .from('redemptions')
      .select('*')
      .limit(5);
      
    if (userError2) {
      console.log('User query failed:', userError2);
    } else {
      console.log('User query succeeded, found', userData.length, 'records');
    }
    
    // Try to query with specific customer_id
    console.log('\n2. Querying with customer_id filter...');
    const { data: customerData, error: customerError } = await supabase
      .from('redemptions')
      .select('*')
      .eq('customer_id', user.id)
      .limit(5);
      
    if (customerError) {
      console.log('Customer query failed:', customerError);
    } else {
      console.log('Customer query succeeded, found', customerData.length, 'records');
    }
    
    // Try to query with business_id
    console.log('\n3. Querying with business_id filter...');
    const { data: businessData, error: businessError } = await supabase
      .from('redemptions')
      .select('*')
      .eq('business_id', user.id)
      .limit(5);
      
    if (businessError) {
      console.log('Business query failed:', businessError);
    } else {
      console.log('Business query succeeded, found', businessData.length, 'records');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the check
checkRLSPolicies();