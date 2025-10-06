# Giya App - Testing Guide

This guide provides step-by-step instructions to test all the fixes implemented for QR scanner issues and Google Maps integration.

## Prerequisites

1. Deployed Giya application with latest code changes
2. Supabase database with updated schema
3. Test accounts for all user roles:
   - Customer account
   - Business account
   - Influencer account (if needed)

## Testing QR Scanner Functionality

### 1. Customer QR Code Scanning (Business Dashboard)

**Test Steps:**
1. Log in as a business user
2. Navigate to the business dashboard
3. Click "Open QR Scanner" button
4. Position a customer QR code within the scanning frame
5. Verify the scanner detects and processes the QR code
6. Confirm the transaction dialog appears with customer information
7. Enter a purchase amount and create transaction
8. Verify points are awarded to the customer

**Expected Results:**
- QR scanner successfully detects customer QR codes
- Camera access works on both mobile and desktop devices
- Fallback to manual input works when camera is unavailable
- Points are correctly calculated and awarded
- Transaction appears in business transaction history

### 2. Reward Validation QR Scanning (Business Validation Page)

**Test Steps:**
1. Log in as a customer
2. Navigate to Rewards page
3. Redeem a reward you have enough points for
4. Note the redemption QR code that is generated
5. Log in as a business user
6. Navigate to Validate Redemption page
7. Click "Open Scanner" button
8. Scan the customer's redemption QR code
9. Verify redemption details are displayed correctly
10. Click "Validate Redemption"
11. Confirm success message and redirection

**Expected Results:**
- QR scanner successfully detects redemption QR codes
- Redemption details are correctly displayed
- Validation updates redemption status to "validated"
- Points are properly deducted from customer account
- Both customer and business see updated redemption history

## Testing Google Maps Integration

### 1. Google Maps Display

**Test Steps:**
1. Log in as a business user
2. Navigate to business profile page that has a Google Maps link
3. Scroll to the Location section
4. Verify the Google Maps iframe loads correctly
5. Check that the map shows the correct location
6. Click "Visit Location" button
7. Verify it opens the Google Maps link in a new tab

**Expected Results:**
- Google Maps iframe loads without errors
- Map displays the correct business location
- Different Google Maps URL formats are properly converted
- "Visit Location" button opens the correct Google Maps link

### 2. Fallback Handling

**Test Steps:**
1. Test with various Google Maps URL formats:
   - Standard maps URLs
   - Place URLs
   - Search URLs
2. Test with invalid or malformed URLs
3. Verify appropriate fallback behavior

**Expected Results:**
- Valid URLs are properly converted to embed URLs
- Invalid URLs are handled gracefully
- Map still displays or shows appropriate error message

## Testing Point Deductions and Redemptions

### 1. Reward Redemption Flow

**Test Steps:**
1. Log in as a customer with sufficient points
2. Navigate to Rewards page
3. Select a reward to redeem
4. Confirm redemption
5. Verify points are deducted from customer total
6. Check that redemption appears in customer history
7. Verify business can validate the redemption

**Expected Results:**
- Points are immediately deducted upon redemption
- Redemption QR code is generated
- Redemption appears in customer history
- Business can successfully validate redemption
- Points are properly tracked in database

### 2. Transaction Point Awards

**Test Steps:**
1. Log in as a business user
2. Scan a customer QR code
3. Enter purchase amount
4. Confirm transaction
5. Verify points are awarded to customer
6. Check business transaction history

**Expected Results:**
- Points are correctly calculated based on business configuration
- Points are added to customer's total
- Transaction appears in business history
- Customer sees updated point balance

## Cross-Browser and Device Testing

### 1. Browser Compatibility

**Test on the following browsers:**
- Chrome (Desktop and Mobile)
- Firefox (Desktop)
- Safari (Desktop and Mobile)
- Edge (Desktop)

### 2. Device Testing

**Test on the following devices:**
- Desktop computer
- Laptop
- Tablet
- Mobile phone (iOS and Android)

## Error Handling Testing

### 1. Camera Access Issues

**Test Steps:**
1. Deny camera permissions when prompted
2. Try scanning QR codes
3. Use manual input option
4. Grant camera permissions and try again

**Expected Results:**
- Clear error messages when camera access is denied
- Manual input works as fallback
- Scanner works when permissions are granted

### 2. Network and Database Issues

**Test Steps:**
1. Simulate slow network conditions
2. Test with database connectivity issues
3. Verify appropriate error messages
4. Check that UI remains responsive

**Expected Results:**
- Appropriate loading states and error messages
- UI remains functional during network issues
- Data is properly synchronized when connectivity is restored

## Performance Testing

### 1. QR Scanner Performance

**Test Steps:**
1. Measure time to detect QR codes
2. Test scanner with various lighting conditions
3. Test with different QR code sizes and qualities

**Expected Results:**
- QR codes detected within 1-2 seconds
- Scanner works in various lighting conditions
- Works with different QR code sizes

### 2. Map Loading Performance

**Test Steps:**
1. Measure time to load Google Maps iframe
2. Test with slow network connection
3. Verify map caching behavior

**Expected Results:**
- Maps load within reasonable time
- Appropriate loading indicators displayed
- Maps work on slow connections

## Test Data Preparation

### Customer Test Data
- Create customer account with known point balance
- Generate test QR codes for scanning

### Business Test Data
- Create business account with rewards configured
- Set up Google Maps link for location testing
- Configure point earning rates

### Redemption Test Data
- Create test rewards with various point requirements
- Prepare redemption scenarios for testing

## Reporting Issues

If any issues are found during testing:

1. Document the exact steps to reproduce
2. Include browser/device information
3. Capture screenshots or error messages
4. Note expected vs. actual behavior
5. Report to development team with detailed information

## Success Criteria

All tests pass if:
- ✅ QR scanner works for both customer codes and redemption codes
- ✅ Camera access works with proper fallbacks
- ✅ Google Maps displays correctly for all URL formats
- ✅ Points are properly awarded and deducted
- ✅ Redemption flow works seamlessly
- ✅ Application works across different browsers and devices
- ✅ Error handling is appropriate and user-friendly
- ✅ Performance is acceptable for all features