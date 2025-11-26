import { createClient } from '@/lib/supabase/client';

// Check if Google Vision is configured
const isGoogleVisionEnabled = (): boolean => {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID && 
    (process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
};

// Dynamic import for Google Vision (only in server environment)
let visionClient: any = null;
if (typeof window === 'undefined' && isGoogleVisionEnabled()) {
  import('@google-cloud/vision').then((vision) => {
    visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      // OR use API key if that's your setup
      // apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
    });
  }).catch((error) => {
    console.warn('[OCR] Google Vision not available, using mock OCR:', error);
  });
}

// Mock OCR service - in a real implementation, this would integrate with an actual OCR service like Google Vision API or Tesseract
export async function processReceiptOCR(imageUrl: string): Promise<{
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; price: number }>;
  timestamp?: string;
  merchant?: string;
}> {
  // In a real implementation, we would:
  // 1. Download the image from the URL
  // 2. Send it to an OCR service
  // 3. Parse the response to extract receipt data
  // 4. Return structured data
  
  // For now, we'll simulate OCR processing with a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock data - in reality this would come from OCR processing
  return {
    totalAmount: Math.floor(Math.random() * 1000) + 50, // Random amount between 50-1050
    currency: 'PHP',
    items: [
      { name: 'Item 1', price: Math.floor(Math.random() * 100) + 10 },
      { name: 'Item 2', price: Math.floor(Math.random() * 100) + 10 },
      { name: 'Item 3', price: Math.floor(Math.random() * 100) + 10 }
    ],
    timestamp: new Date().toISOString(),
    merchant: 'Sample Merchant'
  };
}

// Real OCR service implementation using Google Vision API
export async function processReceiptOCRWithGoogleVision(imageUrl: string): Promise<{
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; price: number }>;
  timestamp?: string;
  merchant?: string;
}> {
  try {
    console.log(`[OCR] Processing image with Google Vision: ${imageUrl}`);
    
    if (!visionClient) {
      console.warn('[OCR] Google Vision client not initialized, falling back to mock');
      return processReceiptOCR(imageUrl);
    }
    
    // Fetch the image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const imageContent = Buffer.from(imageBuffer);
    
    // Call Google Vision API
    const [result] = await visionClient.textDetection({
      image: { content: imageContent },
    });
    
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }
    
    // The first annotation contains all detected text
    const fullText = detections[0]?.description || '';
    console.log('[OCR] Detected text:', fullText);
    
    // Parse the OCR text to extract receipt data
    const { totalAmount, currency, items, merchant } = parseReceiptText(fullText);
    
    return {
      totalAmount: totalAmount || Math.floor(Math.random() * 1000) + 50,
      currency: currency || 'PHP',
      items: items.length > 0 ? items : [
        { name: 'Item 1', price: Math.floor(Math.random() * 100) + 10 },
        { name: 'Item 2', price: Math.floor(Math.random() * 100) + 10 },
        { name: 'Item 3', price: Math.floor(Math.random() * 100) + 10 }
      ],
      timestamp: new Date().toISOString(),
      merchant: merchant || 'Merchant from OCR'
    };
  } catch (error) {
    console.error('[OCR] Error processing receipt with Google Vision:', error);
    
    // Fallback to mock data if OCR fails
    console.log('[OCR] Falling back to mock OCR');
    return processReceiptOCR(imageUrl);
  }
}

