# Google Vision API Setup Guide for OCR

This guide will help you set up Google Vision API for production receipt OCR processing.

## 🚀 Quick Start

### Option 1: Service Account (Recommended)

**Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "giya-ocr-production")
4. Click "Create"
5. **Copy your Project ID** (you'll need this later)

**Step 2: Enable Vision API**

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "**Cloud Vision API**"
3. Click on it and press "**Enable**"
4. Wait for it to be enabled (takes a few seconds)

**Step 3: Create Service Account**

1. Go to **APIs & Services** → **Credentials**
2. Click "**Create Credentials**" → "**Service Account**"
3. Enter service account name: `giya-vision-ocr`
4. Click "**Create and Continue**"
5. For role, select: **Cloud Vision** → **Cloud Vision API User**
6. Click "**Continue**" → "**Done**"

**Step 4: Generate JSON Key**

1. On the Credentials page, find your service account
2. Click on the service account email
3. Go to the "**Keys**" tab
4. Click "**Add Key**" → "**Create new key**"
5. Choose "**JSON**" format
6. Click "**Create**"
7. **Save the downloaded JSON file** (e.g., `google-vision-key.json`)

**Step 5: Configure Your Project**

1. **Copy the JSON file** to your Giya project root:
   ```
   Giya/
   ├── google-vision-key.json  ← Place it here
   ├── app/
   ├── components/
   └── ...
   ```

2. **Create `.env.local`** file (if you don't have one):
   ```bash
   cp .env.local.example .env.local
   ```

3. **Update `.env.local`** with your credentials:
   ```env
   # Google Vision API Configuration
   GOOGLE_APPLICATION_CREDENTIALS=./google-vision-key.json
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   ```

4. **Important**: Add to `.gitignore` (should already be there):
   ```
   google-vision-key.json
   .env.local
   ```

**Step 6: Restart Your Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart
pnpm dev
```

---

### Option 2: API Key (Simpler, Less Secure)

**Step 1-2: Same as Option 1** (Create project and enable Vision API)

**Step 3: Create API Key**

1. Go to **APIs & Services** → **Credentials**
2. Click "**Create Credentials**" → "**API Key**"
3. Copy the generated API key
4. Click "**Restrict Key**" (recommended)
5. Under "API restrictions", select "Restrict key"
6. Choose "**Cloud Vision API**"
7. Click "**Save**"

**Step 4: Configure Your Project**

Update `.env.local`:
```env
# Google Vision API Configuration
GOOGLE_CLOUD_VISION_API_KEY=your-api-key-here
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

---

## 🧪 Testing OCR Functionality

### 1. **Check Current Mode**

The system automatically detects if Google Vision is configured:
- ✅ **With credentials**: Uses real Google Vision OCR
- ⚠️ **Without credentials**: Falls back to mock OCR

### 2. **Test in Development**

1. **Start your dev server**:
   ```bash
   pnpm dev
   ```

2. **Watch the console** when uploading a receipt:
   ```
   [OCR] Processing image with Google Vision: https://...
   [OCR] Detected text: MERCHANT NAME\nItem 1...
   ```

3. **Expected behavior**:
   - With Google Vision: You'll see actual text from your receipt
   - Without credentials: You'll see mock data with random amounts

### 3. **Upload a Test Receipt**

**Via Mobile Bottom Nav:**
1. Click the **Scan button** (center QR icon)
2. Scan a table QR code OR click "Enter Code Manually"
3. Choose **Camera** or **Upload File**
4. Take photo / select receipt image
5. Watch for success toast notification

**Check the results:**
- Go to your Supabase Dashboard
- Check `receipts` table → look at `ocr_data` column
- Check `points_transactions` table → verify points were awarded

### 4. **Verify Google Vision is Working**

Check your **browser console** (F12):
```javascript
// With Google Vision configured:
[OCR] Processing image with Google Vision: https://storage.supabase.co/...
[OCR] Detected text: STARBUCKS\nCappuccino 5.00\nCroissant 3.50\nTOTAL 8.50

// Without credentials (mock):
[OCR] Google Vision client not initialized, falling back to mock
```

---

## 🔍 Troubleshooting

### "Google Vision client not initialized"

**Cause**: Credentials not properly configured

**Solutions**:
1. Check `.env.local` file exists in project root
2. Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
3. Ensure JSON file exists at specified path
4. Restart dev server after changing `.env.local`

### "Failed to fetch image"

**Cause**: Image URL is not accessible or CORS issue

**Solutions**:
1. Check Supabase storage bucket is publicly accessible
2. Run the storage bucket SQL script: `scripts/060_create_receipt_images_bucket.sql`
3. Verify image was uploaded successfully

### "No text detected in image"

**Cause**: Image quality too poor or no text in image

**Solutions**:
1. Use a clearer receipt image
2. Ensure receipt has visible text
3. Try with good lighting
4. Avoid blurry images

### API Quota Exceeded

**Cause**: Free tier limit reached (1000 requests/month)

**Solutions**:
1. Check usage in [Google Cloud Console](https://console.cloud.google.com/apis/api/vision.googleapis.com/quotas)
2. Enable billing for higher limits
3. Use mock OCR for development/testing

---

## 💰 Pricing & Quotas

### Free Tier
- **1,000 units/month** for free
- 1 unit = 1 image processed
- Perfect for testing and small deployments

### Paid Tier
- First 1,000 units: FREE
- 1,001 - 5,000,000: $1.50 per 1,000 units
- [Full pricing details](https://cloud.google.com/vision/pricing)

---

## 🔐 Security Best Practices

1. **Never commit credentials to git**
   - `.gitignore` already includes `.env.local` and `*.json`
   
2. **Use Service Account (not API Key)** in production
   - More secure
   - Better permission control
   
3. **Restrict Service Account permissions**
   - Only grant "Cloud Vision API User" role
   
4. **Rotate keys regularly**
   - Delete old keys after creating new ones
   
5. **Monitor usage**
   - Set up billing alerts in Google Cloud Console

---

## 📊 Monitoring OCR Performance

Check your Supabase dashboard:

```sql
-- Check OCR success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM receipts
GROUP BY status;

-- Check average processing time
SELECT 
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_seconds
FROM receipts
WHERE status = 'processed';

-- Check recent failures
SELECT id, created_at, status, image_url
FROM receipts
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Production Deployment

### Vercel

Add environment variables in **Vercel Dashboard**:
1. Go to your project → Settings → Environment Variables
2. Add:
   ```
   GOOGLE_CLOUD_PROJECT_ID = your-project-id
   ```
3. For service account JSON:
   - Copy entire content of `google-vision-key.json`
   - Create variable: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Paste JSON as value (as a string)
   
4. Update `lib/ocr-service.ts` to read from env var if needed

### Other Platforms

Similar process - add environment variables in your platform's dashboard.

---

## ✅ Testing Checklist

- [ ] Google Cloud project created
- [ ] Vision API enabled
- [ ] Service account created with correct role
- [ ] JSON key downloaded and placed in project
- [ ] `.env.local` configured with credentials
- [ ] Dev server restarted
- [ ] Receipt uploaded successfully
- [ ] OCR text detected (check console)
- [ ] Points awarded correctly
- [ ] Data saved in Supabase
- [ ] No errors in browser/server console

---

## 📞 Need Help?

- [Google Vision API Documentation](https://cloud.google.com/vision/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Support](https://cloud.google.com/support)
