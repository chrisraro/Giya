# Google Maps API Key Verification

## How to Verify Your Google Maps API Key is Working

### 1. Check Environment Variables

Make sure you have added your Google Maps API key to your environment variables:

In your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 2. Test the API Key

You can test if your API key is working by visiting this URL in your browser:
```
https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=New+York&zoom=10
```

Replace `YOUR_API_KEY` with your actual API key.

### 3. Expected Results

If your API key is working correctly:
- You should see a Google Map of New York
- No errors in the browser console
- The map should load without issues

If your API key is not working:
- You'll see a gray rectangle or error message
- Check the browser console for error messages
- Verify your API key restrictions

### 4. Common Issues and Solutions

#### Issue: "The Google Maps Embed API must be enabled"
**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Maps Embed API"
5. Click on it and press "Enable"

#### Issue: "This API project is not authorized to use this API"
**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click on your API key
5. Under "Application restrictions", make sure it's properly configured for your domain

#### Issue: HTTP Referrer Errors
**Solution**:
1. In the Google Cloud Console, under your API key settings
2. Add your domain to the "Website restrictions" list
3. For local development, add `http://localhost:3000` and `http://localhost:3001`

### 5. Testing in Your Application

After confirming your API key works:

1. Restart your development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. Visit a business profile page with a Google Maps link
3. The map should now load properly instead of showing the fallback

### 6. Verification Checklist

- [ ] API key added to `.env.local`
- [ ] Maps Embed API enabled in Google Cloud Console
- [ ] API key restrictions configured properly
- [ ] Development server restarted
- [ ] Business profile page shows embedded map (not fallback)

### 7. Troubleshooting Tips

1. **Check browser console**: Look for any error messages related to Google Maps
2. **Verify URL format**: Ensure the URLs are being converted correctly
3. **Test with a simple URL**: Try with a basic place URL first
4. **Check network tab**: See if the iframe request is being made and what the response is

### 8. Fallback Behavior

If for any reason the map fails to load, the application will gracefully fall back to:
- A card displaying the business address
- A button to open the location in Google Maps
- Consistent styling with the rest of your application

This ensures users always have access to location information, even if the embedded map isn't working.