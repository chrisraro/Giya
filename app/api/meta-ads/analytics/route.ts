import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPixelStats } from '@/lib/meta-marketing-api'

/**
 * API Route: Fetch Meta Ads Analytics
 * 
 * This endpoint fetches real-time ad spend and conversion data from Meta's Marketing API
 * using the business's stored access token and ad account ID.
 * 
 * GET /api/meta-ads/analytics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get business data including Meta credentials
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, business_name, meta_pixel_id, meta_access_token, meta_ad_account_id')
      .eq('id', user.id)
      .single()

    if (businessError || !business) {
      console.error('[Meta Ads API] Business not found:', businessError)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if Meta integration is configured
    if (!business.meta_access_token || !business.meta_ad_account_id) {
      return NextResponse.json(
        {
          error: 'Meta integration not configured',
          details: 'Please connect your Meta Business account in Settings to view ad analytics.',
          configured: false,
        },
        { status: 400 }
      )
    }

    console.log(`[Meta Ads API] Fetching analytics for business: ${business.business_name}`)
    console.log(`[Meta Ads API] Ad Account ID: ${business.meta_ad_account_id}`)

    // Parse date range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url)
    const daysBack = parseInt(searchParams.get('days') || '30')
    
    const endDate = new Date()
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    
    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }

    // Fetch data from Meta Marketing API
    const pixelStats = await getPixelStats(
      business.meta_access_token,
      business.meta_ad_account_id,
      dateRange
    )

    if (!pixelStats) {
      console.error('[Meta Ads API] Failed to fetch pixel stats from Meta')
      return NextResponse.json(
        {
          error: 'Failed to fetch data from Meta',
          details: 'Unable to retrieve ad data from Meta Marketing API. Please check your access token and ad account permissions.',
          configured: true,
        },
        { status: 500 }
      )
    }

    console.log('[Meta Ads API] ✅ Successfully fetched Meta ad data:', {
      spend: pixelStats.ad_spend,
      impressions: pixelStats.impressions,
      registrations: pixelStats.complete_registration_count,
      purchases: pixelStats.purchase_count,
    })

    // Return comprehensive analytics
    return NextResponse.json({
      success: true,
      data: {
        // Meta Ads Data
        metaAds: {
          spend: pixelStats.ad_spend,
          impressions: pixelStats.impressions,
          clicks: pixelStats.clicks,
          reach: pixelStats.reach,
          completeRegistrations: pixelStats.complete_registration_count,
          purchases: pixelStats.purchase_count,
          costPerRegistration: pixelStats.cost_per_registration,
          costPerPurchase: pixelStats.cost_per_purchase,
          roas: pixelStats.roas,
        },
        // Date range
        dateRange: pixelStats.date_range,
        // Business info
        business: {
          id: business.id,
          name: business.business_name,
          pixelId: business.meta_pixel_id,
        },
        // Sync timestamp
        syncedAt: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('[Meta Ads API] Error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/meta-ads/analytics
 * 
 * Store Meta access token and ad account ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accessToken, adAccountId } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: accessToken and adAccountId' },
        { status: 400 }
      )
    }

    console.log(`[Meta Ads API] Storing Meta credentials for user: ${user.id}`)

    // Update business with Meta credentials
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        meta_access_token: accessToken,
        meta_ad_account_id: adAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Meta Ads API] Error storing credentials:', updateError)
      return NextResponse.json(
        { error: 'Failed to store Meta credentials' },
        { status: 500 }
      )
    }

    console.log('[Meta Ads API] ✅ Meta credentials stored successfully')

    return NextResponse.json({
      success: true,
      message: 'Meta Business account connected successfully',
    })

  } catch (error) {
    console.error('[Meta Ads API] Error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
