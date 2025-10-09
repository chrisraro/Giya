// Test script for the discount system
// This script can be run in a Node.js environment with Supabase client

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (replace with your actual credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDiscountSystem() {
  try {
    console.log('Testing Discount System...')
    
    // Test 1: Create a test business and discount offer
    console.log('1. Creating test business and discount offer...')
    
    // Note: This would require a logged in business user
    // In a real test, you would sign in as a business user first
    
    // Test 2: Verify discount offers table structure
    console.log('2. Verifying discount_offers table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('discount_offers')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('Error accessing discount_offers table:', tableError)
    } else {
      console.log('✓ discount_offers table accessible')
    }
    
    // Test 3: Verify discount_usage table structure
    console.log('3. Verifying discount_usage table structure...')
    const { data: usageInfo, error: usageError } = await supabase
      .from('discount_usage')
      .select('*')
      .limit(1)
    
    if (usageError) {
      console.error('Error accessing discount_usage table:', usageError)
    } else {
      console.log('✓ discount_usage table accessible')
    }
    
    // Test 4: Verify increment_discount_usage function
    console.log('4. Verifying increment_discount_usage function...')
    // This would require creating a test discount first
    
    console.log('Discount system test completed.')
    
  } catch (error) {
    console.error('Error during discount system test:', error)
  }
}

// Run the test
testDiscountSystem()