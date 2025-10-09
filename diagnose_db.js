const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODIwMDksImV4cCI6MjA3NTI1ODAwOX0.b_mdbhjjjgjFVnAHaKNw8fIUrhvaA2Wh59lIcYY-R_o'
);

async function diagnoseDatabase() {
  console.log('Diagnosing database issues...');
  
  try {
    // Check if the redemptions table exists and its structure
    console.log('\n1. Checking redemptions table info...');
    
    // Try to get table schema information
    const { data: tableInfo, error: tableError } = await supabase
      .from('redemptions')
      .select('*')
      .limit(0); // Just get the structure, not data
      
    if (tableError) {
      console.log('Error getting table info:', tableError);
    } else {
      console.log('Table exists and is accessible');
      // Try to get column names from a real query
      if (tableInfo && tableInfo.length === 0) {
        console.log('Table is empty but accessible');
      }
    }
    
    // Try to insert with the old schema (what might be in production)
    console.log('\n2. Testing old schema insertion...');
    const oldSchema = {
      reward_id: '12345678-1234-1234-1234-123456789012', // Valid UUID format
      user_id: '12345678-1234-1234-1234-123456789012',   // Valid UUID format
      status: 'pending'
    };
    
    const { data: oldData, error: oldError } = await supabase
      .from('redemptions')
      .insert(oldSchema)
      .select();
      
    if (oldError) {
      console.log('Old schema insert failed:', oldError);
    } else {
      console.log('Old schema insert succeeded:', oldData);
    }
    
    // Try to insert with the new schema (what we implemented)
    console.log('\n3. Testing new schema insertion...');
    const newSchema = {
      reward_id: '12345678-1234-1234-1234-123456789012',     // Valid UUID format
      customer_id: '12345678-1234-1234-1234-123456789012',  // Valid UUID format
      business_id: '12345678-1234-1234-1234-123456789012',  // Valid UUID format
      points_redeemed: 100,
      redemption_qr_code: 'TEST-QR-CODE-123',
      status: 'pending'
    };
    
    const { data: newData, error: newError } = await supabase
      .from('redemptions')
      .insert(newSchema)
      .select();
      
    if (newError) {
      console.log('New schema insert failed:', newError);
      console.log('This indicates the database migration may not have been applied');
    } else {
      console.log('New schema insert succeeded:', newData);
    }
    
    // Check if we can query with the new schema fields
    console.log('\n4. Testing query with new schema fields...');
    const { data: queryData, error: queryError } = await supabase
      .from('redemptions')
      .select('id, reward_id, customer_id, business_id, points_redeemed, redemption_qr_code, status')
      .limit(1);
      
    if (queryError) {
      console.log('Query with new schema fields failed:', queryError);
      console.log('This confirms the new columns may not exist in production');
    } else {
      console.log('Query with new schema fields succeeded:', queryData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the diagnosis
diagnoseDatabase();