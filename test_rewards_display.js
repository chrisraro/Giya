// Test script to verify rewards display
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MjAwOSwiZXhwIjoyMDc1MjU4MDA5fQ.VCDbXCvR4win9zx9zDlTGtCUqoVhMU2vHeNhispSl9w'
);

async function testRewardsDisplay() {
  console.log('Testing rewards display...');
  
  try {
    // Simulate the exact query used in the customer rewards page
    console.log('\n1. Testing customer rewards page query...');
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("rewards")
      .select("id,business_id,reward_name,description,points_required,image_url,businesses(id,business_name,profile_pic_url,business_category)")
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    if (rewardsError) {
      console.log('Rewards query error:', rewardsError);
    } else {
      console.log('Successfully fetched', rewardsData.length, 'rewards');
      console.log('Sample rewards:');
      rewardsData.forEach((reward, index) => {
        console.log(`${index + 1}. ${reward.reward_name} (${reward.points_required} points)`);
        console.log(`   Business: ${reward.businesses.business_name}`);
        console.log(`   Category: ${reward.businesses.business_category}`);
        console.log('   ---');
      });
      
      // Test filtering by business
      if (rewardsData.length > 0) {
        const firstBusinessId = rewardsData[0].business_id;
        const businessRewards = rewardsData.filter(r => r.business_id === firstBusinessId);
        console.log(`\n2. Rewards for business ${firstBusinessId}:`, businessRewards.length);
      }
    }
    
    // Test points calculation for a sample customer
    console.log('\n3. Testing points calculation...');
    // We would need a real customer ID to test this properly
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testRewardsDisplay();