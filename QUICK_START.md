# Quick Start: Meta Marketing API Integration

## Immediate Next Steps

### Step 1: Run Database Migration (REQUIRED)

Open your Supabase SQL Editor and execute:

```sql
-- File: scripts/066_add_meta_marketing_api_fields.sql

-- Add Meta access token field (encrypted in production)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_access_token TEXT;

-- Add Meta ad account ID field
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;

-- Add last sync timestamp
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_meta_ad_account 
ON businesses(meta_ad_account_id) 
WHERE meta_ad_account_id IS NOT NULL;
```

### Step 2: Get Meta Credentials

#### A. Generate Access Token

1. Go to: https://business.facebook.com/settings
2. Click **Users → System Users**
3. Click **Add** (create new system user)
4. Name it "Giya Analytics API"
5. Select **Admin** type
6. Click **Add Assets** → **Ad Accounts** → Select your account → **Full control**
7. Click **Generate New Token**
8. Select permissions: `ads_read`, `read_insights`
9. Set expiration: **Never**
10. Copy the token (you won't see it again!)

#### B. Get Ad Account ID

1. Go to: https://adsmanager.facebook.com
2. Click **Settings** (top menu)
3. Copy your **Ad Account ID** (format: `act_123456789`)

### Step 3: Connect in Giya

1. Login to your business account
2. Go to **Settings**
3. Scroll to **Meta Business Suite Integration** card
4. Paste your Access Token
5. Paste your Ad Account ID
6. Click **Connect Meta Business Suite**
7. Wait for success message

### Step 4: View Analytics

1. Go to **Analytics** page
2. You should see: "✅ Meta Business Suite Connected"
3. View your live ad data:
   - Total Ad Spend
   - Impressions
   - Clicks
   - Cost Per Registration
   - Cost Per Purchase

### Step 5: Sync Data

Click the **Sync Meta Data** button to refresh metrics anytime.

## What You'll See

### Before Connection
- Yellow banner: "Connect Meta Business Suite"
- Manual tracking metrics only

### After Connection
- Green banner: "✅ Meta Business Suite Connected"
- Live ad spend data
- 4 new metric cards:
  - Total Impressions
  - Total Clicks (with CTR)
  - Cost Per Registration
  - Cost Per Purchase
- Last synced timestamp

## Troubleshooting

### "Invalid Access Token"
- Generate a new token in Meta Business Settings
- Ensure you copied the entire token

### "Ad Account Not Found"
- Verify ad account ID includes `act_` prefix
- Check that system user has access to this ad account

### No Data Showing
- Ensure you have active campaigns running
- Wait 24-48 hours for data to populate
- Check Meta Events Manager for pixel events

## Need Help?

📖 Full documentation: `META_MARKETING_API_SETUP.md`  
📋 Implementation details: `IMPLEMENTATION_SUMMARY.md`  
🔗 Meta Docs: https://developers.facebook.com/docs/marketing-api

---

**Ready to test!** Start with Step 1 (database migration).
