const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  'https://hkgcalssjxulsdgqsgvt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODIwMDksImV4cCI6MjA3NTI1ODAwOX0.b_mdbhjjjgjFVnAHaKNw8fIUrhvaA2Wh59lIcYY-R_o'
);

async function checkRedemptionsTable() {
  try {
    // Check the structure of the redemptions table
    console.log('Checking redemptions table structure...');
    
    // Try to get table info
    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('Error querying redemptions table:', error);
      return;
    }
    
    console.log('Sample data from redemptions table:', data);
    
    // Check for specific columns
    const testInsert = {
      reward_id: 'test-id',
      customer_id: 'test-customer-id',
      business_id: 'test-business-id',
      points_redeemed: 100,
      redemption_qr_code: 'TEST-CODE-123',
      status: 'pending'
    };
    
    console.log('Testing insert with new schema...', testInsert);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRedemptionsTable();