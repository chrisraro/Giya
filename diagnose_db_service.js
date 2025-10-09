const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MjAwOSwiZXhwIjoyMDc1MjU4MDA5fQ.VCDbXCvR4win9zx9zDlTGtCUqoVhMU2vHeNhispSl9w'
);

async function diagnoseDatabaseWithServiceRole() {
  console.log('Diagnosing database with service role (bypasses RLS)...');
  
  try {
    // Check the current structure of the redemptions table
    console.log('\n1. Checking redemptions table structure...');
    
    // Get column information by querying the information schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'redemptions' 
          ORDER BY ordinal_position
        `
      });
      
    if (columnsError) {
      console.log('Error getting column info:', columnsError);
      // Try alternative approach
      console.log('\nTrying alternative approach...');
      
      // Insert with old schema
      const oldSchema = {
        reward_id: '12345678-1234-1234-1234-123456789012',
        user_id: '12345678-1234-1234-1234-123456789012',
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
      
      // Insert with new schema
      const newSchema = {
        reward_id: '12345678-1234-1234-1234-123456789013',
        customer_id: '12345678-1234-1234-1234-123456789013',
        business_id: '12345678-1234-1234-1234-123456789013',
        points_redeemed: 100,
        redemption_qr_code: 'TEST-QR-CODE-456',
        status: 'pending'
      };
      
      const { data: newData, error: newError } = await supabase
        .from('redemptions')
        .insert(newSchema)
        .select();
        
      if (newError) {
        console.log('New schema insert failed:', newError);
      } else {
        console.log('New schema insert succeeded:', newData);
      }
      
      // Check what's actually in the table
      console.log('\nChecking table contents...');
      const { data: tableData, error: tableError } = await supabase
        .from('redemptions')
        .select('*')
        .limit(5);
        
      if (tableError) {
        console.log('Error getting table data:', tableError);
      } else {
        console.log('Table data:', tableData);
      }
    } else {
      console.log('Columns in redemptions table:', columns);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the diagnosis
diagnoseDatabaseWithServiceRole();