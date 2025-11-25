import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { processReceiptOCRWithGoogleVision } from '@/lib/ocr-service'

export async function POST(request: NextRequest) {
  try {
    const { receiptId } = await request.json()

    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get the receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('id, image_url, business_id, customer_id, status')
      .eq('id', receiptId)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (receipt.status === 'processed') {
      return NextResponse.json(
        { error: 'Receipt already processed' },
        { status: 400 }
      )
    }

    // Update status to processing
    await supabase
      .from('receipts')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId)

    // Process with OCR (uses Google Vision if configured, otherwise mock)
    const ocrData = await processReceiptOCRWithGoogleVision(receipt.image_url)

    // Get business configuration for points calculation
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('points_per_currency')
      .eq('id', receipt.business_id)
      .single()

    if (businessError || !business) {
      throw new Error('Business not found')
    }

    // Calculate points earned
    const pointsEarned = Math.floor(ocrData.totalAmount / (business.points_per_currency || 100))

    // Update receipt with OCR results
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
    await supabase
      .from('points_transactions')
      .insert({
        customer_id: receipt.customer_id,
        business_id: receipt.business_id,
        amount_spent: ocrData.totalAmount,
        points_earned: pointsEarned,
        transaction_date: new Date().toISOString()
      })

    // Update customer's total points using RPC function
    const { error: pointsError } = await supabase.rpc('update_customer_points', {
      customer_uuid: receipt.customer_id,
      points_to_add: pointsEarned
    })

    if (pointsError) {
      console.error('[OCR API] Error updating customer points:', pointsError)
    }

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
