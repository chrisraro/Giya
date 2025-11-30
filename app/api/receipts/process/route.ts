import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { processReceiptOCRWithGoogleVision } from '@/lib/ocr-service'

// Helper function to validate business name match
function validateBusinessName(expectedName: string, detectedName: string): boolean {
  if (!detectedName || detectedName.trim() === '') {
    console.warn('[Validation] ⚠️ No merchant name detected in receipt');
    return false; // If no merchant name detected, fail validation
  }

  console.log(`[Validation] Comparing: Expected="${expectedName}" vs Detected="${detectedName}"`);

  // Normalize both names for comparison
  const normalize = (str: string) => str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars but keep spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();

  const normalizedExpected = normalize(expectedName);
  const normalizedDetected = normalize(detectedName);

  console.log(`[Validation] Normalized: "${normalizedExpected}" vs "${normalizedDetected}"`);

  // === EXACT MATCH ===
  if (normalizedExpected === normalizedDetected) {
    console.log('[Validation] ✅ Exact match!');
    return true;
  }

  // === CONTAINS MATCH ===
  // Remove spaces for word-boundary-free comparison
  const compactExpected = normalizedExpected.replace(/\s/g, '');
  const compactDetected = normalizedDetected.replace(/\s/g, '');
  
  if (compactDetected.includes(compactExpected)) {
    console.log('[Validation] ✅ Detected contains expected (compact)');
    return true;
  }

  if (compactExpected.includes(compactDetected) && compactDetected.length >= 4) {
    console.log('[Validation] ✅ Expected contains detected (compact, min 4 chars)');
    return true;
  }

  // === WORD-LEVEL MATCHING (ENHANCED) ===
  // Extract significant words (3+ chars) from both names
  const extractWords = (str: string) => 
    str.split(/\s+/).filter(word => word.length >= 3);
  
  const expectedWords = extractWords(normalizedExpected);
  const detectedWords = extractWords(normalizedDetected);
  
  console.log(`[Validation] Expected words: [${expectedWords.join(', ')}]`);
  console.log(`[Validation] Detected words: [${detectedWords.join(', ')}]`);
  
  // Check if any significant words match
  let matchedWords = 0;
  const matchDetails: string[] = [];
  
  for (const expWord of expectedWords) {
    for (const detWord of detectedWords) {
      // Exact word match
      if (expWord === detWord) {
        matchedWords++;
        matchDetails.push(`"${expWord}" = "${detWord}"`);
        break;
      }
      // Partial word match (one contains the other)
      if (detWord.includes(expWord) || expWord.includes(detWord)) {
        matchedWords += 0.7; // Partial credit
        matchDetails.push(`"${expWord}" ≈ "${detWord}"`);
        break;
      }
    }
  }
  
  const wordMatchRatio = matchedWords / Math.max(expectedWords.length, 1);
  console.log(`[Validation] Word matches: ${matchedWords.toFixed(1)}/${expectedWords.length} (${(wordMatchRatio * 100).toFixed(0)}%)`);
  if (matchDetails.length > 0) {
    console.log(`[Validation] Match details: ${matchDetails.join(', ')}`);
  }
  
  // LOWERED THRESHOLD: 40% word match is acceptable (more lenient)
  if (wordMatchRatio >= 0.40) {
    console.log('[Validation] ✅ Word-level match!');
    return true;
  }

  // === BRAND NAME MATCHING ===
  // Extract potential brand names (first significant word or common brands)
  const commonBrands = ['petron', 'shell', 'caltex', 'jollibee', 'mcdonalds', 'kfc', '7eleven', 'alfamart', 'ministop'];
  
  for (const brand of commonBrands) {
    if (normalizedExpected.includes(brand) && normalizedDetected.includes(brand)) {
      console.log(`[Validation] ✅ Common brand match: "${brand}"`);
      return true;
    }
  }

  // === SIMILARITY SCORE (LEVENSHTEIN) ===
  // Use compact versions for better matching
  const similarity = calculateSimilarity(compactExpected, compactDetected);
  console.log(`[Validation] Similarity score: ${(similarity * 100).toFixed(2)}%`);
  
  // LOWERED THRESHOLD: 50% similarity is acceptable
  if (similarity >= 0.50) {
    console.log('[Validation] ✅ Similarity match!');
    return true;
  }

  console.warn('[Validation] ❌ No match found');
  return false;
}

