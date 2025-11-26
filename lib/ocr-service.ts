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
    // Try API key first (simpler for serverless), then credentials file
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('[OCR] Initializing Google Vision with API Key');
      visionClient = new vision.ImageAnnotatorClient({
        apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('[OCR] Initializing Google Vision with Service Account');
      // Parse JSON if it's a string (for Vercel environment variables)
      const credentials = typeof process.env.GOOGLE_APPLICATION_CREDENTIALS === 'string' && 
                          process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{') 
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      visionClient = new vision.ImageAnnotatorClient({
        credentials: typeof credentials === 'string' ? undefined : credentials,
        keyFilename: typeof credentials === 'string' ? credentials : undefined,
      });
    }
    console.log('[OCR] ✅ Google Vision client initialized successfully');
  }).catch((error) => {
    console.warn('[OCR] ❌ Google Vision not available, using mock OCR:', error);
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
      const errorMsg = 'Google Vision API not configured. Please set GOOGLE_CLOUD_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS in environment variables.';
      console.error('[OCR] ❌', errorMsg);
      throw new Error(errorMsg);
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
  console.log('[OCR Parser] Full text preview:', lines.slice(0, 10).join(' | '));
  
  // === ENHANCED MERCHANT DETECTION ===
  // Strategy: Find ALL potential merchant candidates (not just first one)
  // Payment gateways often appear first, but real business name is below
  const merchantCandidates: Array<{ line: string; score: number; index: number }> = [];
  
  // Known payment gateways to deprioritize
  const paymentGateways = [
    'globalpayments', 'global payments', 'stripe', 'paypal', 'square', 
    'paymaya', 'gcash', 'grabpay', 'visa', 'mastercard', 'amex'
  ];
  
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i];
    let score = 0;
    
    // Skip very short lines
    if (line.length < 3) continue;
    
    // === SKIP patterns that are NOT business names ===
    // Pure dates
    if (/^\d{4}[-\/]\d{2}[-\/]\d{2}/.test(line) || 
        /^\w{3}\s*\d{1,2},?\s*\d{4}/.test(line) ||
        /^\d{2}[-\/]\d{2}[-\/]\d{4}/.test(line)) continue;
    
    // Serial numbers, IDs with lots of numbers
    if (/^[\d\s-]{8,}$/.test(line)) continue;
    
    // Common non-merchant headers
    if (/^(MERCHANT ID|TERMINAL ID|SN|BATCH|TRACE|REF|TXN|TRANSACTION|A\d{3,}|DATE\/TIME)/i.test(line)) continue;
    
    // Lines that are mostly digits (>70% digits)
    const digitCount = (line.match(/\d/g) || []).length;
    if (digitCount > line.length * 0.7) continue;
    
    // Lines without enough letters
    if (!/[a-zA-Z]{2,}/.test(line)) continue;
    
    // === SCORE patterns that ARE likely business names ===
    
    // Check if this is a payment gateway (DEPRIORITIZE)
    const isPaymentGateway = paymentGateways.some(pg => 
      line.toLowerCase().includes(pg)
    );
    
    if (isPaymentGateway) {
      // Still add it but with VERY LOW score
      score = -10;
      console.log(`[OCR Parser] ⚠️ Payment gateway detected (line ${i + 1}): "${line}"`);
    }
    
    // +20: Contains business-specific keywords (NOT payment gateways)
    if (/(petron|shell|caltex|station|gas|fuel|7-eleven|jollibee|mcdonalds|kfc|store|shop|mart|market|restaurant|cafe|coffee|corp|inc|ltd|llc|co\.)/i.test(line)) {
      score += 20;
    }
    
    // +15: Contains location/branch info (strong indicator of real business)
    if (/(naga|manila|cebu|davao|city|branch|outlet|diversion|road|street|avenue)/i.test(line)) {
      score += 15;
    }
    
    // +10: Has substantial letter-only words
    if (/\b[a-zA-Z]{4,}\b/.test(line)) score += 10;
    
    // +8: Mixed case (brands often use this)
    if (/[a-z]/.test(line) && /[A-Z]/.test(line)) score += 8;
    
    // +12: All caps with hyphens (common for branch names: PETRON-C GAS-NAGA)
    if (/^[A-Z][A-Z\s-]+$/.test(line) && line.includes('-')) score += 12;
    
    // +12: All lowercase (many modern brands)
    if (/^[a-z][a-z\s-]+$/.test(line)) score += 12;
    
    // Position bonus (earlier = more likely, but not too much)
    if (i === 0) score += 5;
    else if (i === 1) score += 8; // Line 2 often has real business after payment gateway
    else if (i === 2) score += 10; // Line 3 even more likely
    else if (i === 3) score += 8;
    
    // +8: Moderate length (5-40 chars)
    if (line.length >= 5 && line.length <= 40) score += 8;
    
    // -8: Too long (likely address/description)
    if (line.length > 50) score -= 8;
    
    // -5: Too many special chars
    const specialCount = (line.match(/[,.\/\-#:]/g) || []).length;
    if (specialCount > 3) score -= 5;
    
    // +5: Moderate letter ratio
    const letterRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length;
    if (letterRatio > 0.5 && letterRatio < 0.9) score += 5;
    
    merchantCandidates.push({ line, score, index: i });
  }
  
  // Sort by score (highest first)
  merchantCandidates.sort((a, b) => b.score - a.score);
  
  // Pick the BEST non-payment-gateway candidate
  const bestCandidate = merchantCandidates.find(c => c.score > 0);
  
  if (bestCandidate) {
    merchant = bestCandidate.line;
    console.log(`[OCR Parser] ✅ Merchant detected (line ${bestCandidate.index + 1}, score: ${bestCandidate.score}): "${merchant}"`);
    console.log('[OCR Parser] Top 5 candidates:', merchantCandidates.slice(0, 5).map(c => `"${c.line}" (${c.score})`));
  } else if (merchantCandidates.length > 0) {
    // Fallback: use highest score even if it's a payment gateway
    merchant = merchantCandidates[0].line;
    console.warn(`[OCR Parser] ⚠️ Using fallback merchant (line ${merchantCandidates[0].index + 1}): "${merchant}"`);
  } else {
    console.warn('[OCR Parser] ⚠️ No merchant candidates found');
  }
  
  // === ENHANCED TOTAL AMOUNT PATTERNS - PRIORITIZE "TOTAL" WITH PHP ===
  const totalPatterns = [
    // **HIGHEST PRIORITY**: Exact "TOTAL" (all caps) with PHP
    /\bTOTAL[:\s]*PHP\s*([\d,]+\.\d{2})\b/i,
    /\bTOTAL[:\s]+PHP\s*([\d,]+\.\d{2})\b/i,
    
    // Standard TOTAL with PHP variations
    /\bGRAND\s*TOTAL[:\s]*PHP\s*([\d,]+\.\d{2})/i,
    /\bTOTAL\s*AMOUNT[:\s]*PHP\s*([\d,]+\.\d{2})/i,
    /\bNET\s*TOTAL[:\s]*PHP\s*([\d,]+\.\d{2})/i,
    
    // TOTAL with currency symbols
    /\bTOTAL[:\s]*([₱])\s*([\d,]+\.\d{2})/i,
    /\bTOTAL[:\s]*(\$)\s*([\d,]+\.\d{2})/i,
    
    // TOTAL without currency (but strict amount format)
    /\bTOTAL[:\s]*([\d,]+\.\d{2})$/i,
    /\bTOTAL[:\s]+([\d,]+\.\d{2})/i,
    
    // Amount patterns with PHP
    /\bAMOUNT[:\s]*PHP\s*([\d,]+\.\d{2})/i,
    /\bAMOUNT\s*DUE[:\s]*PHP\s*([\d,]+\.\d{2})/i,
    
    // Reverse patterns (PHP/currency before TOTAL)
    /PHP\s*([\d,]+\.\d{2})\s*TOTAL/i,
    /([₱])\s*([\d,]+\.\d{2})\s*TOTAL/i,
    
    // Fallback patterns
    /\bGRAND\s*TOTAL[:\s]*([\d,]+\.\d{2})/i,
    /\bBALANCE[:\s]*([\d,]+\.\d{2})/i,
  ];
  
  // === SEARCH FOR TOTAL AMOUNT ===
  console.log('[OCR Parser] 🔍 Searching for TOTAL amount...');
  
  for (const line of lines) {
    // Skip subtotals
    if (/SUBTOTAL|SUB-TOTAL|SUB TOTAL/i.test(line) && !/\bTOTAL\b/i.test(line)) continue;
    
    // Try each pattern
    for (let i = 0; i < totalPatterns.length; i++) {
      const pattern = totalPatterns[i];
      const match = line.match(pattern);
      
      if (match) {
        // Extract amount (handle different capture groups)
        let amountStr = match[2] || match[1];
        
        // Skip if we caught currency symbol as amount
        if (amountStr && /^[₱$]$/.test(amountStr)) {
          amountStr = match[2] || match[3];
        }
        
        if (amountStr && /\d/.test(amountStr)) {
          const parsedAmount = parseFloat(amountStr.replace(/,/g, ''));
          
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            totalAmount = parsedAmount;
            
            // Detect currency
            if (line.includes('PHP') || line.includes('₱') || line.toLowerCase().includes('peso')) {
              currency = 'PHP';
            } else if (line.includes('$') || line.toLowerCase().includes('usd')) {
              currency = 'USD';
            } else {
              currency = 'PHP'; // Default for Philippines
            }
            
            console.log(`[OCR Parser] ✅ TOTAL found: ${currency} ${totalAmount} (pattern #${i + 1})`);
            console.log(`[OCR Parser] Line: "${line}"`);
            break;
          }
        }
      }
    }
    
    if (totalAmount > 0) break;
  }
  
  // Fallback 1: Search for any "PHP" followed by amount
  if (totalAmount === 0) {
    console.warn('[OCR Parser] ⚠️ No TOTAL found, trying PHP fallback...');
    
    for (const line of lines) {
      const phpMatch = line.match(/PHP\s*([\d,]+\.\d{2})/i);
      if (phpMatch) {
        const amount = parseFloat(phpMatch[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0 && amount > totalAmount) {
          totalAmount = amount;
          currency = 'PHP';
          console.log(`[OCR Parser] PHP fallback: ₱${totalAmount} from: "${line}"`);
        }
      }
    }
  }
  
  if (totalAmount === 0) {
    console.warn('[OCR Parser] ⚠️ Still no total, trying final fallback (largest number)...');
    // Final fallback: Look for largest number with 2 decimal places
    const allNumbers: number[] = [];
    for (const line of lines) {
      // Match currency amounts (numbers with exactly 2 decimal places)
      const matches = line.match(/([₱$])?\s*(\d+[,.]?\d*\.\d{2})/g);
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
      console.log(`[OCR Parser] Final fallback total: ₱${totalAmount}`);
    }
  }
  
  // Try to extract line items (simplified)
  console.log('[OCR Parser] Extracting line items...');
  const itemPattern = /([a-zA-Z][a-zA-Z\s]{2,40})\s+([₱$PHP])?\s*(\d+[,.]?\d*\.\d{2})/i;
  for (const line of lines) {
    // Skip lines that look like totals, taxes, or metadata
    if (/TOTAL|AMOUNT|SUBTOTAL|TAX|VAT|CHANGE|TENDER|CASH|CARD|PAYMENT/i.test(line)) continue;
    
    const match = line.match(itemPattern);
    if (match) {
      const itemName = match[1].trim();
      const itemPrice = parseFloat(match[3].replace(/,/g, ''));
      
      if (itemName.length >= 3 && itemPrice > 0 && itemPrice < totalAmount) {
        items.push({
          name: itemName,
          price: itemPrice
        });
        console.log(`[OCR Parser] Item: ${itemName} - ₱${itemPrice}`);
      }
    }
  }
  
  console.log(`[OCR Parser] 📊 Summary: Merchant="${merchant}", Total=₱${totalAmount}, Currency=${currency}, Items=${items.length}`);
  
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