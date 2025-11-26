import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { processReceiptOCRWithGoogleVision } from '@/lib/ocr-service'

// Helper function to validate business name match
function validateBusinessName(expectedName: string, detectedName: string): boolean {
  if (!detectedName || detectedName.trim() === '') {
    console.warn('[Validation] No merchant name detected in receipt');
    return false; // If no merchant name detected, fail validation
  }

  // Normalize both names for comparison
  const normalize = (str: string) => str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .trim();

  const normalizedExpected = normalize(expectedName);
  const normalizedDetected = normalize(detectedName);

  // Check for exact match
  if (normalizedExpected === normalizedDetected) {
    return true;
  }

  // Check if detected name contains expected name
  if (normalizedDetected.includes(normalizedExpected)) {
    return true;
  }

  // Check if expected name contains detected name (partial match)
  if (normalizedExpected.includes(normalizedDetected) && normalizedDetected.length >= 4) {
    return true;
  }

  // Calculate similarity score (simple)
  const similarity = calculateSimilarity(normalizedExpected, normalizedDetected);
  console.log(`[Validation] Similarity score: ${(similarity * 100).toFixed(2)}%`);
  
  // If similarity is above 70%, consider it a match
  return similarity >= 0.7;
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
  
  try {
    const { receiptId } = await request.json()

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

    // Create points transaction
    console.log('[OCR API] Creating points transaction...');
    const { data: transaction, error: transactionError } = await supabase
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

    // Update customer's total points DIRECTLY (since RPC function might not exist)
    console.log('[OCR API] Updating customer total points...');
    const { data: currentCustomer, error: fetchError } = await supabase
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

    const { error: updatePointsError } = await supabase
      .from('customers')
      .update({ 
        total_points: newTotalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', receipt.customer_id);

    if (updatePointsError) {
      console.error('[OCR API] Error updating customer points:', updatePointsError);
      throw new Error(`Failed to update customer points: ${updatePointsError.message}`);
    }

    console.log('[OCR API] ✅ Customer points updated successfully');

    // Verify the update
    const { data: verifyCustomer } = await supabase
      .from('customers')
      .select('total_points')
      .eq('id', receipt.customer_id)
      .single();

    console.log(`[OCR API] 🔍 Verified customer total points: ${verifyCustomer?.total_points}`);

    console.log('[OCR API] ✅ Receipt processing complete!');
    return NextResponse.json({
      success: true,
      receiptId,
      ocrData,
      pointsEarned,
      message: `Receipt processed successfully! You earned ${pointsEarned} points.`
    })

  } catch (error) {
    console.error('[OCR API] Processing error:', error)

    // Update receipt status to failed if we have the receiptId
    const body = await request.json().catch(() => ({}))
    if (body.receiptId) {
      const supabase = await createServerClient()
      await supabase
        .from('receipts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.receiptId)
    }

    return NextResponse.json(
      { 
        error: 'Failed to process receipt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
