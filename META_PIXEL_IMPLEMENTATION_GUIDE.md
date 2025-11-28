# Meta Pixel Integration Implementation Guide

## ✅ Completed

### Phase 1: Database Schema
- ✅ Created `/scripts/065_add_meta_pixel_tracking.sql`
  - Added `meta_pixel_id` column to businesses table
  - Added `referred_by` column to profiles table  
  - Created RLS policies for public access to pixel IDs
  - Created `is_first_transaction_for_business()` helper function

### Phase 2: Core Components Created
- ✅ Created `/components/tracking/meta-pixel.tsx`
  - MetaPixel component for loading pixel script
  - Helper functions: `trackMetaPixelEvent`, `trackSignupConversion`, `trackPurchaseConversion`
  
- ✅ Created `/lib/tracking/referral-tracking.ts`
  - Cookie management functions
  - Business pixel ID retrieval
  - Referral attribution utilities

## 📋 TODO: Implementation Steps

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor
# Run: scripts/065_add_meta_pixel_tracking.sql
```

### Step 2: Update Auth Callback (Phase 2.3)
**File:** `app/auth/callback/route.ts`

Add after `exchangeCodeForSession`:
```typescript
import { getReferralCookie, clearReferralCookie } from '@/lib/tracking/referral-tracking'
import { trackSignupConversion } from '@/components/tracking/meta-pixel'

// Get referral cookie
const referralBusinessId = await getReferralCookie()

if (referralBusinessId && user) {
  // Update profile with referrer
  await supabaseAdmin
    .from('profiles')
    .update({ referred_by: referralBusinessId })
    .eq('id', user.id)
  
  // Get pixel ID and track signup (client-side via redirect)
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('meta_pixel_id')
    .eq('id', referralBusinessId)
    .single()
  
  if (business?.meta_pixel_id) {
    // Store in session/cookie for client-side tracking
    // Will be picked up by signup success page
  }
}
```

### Step 3: Update Signup Page (Phase 2.1)
**File:** `app/auth/signup/page.tsx`

```typescript
import { MetaPixel } from '@/components/tracking/meta-pixel'
import { setReferralCookie, getBusinessPixelId } from '@/lib/tracking/referral-tracking'

export default async function SignupPage({
  searchParams
}: {
  searchParams: { ref?: string }
}) {
  let pixelId: string | null = null
  
  // Check for referral parameter
  if (searchParams.ref) {
    await setReferralCookie(searchParams.ref)
    pixelId = await getBusinessPixelId(searchParams.ref)
  }
  
  return (
    <>
      {pixelId && <MetaPixel pixelId={pixelId} />}
      {/* Rest of signup form */}
    </>
  )
}
```

### Step 4: Update Receipt Processing API (Phase 3.1 & 3.2)
**File:** `app/api/receipts/process/route.ts`

Add to response after successful processing:
```typescript
// After creating points transaction
const isFirstTransaction = await supabaseAdmin
  .rpc('is_first_transaction_for_business', {
    p_customer_id: receipt.customer_id,
    p_business_id: receipt.business_id
  })

return NextResponse.json({
  success: true,
  receiptId,
  ocrData,
  pointsEarned,
  isFirstTransaction, // Add this to response
  message: `Receipt processed successfully! You earned ${pointsEarned} points.`
})
```

### Step 5: Update UnifiedScanner Component (Phase 3.2)
**File:** `components/unified-scanner.tsx`

After successful receipt processing:
```typescript
import { trackPurchaseConversion } from '@/components/tracking/meta-pixel'

// In success handler after API response
if (result.isFirstTransaction) {
  console.log('[Scanner] First transaction detected, tracking conversion')
  
  // Get user's referrer pixel ID
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single()
    
    if (profile?.referred_by) {
      const { data: business } = await supabase
        .from('businesses')
        .select('meta_pixel_id, business_name')
        .eq('id', profile.referred_by)
        .single()
      
      if (business?.meta_pixel_id) {
        trackPurchaseConversion(business.meta_pixel_id, {
          value: result.ocrData.totalAmount,
          currency: 'PHP',
          content_name: `First purchase at ${business.business_name}`
        })
      }
    }
  }
}
```

### Step 6: Add Marketing Settings UI (Phase 4)
**File:** `app/dashboard/business/settings/page.tsx`

Add a new section:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Marketing & Tracking</CardTitle>
    <CardDescription>
      Configure your Meta (Facebook) Pixel for conversion tracking
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSavePixel}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
          <Input
            id="meta_pixel_id"
            placeholder="1234567890123456"
            pattern="[0-9]{15,16}"
            title="Enter a 15-16 digit Pixel ID"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Find your Pixel ID in Facebook Events Manager
          </p>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Your Referral Link</h4>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`https://yourapp.com/auth/signup?ref=${businessId}`}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `https://yourapp.com/auth/signup?ref=${businessId}`
                )
                toast.success('Link copied!')
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this link in your ads to track signups and purchases
          </p>
        </div>
        
        <Button type="submit">Save Pixel Settings</Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### Step 7: Cookie Consent (Phase 5.1)