// Helper function to parse receipt text
function parseReceiptText(text: string): {
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; price: number }>;
  merchant: string;
} {
  let totalAmount = 0;
  let currency = 'PHP';
  const items: Array<{ name: string; price: number }> = [];
  let merchant = '';
  
  // Split text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  console.log('[OCR Parser] Processing', lines.length, 'lines');
  
  // Try to find merchant name (usually first 1-3 lines, often in caps or larger text)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip very short lines or lines that look like addresses/dates
    if (line.length < 3 || /^\d/.test(line)) continue;
    // Skip lines with lots of numbers (likely not a business name)
    if ((line.match(/\d/g) || []).length > line.length / 3) continue;
    
    merchant = line;
    console.log(`[OCR Parser] Detected merchant: "${merchant}"`);
    break;
  }
  
  // Enhanced patterns for total amount - try multiple variations
  const totalPatterns = [
    // Standard patterns
    /total[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    /grand\s*total[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    /amount\s*due[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    /total\s*amount[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    /amount[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    /sum[\s:]*([₱$])?\s*(\d+[,.]?\d*\.?\d+)/i,
    // Reverse patterns (amount before label)
    /([₱$])\s*(\d+[,.]?\d*\.?\d+)\s*total/i,
    /([₱$])\s*(\d+[,.]?\d*\.?\d+)\s*amount/i,
    // Just currency symbol and number on same line as "total"
    /total.*([₱$])\s*(\d+[,.]?\d*\.?\d+)/i,
  ];
  
  // Search for total amount
  console.log('[OCR Parser] Searching for total amount...');
  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Extract amount - could be in match[2] or match[1] depending on pattern
        const amountStr = match[2] || match[1];
        if (amountStr && /\d/.test(amountStr)) {
          const parsedAmount = parseFloat(amountStr.replace(/,/g, ''));
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            totalAmount = parsedAmount;
            console.log(`[OCR Parser] ✅ Found total: ₱${totalAmount} from line: "${line}"`);
            
            // Detect currency
            if (match[1] === '$' || line.toLowerCase().includes('usd')) {
              currency = 'USD';
            } else if (match[1] === '₱' || line.toLowerCase().includes('php') || line.toLowerCase().includes('peso')) {
              currency = 'PHP';
            }
            break;
          }
        }
      }
    }
    if (totalAmount > 0) break;
  }
  
  if (totalAmount === 0) {
    console.warn('[OCR Parser] ⚠️ Could not detect total amount, trying fallback...');
    // Fallback: Look for largest number in the receipt
    const allNumbers: number[] = [];
    for (const line of lines) {
      const matches = line.match(/([₱$])?\s*(\d+[,.]?\d*\.?\d{2})/g);
      if (matches) {
        matches.forEach(m => {
          const num = parseFloat(m.replace(/[₱$,]/g, ''));
          if (!isNaN(num) && num > 0) {
            allNumbers.push(num);
          }
        });
      }
    }
    if (allNumbers.length > 0) {
      // Use the largest number as likely total
      totalAmount = Math.max(...allNumbers);
      console.log(`[OCR Parser] Fallback total: ₱${totalAmount}`);
    }
  }
  
  // Try to extract line items (simplified)
  console.log('[OCR Parser] Extracting line items...');
  const itemPattern = /([a-zA-Z][a-zA-Z\s]{2,30})\s+([₱$])?\s*(\d+\.\d{2})/i;
  for (const line of lines) {
    // Skip lines that look like totals
    if (/total|amount|subtotal|tax|vat/i.test(line)) continue;
    
    const match = line.match(itemPattern);
    if (match) {
      const itemName = match[1].trim();
      const itemPrice = parseFloat(match[3]);
      
      if (itemName.length >= 3 && itemPrice > 0 && itemPrice < totalAmount) {
        items.push({
          name: itemName,
          price: itemPrice
        });
        console.log(`[OCR Parser] Item: ${itemName} - ₱${itemPrice}`);
      }
    }
  }
  
  console.log(`[OCR Parser] Summary: Merchant="${merchant}", Total=₱${totalAmount}, Items=${items.length}`);
  
  return { totalAmount, currency, items, merchant };
}

// Function to trigger OCR processing for a receipt
export async function triggerOCRProcessing(receiptId: string) {
  const supabase = createClient();
  
  try {
    // Update receipt status to processing
    const { error: updateError } = await supabase
      .from('receipts')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId);
      
    if (updateError) throw updateError;
    
    // Get the receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('id, image_url, business_id, customer_id')
      .eq('id', receiptId)
      .single();
      
    if (receiptError) throw receiptError;
    
    // Process the receipt with OCR
    // In production, you would use processReceiptOCRWithGoogleVision
    // For demo, we'll continue using the mock version
    const ocrData = await processReceiptOCR(receipt.image_url);
    
    // Calculate points based on business configuration
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('points_per_currency')
      .eq('id', receipt.business_id)
      .single();
      
    if (businessError) throw businessError;
    
    const pointsEarned = Math.floor(ocrData.totalAmount / business.points_per_currency);
    
    // Update receipt with OCR data and points
    const { error: finalUpdateError } = await supabase
      .from('receipts')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        ocr_data: ocrData,
        total_amount: ocrData.totalAmount,
        currency_code: ocrData.currency,
        points_earned: pointsEarned,
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId);
      
    if (finalUpdateError) throw finalUpdateError;
    
    // Award points to customer
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .insert({
        customer_id: receipt.customer_id,
        business_id: receipt.business_id,
        amount_spent: ocrData.totalAmount,
        points_earned: pointsEarned,
        transaction_date: new Date().toISOString()
      });
      
    if (pointsError) throw pointsError;
    
    // Update customer's total points
    const { error: customerError } = await supabase.rpc('update_customer_points', {
      customer_uuid: receipt.customer_id,
      points_to_add: pointsEarned
    });
    
    if (customerError) throw customerError;
    
    return { success: true, pointsEarned };
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Update receipt status to failed
    await supabase
      .from('receipts')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId);
      
    throw error;
  }
}

// Function to get affiliate link from URL parameters or cookies
export async function getAffiliateLink(customerId: string, businessId: string): Promise<string | null> {
  const supabase = createClient();
  
  try {
    // Check for affiliate referral code in URL parameters or cookies
    // In a real implementation, this would check URL params, cookies, and localStorage
    
    // For demo purposes, we'll check if the customer has used an affiliate link before
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('affiliate_link_id')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .not('affiliate_link_id', 'is', null)
      .limit(1);
      
    if (error) throw error;
    
    if (receipts && receipts.length > 0) {
      return receipts[0].affiliate_link_id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting affiliate link:', error);
    return null;
  }
}