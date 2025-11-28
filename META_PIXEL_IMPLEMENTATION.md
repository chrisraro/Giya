# ✅ Meta Pixel System Migration - Implementation Complete

## 📋 Implementation Summary

The Meta Pixel attribution system has been successfully refactored from a hardcoded/generic tracking approach to a **dynamic, multi-tenant, privacy-first system** that prevents double counting and enables accurate conversion tracking for businesses.

---

## 🎯 System Architecture

### **Core Concept: First-Touch Attribution**
When a customer clicks a business's referral link (`/?ref=BUSINESS_ID`):
1. **Middleware** captures the business ID and stores it in a cookie (30 days)
2. **On signup**, the customer's profile is attributed to that business
3. **On first transaction**, a Purchase event fires to that business's Meta Pixel
4. **Subsequent transactions** do NOT fire conversion events (prevents double counting)

---

## 🗂️ Files Created/Modified

### ✅ **Database Migration**
- **`scripts/056_meta_pixel_migration.sql`**
  - Adds `meta_pixel_id` column to `businesses` table
  - Adds `referred_by` column to `profiles` table (UUID foreign key to businesses)
  - Creates indexes for performance
  - Creates `business_referral_stats` view for analytics
  - Handles edge cases (existing columns, type conflicts)

### ✅ **Backend & Middleware**
- **`middleware.ts`**
  - Changed cookie from `affiliate_referral_code` → `referral_business_id`
  - Extended expiry from 7 days → 30 days
  - Now stores business UUID instead of text code

- **`app/auth/callback/route.ts`**
  - Added First Touch Attribution logic
  - Only sets `referred_by` if currently NULL
  - Preserves legacy affiliate code for influencer system

- **`lib/tracking/referral-tracking.ts`** (already existed)
  - Server-side utilities for fetching referral pixel ID
  - Validates business is active and approved

### ✅ **Frontend Components**
- **`components/tracking/business-pixel.tsx`** (NEW)
  - Dynamic Meta Pixel injection (only loads when needed)
  - Privacy-first: No pixel = no script loaded
  - Exports tracking functions: `trackSignupConversion`, `trackPurchaseConversion`

- **`app/page.tsx`** (Landing Page)
  - Integrated `<BusinessPixel>` component
  - Fetches pixel ID server-side from referral cookie

- **`components/receipt-upload.tsx`**
  - Added Meta Pixel Purchase tracking on first transaction
  - Calls `trackPurchaseConversion` when API returns tracking data

### ✅ **API Routes**
- **`app/api/receipts/process/route.ts`**
  - Added first transaction detection logic
  - Checks if customer was referred by a business
  - Returns `metaPixelTracking` data if conditions met
  - Logs all steps for debugging

### ✅ **Business Dashboard**
- **`app/dashboard/business/settings/page.tsx`**
  - Added "Meta Pixel Integration" card
  - Input for Meta Pixel ID
  - Displays referral link (`/?ref={businessId}`)
  - Copy-to-clipboard functionality
  - Visual confirmation when pixel is connected

---

## 🧪 Verification Checklist

### ✅ **Phase 1: Audit & Cleanup**
- [x] No hardcoded pixels in `app/layout.tsx`
- [x] No `react-facebook-pixel` package installed
- [x] Old `affiliate_referral_code` cookie logic replaced
- [x] Existing `meta-pixel.tsx` component NOT being used (new `business-pixel.tsx` created)

### ⏳ **Phase 2: Database Migration**
- [ ] Run `scripts/056_meta_pixel_migration.sql` in Supabase SQL Editor
- [ ] Verify `businesses.meta_pixel_id` column exists
- [ ] Verify `profiles.referred_by` column exists (UUID type)
- [ ] Check `business_referral_stats` view was created

### ⏳ **Phase 3: Backend Testing**
- [ ] **Middleware Test**
  - Visit `http://localhost:3000/?ref=TEST_BUSINESS_ID`
  - Check browser DevTools → Application → Cookies
  - Verify `referral_business_id` cookie exists with 30-day expiry

- [ ] **Auth Callback Test**
  - Sign up a new account after setting referral cookie
  - Check Supabase Dashboard → `profiles` table
  - Verify `referred_by` column populated with business UUID

### ⏳ **Phase 4: Frontend Testing**
- [ ] **Landing Page Pixel Test**
  - Visit with `?ref=VALID_BUSINESS_ID` (business must have `meta_pixel_id` set)
  - Open DevTools → Elements → Search for `fbevents.js`
  - Verify pixel script loaded
  
- [ ] **No Referral Test**
  - Visit without `?ref` parameter
  - Verify NO `fbevents.js` loaded (privacy check)
  - Console should show: `[Business Pixel] No pixel ID provided - not loading`

