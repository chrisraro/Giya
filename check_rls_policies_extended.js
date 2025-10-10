// Script to check RLS policies for all tables including the new discount and exclusive offers tables
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSPolicies() {
  console.log('Checking RLS policies for all tables...\n');
  
  // Tables to check
  const tables = [
    'profiles',
    'customers',
    'businesses',
    'influencers',
    'points_transactions',
    'rewards',
    'redemptions',
    'affiliate_links',
    'affiliate_conversions',
    'discount_offers',
    'discount_usage',
    'exclusive_offers',
    'exclusive_offer_usage'
  ];
  
  for (const table of tables) {
    try {
      // Check if RLS is enabled
      const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status', {
        table_name: table
      });
      
      if (rlsError) {
        console.log(`❌ Error checking RLS for ${table}:`, rlsError.message);
        continue;
      }
      
      const isEnabled = rlsStatus && rlsStatus.length > 0 ? rlsStatus[0].enabled : false;
      console.log(`${isEnabled ? '✅' : '❌'} RLS ${isEnabled ? 'enabled' : 'disabled'} for ${table}`);
      
      if (isEnabled) {
        // Get policies for the table
        const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
          table_name: table
        });
        
        if (policiesError) {
          console.log(`❌ Error getting policies for ${table}:`, policiesError.message);
          continue;
        }
        
        console.log(`   Found ${policies.length} policies:`);
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
        });
      }
      
      console.log(''); // Empty line for readability
    } catch (error) {
      console.log(`❌ Error checking ${table}:`, error.message);
    }
  }
}

// Run the check
checkRLSPolicies();