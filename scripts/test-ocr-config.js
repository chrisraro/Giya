// Test OCR Configuration
// Run this with: node scripts/test-ocr-config.js

console.log('🔍 Checking OCR Configuration...\n');

// Check environment variables
const hasProjectId = !!process.env.GOOGLE_CLOUD_PROJECT_ID;
const hasServiceAccount = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasApiKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

console.log('Environment Variables:');
console.log(`  GOOGLE_CLOUD_PROJECT_ID: ${hasProjectId ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${hasServiceAccount ? '✅ Set' : '⚠️  Not set'}`);
console.log(`  GOOGLE_CLOUD_VISION_API_KEY: ${hasApiKey ? '✅ Set' : '⚠️  Not set'}\n`);

// Check if at least one auth method is configured
const hasAuth = hasServiceAccount || hasApiKey;

if (hasProjectId && hasAuth) {
  console.log('✅ Google Vision API is CONFIGURED');
  console.log('   OCR will use real Google Vision API\n');
  
  if (hasServiceAccount) {
    const fs = require('fs');
    const path = require('path');
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (credPath) {
      const fullPath = path.isAbsolute(credPath) ? credPath : path.join(process.cwd(), credPath);
      const exists = fs.existsSync(fullPath);
      
      console.log(`Service Account File:`);
      console.log(`  Path: ${credPath}`);
      console.log(`  Full Path: ${fullPath}`);
      console.log(`  Exists: ${exists ? '✅ Yes' : '❌ No - FILE NOT FOUND!'}\n`);
      
      if (exists) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          console.log(`Service Account Details:`);
          console.log(`  Email: ${content.client_email || 'N/A'}`);
          console.log(`  Project ID: ${content.project_id || 'N/A'}`);
          console.log(`  Type: ${content.type || 'N/A'}\n`);
        } catch (error) {
          console.log(`❌ Error reading JSON file: ${error.message}\n`);
        }
      }
    }
  }
} else {
  console.log('⚠️  Google Vision API is NOT configured');
  console.log('   OCR will use MOCK data\n');
  
  console.log('To enable Google Vision OCR:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Follow instructions in GOOGLE_VISION_SETUP.md');
  console.log('3. Add your credentials to .env.local');
  console.log('4. Restart your dev server\n');
}

console.log('📖 For detailed setup instructions, see:');
console.log('   GOOGLE_VISION_SETUP.md\n');