### ⏳ **Phase 5: Business Dashboard**
- [ ] Login as a business user
- [ ] Navigate to Settings page
- [ ] Verify "Meta Pixel Integration" card appears
- [ ] Enter a test Pixel ID (e.g., `123456789012345`)
- [ ] Click "Copy" button for referral link
- [ ] Verify link format: `http://localhost:3000/?ref={businessId}`
- [ ] Save settings and verify pixel ID persisted

### ⏳ **Phase 6: End-to-End Conversion Tracking**
**Setup:**
1. Create a test business account
2. Set Meta Pixel ID in Settings (use a real or test pixel ID)
3. Copy the referral link

**Test Flow:**
1. **Open Incognito Window**
2. **Visit referral link** (`/?ref=BUSINESS_ID`)
3. **Check Cookie**: DevTools → `referral_business_id` exists
4. **Check DOM**: Search for `fbevents.js` - should be loaded
5. **Sign up as a customer**
6. **Upload first receipt** for that business
7. **Check Console**: Should show Meta Pixel Purchase event
8. **Check Network Tab**: Look for requests to `facebook.com/tr?id=...&ev=Purchase`
9. **Upload second receipt**: NO Purchase event should fire

**Expected Console Logs:**
```
[Middleware] Referral cookie set for business: {businessId}
[Business Pixel] Initialized for Business Pixel ID: {pixelId}
[OCR API] 🎯 Checking for Meta Pixel Purchase tracking...
[OCR API] Transaction count: 1, Is first: true
[OCR API] ✅ Referring business has Meta Pixel ID: {pixelId}
[📊 Meta Pixel] Tracking first Purchase for {businessName}: {...}
[Business Pixel] Purchase tracked: {...}
```

---

## 🚨 Common Issues & Solutions

### **Issue: Pixel not loading on landing page**
**Solution:** 
- Check if business has `meta_pixel_id` set in database
- Verify `referral_business_id` cookie exists
- Check business `approval_status` is `approved` and `is_active` is `true`

### **Issue: Purchase event not firing**
**Solution:**
- Verify it's the customer's first transaction (check `points_transactions` count)
- Verify customer has `referred_by` set in `profiles` table
- Check API logs for Meta Pixel tracking messages
- Ensure referring business has `meta_pixel_id` configured

### **Issue: Double counting (events firing on every transaction)**
**Solution:**
- Check first transaction detection logic in `app/api/receipts/process/route.ts`
- Verify `transactionCount === 1` condition is working
- Check that second transaction returns `metaPixelTracking: null`

---

## 📊 Database Queries for Debugging

### Check if business has pixel configured
```sql
SELECT id, business_name, meta_pixel_id, is_active, approval_status
FROM businesses
WHERE id = '{businessId}';
```

### Check customer attribution
```sql
SELECT p.id, p.email, p.referred_by, b.business_name
FROM profiles p
LEFT JOIN businesses b ON b.id = p.referred_by
WHERE p.id = '{customerId}';
```

### Count customer transactions
```sql
SELECT COUNT(*) as transaction_count
FROM points_transactions
WHERE customer_id = '{customerId}';
```

### View referral stats for a business
```sql
SELECT * FROM business_referral_stats
WHERE business_id = '{businessId}';
```

---

## 🎓 How to Use (Business Owner Guide)

### **Step 1: Get Your Meta Pixel ID**
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2/)
2. Select your Pixel
3. Copy the Pixel ID (15-digit number)

### **Step 2: Configure in Naga Perks**
1. Login to your business account
2. Go to **Settings**
3. Find "Meta Pixel Integration" section
4. Paste your Pixel ID
5. Click **Save Changes**

### **Step 3: Get Your Referral Link**
1. In the same "Meta Pixel Integration" section
2. Copy your unique referral link
3. Use this link in your Meta ads or social media posts

### **Step 4: Track Results**
- **CompleteRegistration**: Fires when someone signs up via your link
- **Purchase**: Fires on their first transaction only
- View conversion data in Meta Events Manager

---

## 🔐 Security & Privacy Features

✅ **First-Touch Attribution**: Customer can only be attributed once
✅ **30-Day Cookie Expiry**: Reasonable attribution window
✅ **No Pixel by Default**: Privacy-first (pixel only loads if referred)
✅ **Business Validation**: Only approved and active businesses can track
✅ **Server-Side Attribution**: Cookie set server-side, prevents client manipulation
✅ **Single Conversion Per Customer**: Prevents double counting

---

## 🚀 Next Steps

1. **Run Database Migration** (`056_meta_pixel_migration.sql`)
2. **Test in Development** (use checklist above)
3. **Deploy to Production**
4. **Monitor Console Logs** for first few conversions
5. **Educate Businesses** on how to configure their pixels

---

## 📝 Notes

- Old `affiliate_referral_code` cookie preserved for legacy influencer system
- Legacy `meta-pixel.tsx` component should be **deleted** after confirming new system works
- Business owners can change their Pixel ID anytime without affecting past attributions
- First transaction detection is based on `points_transactions` count (reliable)

---

**Implementation Date**: November 28, 2025  
**Status**: ✅ COMPLETE - Ready for Testing
