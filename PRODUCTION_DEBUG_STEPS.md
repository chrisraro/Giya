# Production Debug Steps for Redemption Flow

## Immediate Fixes Applied

1. **Added Toaster Component**: The missing `<Toaster />` component has been added to the root layout, which should fix the toast notification issues.

2. **Fixed Reward Name Reference**: Updated references from `reward_name` to [name](file://c:\Users\User\OneDrive\Desktop\giya\app\business\[id]\page.tsx#L39-L39) in the toast messages.

## Steps to Test and Verify Fixes

### Step 1: Deploy Updated Code
1. Commit and push the changes to your repository
2. Wait for Vercel to deploy the updated code
3. Verify the deployment completed successfully

### Step 2: Test in Production
1. Visit your production site
2. Log in as a customer
3. Navigate to the Rewards page
4. Select a reward and click "Redeem Now"
5. Confirm the redemption

### Step 3: Verify Toast Notifications
You should now see:
- Initial success message: "Reward redeemed! Show the QR code to the business."
- Detailed success message: "Successfully redeemed [Reward Name]! Points have been deducted from your account."

### Step 4: Verify QR Code Display
After redemption, you should see:
- A modal with the QR code
- Details of the redeemed reward
- A "Done" button to close the modal

### Step 5: Verify Snackbar (Undo Functionality)
- A snackbar should appear at the bottom right with an "Undo" button
- Clicking "Undo" should delete the redemption and restore points

### Step 6: Verify Business Validation
1. Log in as a business user
2. Navigate to the Validate Redemption page (via the new button in the dashboard)
3. Click "Open Scanner"
4. Scan the customer's redemption QR code
5. Verify the redemption details are displayed
6. Click "Validate Redemption"
7. Verify success notification appears

### Step 7: Verify Redemption History
1. Log in as a customer
2. Go to your dashboard
3. Click on the "Redemption History" tab
4. Verify the redeemed reward appears with:
   - Reward name
   - Business name
   - Points redeemed
   - Status showing "Completed"
   - Proper date formatting

## Browser Console Debug Commands

If issues persist, run these commands in the browser console:

```javascript
// Check if toast is working
console.log('Toast available:', typeof toast !== 'undefined');
if (typeof toast !== 'undefined') {
  toast.success('Test message - if you see this, toast is working');
}

// Check Supabase connection
console.log('Supabase available:', typeof supabase !== 'undefined');
if (typeof supabase !== 'undefined') {
  supabase.auth.getUser().then(result => {
    console.log('User:', result);
  });
  
  // Test querying redemptions
  supabase.from('redemptions').select('*').limit(1).then(result => {
    console.log('Redemptions query result:', result);
  });
}

// Test inserting a redemption (will likely fail due to FK constraints but shows errors)
const testData = {
  customer_id: 'test-id',
  reward_id: 'test-reward-id',
  business_id: 'test-business-id',
  points_redeemed: 100,
  redemption_qr_code: 'TEST-' + Date.now(),
  status: 'pending'
};

if (typeof supabase !== 'undefined') {
  supabase.from('redemptions').insert(testData).select().then(result => {
    console.log('Insert test result:', result);
  });
}
```

## Common Issues and Solutions

### No Toast Notifications
- **Cause**: Missing Toaster component (now fixed)
- **Solution**: Deploy updated code with Toaster component

### QR Code Not Generated
- **Cause**: Error in redemption creation process
- **Solution**: Check browser console for errors, verify database schema

### Redemption Not Saved
- **Cause**: Database RLS policy violations or foreign key constraints
- **Solution**: Verify database scripts 008 and 018 have been applied

### Business Can't Validate
- **Cause**: Missing [business_id](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/007_update_redemptions_table.sql#L4-L4) in query (now fixed)
- **Solution**: Deploy updated business validation page

## Database Verification

To verify database fixes, check that these queries work in your Supabase SQL editor:

```sql
-- Check that the redemptions table has the correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'redemptions' 
ORDER BY ordinal_position;

-- Check that RLS policies are correct
SELECT * FROM pg_policy WHERE polrelid = 'redemptions'::regclass;

-- Test inserting a redemption (with valid UUIDs from your database)
INSERT INTO redemptions (customer_id, reward_id, business_id, points_redeemed, redemption_qr_code, status)
VALUES ('VALID_CUSTOMER_UUID', 'VALID_REWARD_UUID', 'VALID_BUSINESS_UUID', 100, 'TEST-CODE-123', 'pending')
RETURNING *;
```

## If Issues Persist

1. Check Vercel deployment logs for any errors
2. Verify all environment variables are set correctly
3. Check Supabase logs for RLS policy violations
4. Contact support with specific error messages from the browser console