**File:** Create `components/cookie-consent-banner.tsx`

```tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])
  
  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setShowBanner(false)
  }
  
  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setShowBanner(false)
  }
  
  if (!showBanner) return null
  
  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md p-4 z-50">
      <h3 className="font-semibold mb-2">Cookie Consent</h3>
      <p className="text-sm text-muted-foreground mb-4">
        We use cookies to improve your experience and track marketing performance
        for our business partners.
      </p>
      <div className="flex gap-2">
        <Button onClick={acceptCookies} size="sm">Accept</Button>
        <Button onClick={declineCookies} variant="outline" size="sm">
          Decline
        </Button>
      </div>
    </Card>
  )
}
```

Update MetaPixel component to check consent:
```tsx
const [hasConsent, setHasConsent] = useState(false)

useEffect(() => {
  const consent = localStorage.getItem('cookie_consent')
  setHasConsent(consent === 'accepted')
}, [])

// Only render if enabled AND has consent
if (!enabled || !pixelId || !hasConsent) {
  return null
}
```

## 🧪 Testing Checklist

### Test 1: Referral Link & Cookie
1. Visit: `http://localhost:3000/auth/signup?ref=BUSINESS_UUID`
2. Check DevTools → Application → Cookies
3. Verify `referral_business_id` cookie exists with 30-day expiry

### Test 2: Pixel Initialization
1. Install "Meta Pixel Helper" Chrome extension
2. Visit signup page with `?ref=` parameter
3. Pixel Helper should light up green
4. Check console for `[Meta Pixel] Initialized` log

### Test 3: Signup Attribution
1. Complete Facebook signup with `?ref=` link
2. Check Supabase `profiles` table
3. Verify `referred_by` column is populated

### Test 4: First Purchase Conversion
1. Sign up as new customer via referral link
2. Upload first receipt
3. Check Meta Pixel Helper for "Purchase" event
4. Verify event shows correct amount and currency

### Test 5: Multi-Merchant Isolation
1. Sign up via Merchant A's link
2. Make purchase at Merchant B
3. Verify Merchant A's pixel fires (referrer gets credit)

## 📊 Monitoring

### Database Queries
```sql
-- Check businesses with pixels configured
SELECT business_name, meta_pixel_id 
FROM businesses 
WHERE meta_pixel_id IS NOT NULL;

-- Check attributed signups
SELECT 
  p.email,
  p.created_at,
  b.business_name AS referred_by_business
FROM profiles p
LEFT JOIN businesses b ON p.referred_by = b.id
WHERE p.referred_by IS NOT NULL
ORDER BY p.created_at DESC;

-- First transactions by referrer
SELECT 
  b.business_name AS referrer,
  COUNT(DISTINCT pt.customer_id) AS first_purchases,
  SUM(pt.amount_spent) AS total_revenue
FROM profiles p
JOIN businesses b ON p.referred_by = b.id
JOIN points_transactions pt ON pt.customer_id = p.id
WHERE pt.id IN (
  SELECT MIN(id) FROM points_transactions 
  GROUP BY customer_id
)
GROUP BY b.id, b.business_name;
```

## 🔒 Privacy & Compliance

### Privacy Policy Updates
Add to `/app/privacy/page.tsx`:

```markdown
## Third-Party Tracking

We use Facebook Pixel to help our business partners measure the effectiveness 
of their advertising campaigns. When you visit our platform through a business's 
marketing link, we may share anonymized conversion data with that business.

You can opt out of tracking cookies at any time through our cookie settings.
```

### GDPR Considerations
- ✅ Cookie consent banner required
- ✅ Only load pixels after user consent
- ✅ Allow users to withdraw consent
- ✅ Provide privacy policy explaining usage

## 🚀 Deployment

1. Run database migration on production Supabase
2. Update environment variables (none needed for this feature)
3. Deploy updated code to Vercel
4. Test with a real Meta Pixel ID
5. Share referral link documentation with merchants

## 📚 Resources

- [Meta Pixel Setup Guide](https://www.facebook.com/business/help/952192354843755)
- [Meta Pixel Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper)
