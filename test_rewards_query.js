// Test script to check rewards query
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MjAwOSwiZXhwIjoyMDc1MjU4MDA5fQ.VCDbXCvR4win9zx9zDlTGtCUqoVhMU2vHeNhispSl9w'
);

async function testRewardsQuery() {
  console.log('Testing rewards query...');
  
  try {
    // First, let's check the actual structure of the rewards table
    console.log('\n1. Checking rewards table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('rewards')
      .select('*')
      .limit(1);
      
    if (columnsError) {
      console.log('Error getting table structure:', columnsError);
      
      // Try a different approach to get column names
      console.log('\nTrying alternative approach...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('rewards')
        .select('*')
        .limit(0);
        
      if (sampleError) {
        console.log('Alternative approach also failed:', sampleError);
      } else {
        console.log('Sample data structure:', sampleData);
      }
    } else {
      console.log('Sample row structure:', columns[0]);
      console.log('Column names:', Object.keys(columns[0]));
    }
    
    // Test the exact query used in the frontend
    console.log('\n2. Testing rewards query...');
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("rewards")
      .select("id,business_id,reward_name,description,points_required,image_url,businesses(id,business_name,profile_pic_url,business_category)")
      .eq("is_active", true)
      .order("points_required", { ascending: true })
      .limit(10);

    if (rewardsError) {
      console.log('Rewards query error:', rewardsError);
      
      // Try with name instead of reward_name
      console.log('\nTrying with "name" column...');
      const { data: rewardsData2, error: rewardsError2 } = await supabase
        .from("rewards")
        .select("id,business_id,name,description,points_required,image_url,businesses(id,business_name,profile_pic_url,business_category)")
        .eq("is_active", true)
        .order("points_required", { ascending: true })
        .limit(10);
        
      if (rewardsError2) {
        console.log('Rewards query with "name" also failed:', rewardsError2);
      } else {
        console.log('Rewards query with "name" succeeded, found', rewardsData2.length, 'rewards');
        console.log('Sample rewards:', rewardsData2.slice(0, 3));
      }
    } else {
      console.log('Rewards query succeeded, found', rewardsData.length, 'rewards');
      console.log('Sample rewards:', rewardsData.slice(0, 3));
    }
    
    // Check if there are any active rewards at all
    console.log('\n3. Checking total active rewards...');
    const { count, error: countError } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
      
    if (countError) {
      console.log('Count error:', countError);
    } else {
      console.log('Total active rewards:', count);
    }
    
    // Check businesses table
    console.log('\n4. Checking businesses...');
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id,business_name,business_category")
      .limit(5);
      
    if (businessesError) {
      console.log('Businesses query error:', businessesError);
    } else {
      console.log('Sample businesses:', businesses);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testRewardsQuery();