// Simple Levenshtein distance for similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function POST(request: NextRequest) {
  console.log('[OCR API] Receipt processing request received');
  
  let receiptId: string | undefined;
  
  try {
    const body = await request.json();
    receiptId = body.receiptId;

    if (!receiptId) {
      console.error('[OCR API] No receipt ID provided');
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 }
      )
    }

    console.log(`[OCR API] Processing receipt: ${receiptId}`);
    const supabase = await createServerClient()

    // Get the receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('id, image_url, business_id, customer_id, status')
      .eq('id', receiptId)
      .single()

    if (receiptError || !receipt) {
      console.error('[OCR API] Receipt not found:', receiptError);
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    console.log(`[OCR API] Receipt found. Status: ${receipt.status}`);

    // Check if already processed
    if (receipt.status === 'processed') {
      console.warn('[OCR API] Receipt already processed');
      return NextResponse.json(
        { error: 'Receipt already processed' },
        { status: 400 }
      )
    }

    // Update status to processing
    console.log('[OCR API] Updating status to processing');
    await supabase
      .from('receipts')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId)

    // Process with OCR (uses Google Vision if configured, otherwise mock)
    console.log('[OCR API] Starting OCR processing...');
    const ocrData = await processReceiptOCRWithGoogleVision(receipt.image_url)
    console.log('[OCR API] OCR completed. Total amount:', ocrData.totalAmount);

    // Get business configuration for points calculation AND business name for validation
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('points_per_currency, business_name, business_category')
      .eq('id', receipt.business_id)
      .single()

    if (businessError || !business) {
      console.error('[OCR API] Business not found:', businessError);
      throw new Error('Business not found')
    }

    console.log(`[OCR API] Business found: ${business.business_name}, Points per currency: ${business.points_per_currency}`);

    // Validate receipt is from the correct business
    const businessNameMatch = validateBusinessName(
      business.business_name,
      ocrData.merchant || ''
    );

    console.log(`[OCR API] Business name validation: ${businessNameMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`[OCR API] Expected: "${business.business_name}", Got from OCR: "${ocrData.merchant}"`);

    if (!businessNameMatch) {
      console.warn('[OCR API] Business name mismatch!');
      // Mark as failed and provide specific error
      await supabase
        .from('receipts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId);

      return NextResponse.json(
        { 
          error: 'Business name mismatch',
          details: `Receipt appears to be from "${ocrData.merchant}" but you scanned QR code for "${business.business_name}". Please make sure the receipt is from the correct business.`,
          expectedBusiness: business.business_name,
          detectedBusiness: ocrData.merchant
        },
        { status: 400 }
      );
    }

    // Validate total amount is reasonable
    if (!ocrData.totalAmount || ocrData.totalAmount <= 0) {
      console.error('[OCR API] Invalid total amount:', ocrData.totalAmount);
      await supabase
        .from('receipts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId);

      return NextResponse.json(
        { 
          error: 'Invalid receipt amount',
          details: 'Could not detect a valid total amount on the receipt. Please ensure the receipt is clear and legible.',
        },
        { status: 400 }
      );
    }

    console.log(`[OCR API] Amount validation: ✅ PASS (₱${ocrData.totalAmount})`);

    // Calculate points earned
    const pointsEarned = Math.floor(ocrData.totalAmount / (business.points_per_currency || 100))
    console.log(`[OCR API] Points calculated: ${pointsEarned} points (₱${ocrData.totalAmount} / ${business.points_per_currency})`);

    if (pointsEarned <= 0) {
      console.warn('[OCR API] No points earned - amount too small');
    }

    // Update receipt with OCR results
    console.log('[OCR API] Updating receipt with results...');
    await supabase
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
      .eq('id', receiptId)

    // Create points transaction using SERVICE ROLE (bypasses RLS)
    console.log('[OCR API] Creating points transaction...');
    const supabaseAdmin = createServiceRoleClient();
    
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('points_transactions')
      .insert({
        customer_id: receipt.customer_id,
        business_id: receipt.business_id,
        amount_spent: ocrData.totalAmount,
        points_earned: pointsEarned,
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[OCR API] Error creating points transaction:', transactionError);
      throw new Error(`Failed to create points transaction: ${transactionError.message}`);
    }

    console.log('[OCR API] ✅ Points transaction created:', transaction.id);

    // Update customer's total points using SERVICE ROLE (bypasses RLS)
    console.log('[OCR API] Updating customer total points...');
    const { data: currentCustomer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('total_points')
      .eq('id', receipt.customer_id)
      .single();

    if (fetchError) {
      console.error('[OCR API] Error fetching customer:', fetchError);
      throw new Error(`Failed to fetch customer: ${fetchError.message}`);
    }

    const newTotalPoints = (currentCustomer?.total_points || 0) + pointsEarned;
    console.log(`[OCR API] Current points: ${currentCustomer?.total_points}, Adding: ${pointsEarned}, New total: ${newTotalPoints}`);

    const { error: updatePointsError } = await supabaseAdmin
      .from('customers')
      .update({ 
        total_points: newTotalPoints
      })
      .eq('id', receipt.customer_id);

    if (updatePointsError) {
      console.error('[OCR API] Error updating customer points:', updatePointsError);
      throw new Error(`Failed to update customer points: ${updatePointsError.message}`);
    }

    console.log('[OCR API] ✅ Customer points updated successfully');

    // Verify the update
    const { data: verifyCustomer } = await supabaseAdmin
      .from('customers')
      .select('total_points')
      .eq('id', receipt.customer_id)
      .single();

    console.log(`[OCR API] 🔍 Verified customer total points: ${verifyCustomer?.total_points}`);

    // ================================================================
    // META PIXEL PURCHASE TRACKING (First Transaction at THIS Business)
    // ================================================================
    // Check if this is the customer's FIRST transaction at THIS BUSINESS
    // AND if they were referred by a business (tracks existing users too)
    try {
      console.log('[OCR API] 🎯 Checking for Meta Pixel Purchase tracking...');
      
      // Count transactions for this customer at THIS SPECIFIC BUSINESS
      const { count: businessTransactionCount } = await supabaseAdmin
        .from('points_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', receipt.customer_id)
        .eq('business_id', receipt.business_id);
      
      const isFirstBusinessTransaction = businessTransactionCount === 1; // We just created one
      console.log(`[OCR API] Transactions at this business: ${businessTransactionCount}, Is first: ${isFirstBusinessTransaction}`);
      
      if (isFirstBusinessTransaction) {
        // Check if customer was referred by a business (could be THIS business or another)
        const { data: customerProfile } = await supabaseAdmin
          .from('profiles')
          .select('referred_by')
          .eq('id', receipt.customer_id)
          .single();
        
        if (customerProfile?.referred_by) {
          console.log(`[OCR API] Customer was referred by business: ${customerProfile.referred_by}`);
          
          // Get the referring business's Meta Pixel ID
          const { data: referringBusiness } = await supabaseAdmin
            .from('businesses')
            .select('meta_pixel_id, business_name')
            .eq('id', customerProfile.referred_by)
            .single();
          
          if (referringBusiness?.meta_pixel_id) {
            console.log(`[OCR API] ✅ Referring business has Meta Pixel ID: ${referringBusiness.meta_pixel_id}`);
            
            // Return pixel tracking data to client for browser-side tracking
            return NextResponse.json({
              success: true,
              receiptId,
              ocrData,
              pointsEarned,
              message: `Receipt processed successfully! You earned ${pointsEarned} points.`,
              // Meta Pixel tracking data
              metaPixelTracking: {
                pixelId: referringBusiness.meta_pixel_id,
                eventType: 'Purchase',
                eventData: {
                  value: ocrData.totalAmount,
                  currency: ocrData.currency || 'PHP',
                  content_type: 'receipt_transaction',
                  content_name: `First Transaction - ${business.business_name}`,
                },
                isFirstTransaction: true,
                referringBusiness: referringBusiness.business_name
              }
            });
          } else {
            console.log('[OCR API] Referring business does not have Meta Pixel ID configured');
          }
        } else {
          console.log('[OCR API] Customer was not referred by a business');
        }
      } else {
        console.log('[OCR API] Not a first transaction at this business, skipping pixel tracking');
      }
    } catch (pixelTrackingError) {
      console.error('[OCR API] ⚠️ Error checking Meta Pixel tracking:', pixelTrackingError);
      // Don't fail the whole process if pixel tracking check fails
    }
    // ================================================================

    // === DELETE RECEIPT IMAGE FROM STORAGE ===
    // After successful processing, delete the image to save storage space
    if (receipt.image_url) {
      try {
        console.log('[OCR API] 🗑️ Deleting receipt image from storage...');
        
        // Extract file path from image_url
        // Format: https://{project}.supabase.co/storage/v1/object/public/receipts/{path}
        const urlParts = receipt.image_url.split('/receipts/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          
          const { error: deleteError } = await supabaseAdmin.storage
            .from('receipts')
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('[OCR API] ⚠️ Failed to delete receipt image:', deleteError);
            // Don't fail the whole process if image deletion fails
          } else {
            console.log('[OCR API] ✅ Receipt image deleted successfully');
          }
        } else {
          console.warn('[OCR API] ⚠️ Could not parse image URL for deletion:', receipt.image_url);
        }
      } catch (deleteError) {
        console.warn('[OCR API] ⚠️ Error during image deletion:', deleteError);
        // Don't fail the whole process if image deletion fails
      }
    }

    console.log('[OCR API] ✅ Receipt processing complete!');
    return NextResponse.json({
      success: true,
      receiptId,
      ocrData,
      pointsEarned,
      message: `Receipt processed successfully! You earned ${pointsEarned} points.`,
      metaPixelTracking: null // No pixel tracking for non-first transactions
    })

  } catch (error) {
    console.error('[OCR API] ❌ Processing error:', error);
    console.error('[OCR API] Error type:', typeof error);
    console.error('[OCR API] Error details:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Update receipt status to failed if we have the receiptId
    if (receiptId) {
      try {
        const supabase = await createServerClient();
        await supabase
          .from('receipts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', receiptId);
        console.log(`[OCR API] Receipt ${receiptId} marked as failed`);
      } catch (updateError) {
        console.error('[OCR API] Failed to update receipt status:', updateError);
      }
    }

    // Extract meaningful error message
    let errorMessage = 'Unknown error occurred';
    let errorDetails = 'Please try again or contact support';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || errorMessage;
    } else if (typeof error === 'object' && error !== null) {
      const err = error as any;
      errorMessage = err.message || err.error || JSON.stringify(error);
      errorDetails = err.details || err.statusText || errorMessage;
    } else {
      errorMessage = String(error);
      errorDetails = errorMessage;
    }

    console.error('[OCR API] Returning error response:', { errorMessage, errorDetails });

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        receiptId: receiptId || null
      },
      { status: 500 }
    )
  }
}
