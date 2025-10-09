const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODIwMDksImV4cCI6MjA3NTI1ODAwOX0.b_mdbhjjjgjFVnAHaKNw8fIUrhvaA2Wh59lIcYY-R_o'
);

async function testRedemptionFlow() {
  console.log('Testing redemption flow...');
  
  try {
    // First, let's check what columns exist in the redemptions table
    console.log('\n1. Checking redemptions table structure...');
    
    // Try to get column information using a simple query
    const { data: sampleData, error: sampleError } = await supabase
      .from('redemptions')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.log('Error getting sample data:', sampleError);
    } else {
      console.log('Sample row structure:', sampleData ? sampleData[0] : 'No data found');
    }
    
    // Try to insert a test redemption with the new schema
    console.log('\n2. Testing insertion with new schema...');
    const testRedemption = {
      reward_id: 'test-reward-id',
      customer_id: 'test-customer-id',
      business_id: 'test-business-id',
      points_redeemed: 100,
      redemption_qr_code: 'TEST-QR-CODE-123',
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('redemptions')
      .insert(testRedemption)
      .select();
      
    if (insertError) {
      console.log('Insert error (new schema):', insertError);
    } else {
      console.log('Insert success (new schema):', insertData);
    }
    
    // Try with the old schema
    console.log('\n3. Testing insertion with old schema...');
    const oldSchemaRedemption = {
      reward_id: 'test-reward-id-2',
      user_id: 'test-user-id',
      status: 'pending'
    };
    
    const { data: oldInsertData, error: oldInsertError } = await supabase
      .from('redemptions')
      .insert(oldSchemaRedemption)
      .select();
      
    if (oldInsertError) {
      console.log('Insert error (old schema):', oldInsertError);
    } else {
      console.log('Insert success (old schema):', oldInsertData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testRedemptionFlow();