// Debug script to test redemption flow step by step
console.log('Starting redemption flow debug...');

// Function to simulate the redemption process with detailed logging
async function debugRedemptionFlow() {
  try {
    console.log('1. Checking if Supabase client is available...');
    
    // Check if we're in a browser environment with Supabase
    if (typeof window === 'undefined') {
      console.log('Not in browser environment, cannot test frontend flow');
      return;
    }
    
    // Check if Supabase is available
    if (!window.supabase) {
      console.log('Supabase client not found on window object');
      return;
    }
    
    console.log('2. Getting current user...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) {
      console.log('User error:', userError);
      return;
    }
    
    if (!user) {
      console.log('No authenticated user found');
      return;
    }
    
    console.log('Current user ID:', user.id);
    
    // Simulate the redemption process
    console.log('3. Simulating redemption creation...');
    
    // This would be the data that gets sent when redeeming a reward
    const redemptionData = {
      customer_id: user.id,
      reward_id: 'test-reward-id', // This would be a real reward ID
      business_id: 'test-business-id', // This would be a real business ID
      points_redeemed: 100, // This would be the actual points required
      redemption_qr_code: 'GIYA-REDEEM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      status: 'pending'
    };
    
    console.log('Redemption data to be inserted:', redemptionData);
    
    // Try to insert (this will likely fail due to foreign key constraints, but we can see the error)
    console.log('4. Attempting to insert redemption...');
    const { data, error } = await window.supabase
      .from('redemptions')
      .insert(redemptionData)
      .select()
      .single();
      
    if (error) {
      console.log('Insert error:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
    } else {
      console.log('Insert successful:', data);
    }
    
    // Also try to query existing redemptions
    console.log('5. Querying existing redemptions...');
    const { data: existingRedemptions, error: queryError } = await window.supabase
      .from('redemptions')
      .select('*')
      .eq('customer_id', user.id)
      .limit(5);
      
    if (queryError) {
      console.log('Query error:', queryError);
    } else {
      console.log('Found', existingRedemptions.length, 'redemptions');
      console.log('Redemptions data:', existingRedemptions);
    }
    
  } catch (err) {
    console.log('Unexpected error in debug flow:', err);
  }
}

// Add a button to the page to trigger the debug
if (typeof document !== 'undefined') {
  // Create a debug button
  const debugButton = document.createElement('button');
  debugButton.textContent = 'Debug Redemption Flow';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '20px';
  debugButton.style.right = '20px';
  debugButton.style.zIndex = '9999';
  debugButton.style.padding = '10px';
  debugButton.style.backgroundColor = '#ff0000';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '5px';
  debugButton.style.cursor = 'pointer';
  
  debugButton.onclick = function() {
    debugRedemptionFlow();
  };
  
  // Add to page
  document.body.appendChild(debugButton);
  
  console.log('Debug button added to page. Click it to test redemption flow.');
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugRedemptionFlow };
}