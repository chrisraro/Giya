# Browser Debug Guide for Redemption Flow

## How to Debug the Redemption Flow in Production

### Step 1: Open Browser Developer Tools
1. Navigate to your production app
2. Right-click anywhere on the page and select "Inspect" or press `F12`
3. Go to the "Console" tab

### Step 2: Check for JavaScript Errors
Look for any red error messages in the console. These might indicate what's going wrong.

### Step 3: Test Supabase Connection
Run these commands in the console:

```javascript
// Check if Supabase is available
console.log('Supabase available:', typeof supabase !== 'undefined');

// Check current user
supabase.auth.getUser().then(result => {
  console.log('User result:', result);
});

// Try to query redemptions
supabase.from('redemptions').select('*').limit(1).then(result => {
  console.log('Redemptions query result:', result);
});
```

### Step 4: Test Toast Notifications
Run this to check if toast notifications are working:

```javascript
// Check if toast is available
console.log('Toast available:', typeof toast !== 'undefined');

// Try to show a test toast
if (typeof toast !== 'undefined') {
  toast.success('Test notification');
}
```

### Step 5: Debug the Redemption Process
If you're on the rewards page, you can try to manually trigger the redemption process:

```javascript
// This simulates what happens when you click "Redeem Now"
// You'll need to replace 'YOUR_REWARD_ID' and 'YOUR_BUSINESS_ID' with actual values

const testData = {
  customer_id: 'YOUR_USER_ID', // Get this from the user result above
  reward_id: 'YOUR_REWARD_ID',
  business_id: 'YOUR_BUSINESS_ID',
  points_redeemed: 100, // Replace with actual points required
  redemption_qr_code: 'GIYA-REDEEM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  status: 'pending'
};

console.log('Test data:', testData);

supabase.from('redemptions').insert(testData).select().then(result => {
  console.log('Insert result:', result);
});
```

### Step 6: Check Network Requests
1. In Developer Tools, go to the "Network" tab
2. Try to redeem a reward
3. Look for any failed requests (they'll appear in red)
4. Click on failed requests to see details

### Common Issues to Look For:

1. **Authentication Issues**: User not properly authenticated
2. **RLS Policy Violations**: Database permissions preventing insert/query
3. **Foreign Key Constraints**: Trying to insert data that references non-existent records
4. **Network Errors**: API requests failing
5. **JavaScript Errors**: Uncaught exceptions preventing code execution

### What to Report:
If you find any errors, please note:
1. The exact error message
2. The error code (if present)
3. Which operation was failing (insert, query, etc.)
4. Any relevant data that was being processed

This information will help identify the specific issue causing the redemption flow to fail.