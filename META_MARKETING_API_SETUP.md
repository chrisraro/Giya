# Meta Marketing API Integration Guide

This guide explains how to set up automated ad spend analytics using Meta's Marketing API to fetch real-time conversion data directly from your Meta Business Suite.

## Overview

The Meta Marketing API integration automatically:
- Fetches ad spend data from your Meta Ad Account
- Retrieves conversion metrics (CompleteRegistration, Purchase events)
- Displays real-time analytics without manual data entry
- Calculates cost per conversion and ROAS automatically

## Features

✅ **Automated Data Sync**: No manual ad spend input required  
✅ **Real-time Metrics**: Live data from Meta Marketing API  
✅ **Comprehensive Analytics**: Impressions, clicks, conversions, costs  
✅ **Secure Storage**: Access tokens stored securely in database  
✅ **Easy Setup**: Step-by-step integration in Settings

## Prerequisites

To use this integration, you need:

1. **Meta Business Account** with admin access
2. **Meta Ad Account** (format: `act_XXXXXXXXX`)
3. **Meta Pixel** already configured and tracking events
4. **System User** with Marketing API access
5. **Long-lived Access Token** with `ads_read` permission

## Setup Instructions

### Step 1: Access Meta Business Settings

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Click **Settings** (gear icon in bottom left)
3. Navigate to **Business Settings**

### Step 2: Create a System User

1. In Business Settings, go to **Users → System Users**
2. Click **Add** to create a new system user
3. Name it something like "Giya Analytics API"
4. Select **Admin** system user type
5. Click **Create System User**

### Step 3: Assign Ad Account Access

1. Select your newly created system user
2. Click **Add Assets**
3. Select **Ad Accounts**
4. Choose your ad account and select **Full control**
5. Click **Save Changes**

### Step 4: Generate Access Token

1. Still on the system user page, click **Generate New Token**
2. Select your app or create a new one
3. Set token expiration to **Never** (long-lived token)
4. Select these permissions:
   - `ads_read` (required)
   - `read_insights` (required)
5. Click **Generate Token**
6. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 5: Find Your Ad Account ID

1. Go to [Meta Ads Manager](https://adsmanager.facebook.com)
2. Click **Settings** in the top menu
3. Look for **Ad Account ID** (format: `act_XXXXXXXXX`)
4. Copy the entire ID including the `act_` prefix

### Step 6: Connect in Giya Settings

1. Log into your Giya business account
2. Go to **Settings**
3. Scroll to **Meta Business Suite Integration**
4. Paste your **Access Token** from Step 4
5. Paste your **Ad Account ID** from Step 5
6. Click **Connect Meta Business Suite**

### Step 7: Verify Connection

1. Go to **Analytics** page
2. You should see a green banner: "✅ Meta Business Suite Connected"
3. Ad spend data will display automatically
4. Click **Sync Meta Data** to refresh

## What Data is Fetched

The integration retrieves the following metrics from Meta:

### Ad Performance Metrics
- **Total Ad Spend**: Amount spent in last 30 days
- **Impressions**: Number of times ads were shown
- **Clicks**: Number of clicks on ads
- **Reach**: Unique users who saw ads
- **CTR**: Click-through rate percentage

### Conversion Metrics
- **CompleteRegistration Count**: Signups from ads
- **Purchase Count**: First purchases from referred customers
- **Cost Per Registration**: Average cost to acquire a signup
- **Cost Per Purchase**: Average cost per first purchase
- **ROAS**: Return on Ad Spend calculation

## Database Schema

The following fields are added to the `businesses` table:

```sql
meta_access_token       TEXT    -- Long-lived Meta access token
meta_ad_account_id      TEXT    -- Ad Account ID (act_XXXXXXXX)
meta_last_sync_at       TIMESTAMP -- Last time data was synced
```

## API Endpoints

### GET /api/meta-ads/analytics

Fetches current ad data from Meta Marketing API.

**Query Parameters:**
- `days` (optional): Number of days to fetch (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "metaAds": {
      "spend": 5000.00,
      "impressions": 50000,
      "clicks": 2500,
      "reach": 45000,
      "completeRegistrations": 150,
      "purchases": 45,
      "costPerRegistration": 33.33,
      "costPerPurchase": 111.11,
      "roas": 0.9
    },
    "dateRange": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "business": {
      "id": "business-uuid",
      "name": "Your Business",
      "pixelId": "123456789012345"
    },
    "syncedAt": "2025-11-30T10:00:00.000Z"
  }
}
```

### POST /api/meta-ads/analytics

Stores Meta access token and ad account ID.

**Request Body:**
```json
{
  "accessToken": "EAAG...",
  "adAccountId": "act_123456789"
}
```

## Security Considerations

### Access Token Storage
- Access tokens are stored in the database
- **IMPORTANT**: In production, encrypt tokens at rest
- Use environment variables for encryption keys
- Never expose tokens in client-side code

### Token Security Best Practices
1. Use long-lived tokens (60 days expiration)
2. Rotate tokens regularly
3. Use system users (not personal accounts)
4. Grant minimal required permissions
5. Monitor token usage in Meta Business Settings

### Recommended: Encrypt Tokens in Production

Add encryption to `lib/meta-marketing-api.ts`:

```typescript
import { encrypt, decrypt } from '@/lib/encryption'

// When storing token
const encryptedToken = encrypt(accessToken)
await supabase.from('businesses').update({ 
  meta_access_token: encryptedToken 
})

// When fetching token
const { data } = await supabase.from('businesses').select('meta_access_token')
const decryptedToken = decrypt(data.meta_access_token)
```

## Troubleshooting

### Error: "Invalid Access Token"
**Solution**: Token may have expired. Generate a new token in Meta Business Settings.

### Error: "Insufficient Permissions"
**Solution**: Ensure system user has `ads_read` and `read_insights` permissions.

### Error: "Ad Account Not Found"
**Solution**: Verify the ad account ID format includes `act_` prefix.

### No Data Showing
**Solution**: 
1. Ensure your Meta Pixel is properly installed
2. Check that ads are actively running
3. Verify events are firing in Meta Events Manager
4. Wait 24-48 hours for data to populate

### "Meta Business Account Not Connected"
**Solution**: Go to Settings and complete the Meta Business Suite integration setup.

## FAQ

### How often does data sync?
Data syncs on-demand when you click "Sync Meta Data" or when you refresh the Analytics page.

### Can I view historical data?
Yes, you can adjust the date range by modifying the `days` parameter in the API call (default: 30 days).

### Does this work with Facebook Ads only?
Yes, this works with Meta Ads (Facebook and Instagram campaigns).

### What happens if my access token expires?
You'll see an error message. Simply generate a new token and update it in Settings.

### Is my data secure?
Yes, access tokens are stored securely. We recommend encrypting tokens at rest in production.

## Support

For issues or questions:
1. Check Meta's [Marketing API Documentation](https://developers.facebook.com/docs/marketing-api)
2. Review [Meta Business Help Center](https://www.facebook.com/business/help)
3. Contact Giya support with error messages from browser console

## Migration from Manual Entry

If you previously entered ad spend manually:

1. Old manual entries are not affected
2. Connect Meta Business Suite to get automated data
3. Analytics will show real-time data from Meta API
4. No need to manually update ad spend anymore

## Next Steps

After setup:
1. ✅ View real-time analytics in Analytics page
2. ✅ Monitor conversion metrics automatically
3. ✅ Optimize ad campaigns based on ROAS data
4. ✅ Track CompleteRegistration and Purchase events
5. ✅ Make data-driven marketing decisions

---

**Last Updated**: November 30, 2025  
**Version**: 1.0.0
