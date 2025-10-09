// Test script to check QR code generation and validation
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkgcalssjxulsdgqsgvt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2NhbHNzanh1bHNkZ3FzZ3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MjAwOSwiZXhwIjoyMDc1MjU4MDA5fQ.VCDbXCvR4win9zx9zDlTGtCUqoVhMU2vHeNhispSl9w'
);

async function testQRCodes() {
  console.log('Testing QR code generation and validation...');
  
  try {
    // Check existing redemptions to see the QR code format
    console.log('\n1. Checking existing redemption QR codes...');
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select('id, redemption_qr_code, status, redeemed_at')
      .limit(5);
      
    if (redemptionsError) {
      console.log('Error fetching redemptions:', redemptionsError);
    } else {
      console.log('Found', redemptions.length, 'redemptions:');
      redemptions.forEach((redemption, index) => {
        console.log(`${index + 1}. ID: ${redemption.id}`);
        console.log(`   QR Code: ${redemption.redemption_qr_code}`);
        console.log(`   Status: ${redemption.status}`);
        console.log(`   Redeemed: ${redemption.redeemed_at}`);
        console.log('   ---');
      });
    }
    
    // Test querying by a specific QR code
    if (redemptions && redemptions.length > 0 && redemptions[0].redemption_qr_code) {
      const testQRCode = redemptions[0].redemption_qr_code;
      console.log('\n2. Testing query by QR code:', testQRCode);
      
      const { data: queryResult, error: queryError } = await supabase
        .from('redemptions')
        .select('*')
        .eq('redemption_qr_code', testQRCode)
        .single();
        
      if (queryError) {
        console.log('Query error:', queryError);
      } else {
        console.log('Query success. Found redemption with status:', queryResult.status);
        console.log('Business ID:', queryResult.business_id);
      }
    } else {
      console.log('\n2. No valid QR codes found to test');
    }
    
    // Test creating a new redemption with a proper QR code
    console.log('\n3. Testing new redemption creation...');
    const newQRCode = "GIYA-REDEEM-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    console.log('Generated QR code:', newQRCode);
    
    // Note: This will fail due to foreign key constraints, but we can see the format
    const testRedemption = {
      customer_id: '12345678-1234-1234-1234-123456789012',
      reward_id: '12345678-1234-1234-1234-123456789012',
      business_id: '12345678-1234-1234-1234-123456789012',
      points_redeemed: 100,
      redemption_qr_code: newQRCode,
      status: 'pending'
    };
    
    console.log('Test redemption data:', testRedemption);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testQRCodes();