# QR Scanner Debug Guide

## Issues Identified and Fixed

### 1. QR Scanner Library Replacement
**Problem**: The previous `jsqr` library was unreliable and kept scanning without detecting codes properly.
**Solution**: Replaced with `html5-qrcode` library which is more robust and reliable.

### 2. Manual Code Entry Validation Issues
**Problem**: Manual code entry was showing "invalid code or code expires" even with valid codes.
**Solution**: Improved validation logic with better error handling and trimming of whitespace.

## How to Test the Fixes

### 1. Test the New QR Scanner
1. Navigate to `/dashboard/business/test-qr-scanner` (new test page)
2. Click "Open Scanner"
3. Scan a customer's redemption QR code
4. Verify the scanner detects and processes the code correctly

### 2. Test Manual Code Entry
1. On the test page, enter a valid redemption code manually
2. Click "Validate Code"
3. Verify the code is validated correctly

### 3. Test with Actual Redemption Flow
1. As a customer, redeem a reward
2. Note the QR code displayed
3. As a business, go to Validate Redemption page
4. Try both scanning and manual entry

## Common Issues and Solutions

### QR Scanner Not Detecting Codes
**Causes**:
- Poor lighting conditions
- Blurry or low-quality QR codes
- Camera access issues
- Incorrect camera selection (front vs rear)

**Solutions**:
- Ensure good lighting
- Make sure the QR code is clear and fully visible in the scanning frame
- Check browser camera permissions
- Try switching between front and rear cameras (automatic in new implementation)

### Manual Code Entry Fails
**Causes**:
- Extra spaces in the code
- Case sensitivity issues
- Wrong code format

**Solutions**:
- Always trim whitespace from entered codes
- Ensure exact match with generated codes
- Check for typos

### "Invalid or Expired Code" Errors
**Causes**:
- Code doesn't exist in database
- Code has already been validated
- Code is for a different business
- Database query issues

**Solutions**:
- Verify the code exists in the redemptions table
- Check redemption status
- Verify business ID matches
- Check database connectivity

## Debugging Steps

### 1. Browser Console Debugging
Open the browser's developer tools and check the Console tab for errors:

```javascript
// Check if Html5Qrcode is available
console.log('Html5Qrcode available:', typeof Html5Qrcode !== 'undefined');

// Test manual validation
supabase.from('redemptions').select('*').eq('redemption_qr_code', 'YOUR_CODE_HERE').single().then(result => {
  console.log('Query result:', result);
});
```

### 2. Database Verification
Check the redemptions table in your Supabase dashboard:

```sql
-- Check existing redemptions
SELECT id, redemption_qr_code, status, business_id 
FROM redemptions 
ORDER BY redeemed_at DESC 
LIMIT 10;

-- Test a specific QR code
SELECT * FROM redemptions 
WHERE redemption_qr_code = 'GIYA-REDEEM-1760031873060-qp3yno80g';
```

### 3. Network Tab Analysis
1. Open Developer Tools → Network tab
2. Try to validate a redemption
3. Look for failed requests to your Supabase endpoint
4. Check request/response payloads

## QR Code Format
All redemption QR codes follow this format:
```
GIYA-REDEEM-{timestamp}-{random_string}
```

Example:
```
GIYA-REDEEM-1760031873060-qp3yno80g
```

## Testing Checklist

### QR Scanner Functionality
- [ ] Scanner initializes correctly
- [ ] Camera access works
- [ ] QR codes are detected and processed
- [ ] Scanner stops after successful detection
- [ ] Error handling for camera issues

### Manual Code Entry
- [ ] Input field accepts text
- [ ] Code validation works
- [ ] Proper error messages for invalid codes
- [ ] Success feedback for valid codes

### Database Integration
- [ ] QR codes are correctly stored in database
- [ ] Queries by QR code return correct data
- [ ] Status updates work correctly
- [ ] Business ID validation works

### User Experience
- [ ] Clear instructions for users
- [ ] Visual feedback during scanning
- [ ] Error messages are helpful
- [ ] Success notifications are clear

## Rollback Plan
If issues persist:

1. Revert to the previous jsQR implementation
2. Restore the original QR scanner component
3. Check for any dependency conflicts
4. Contact support with detailed error logs

The new implementation should resolve all the scanning and validation issues you've experienced.