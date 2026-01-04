/**
 * Meta Marketing API Integration
 * 
 * This service handles fetching ad spend and conversion data from Meta's Marketing API
 * using the business's Meta Pixel ID and access token.
 * 
 * Documentation: https://developers.facebook.com/docs/marketing-api
 */

export interface MetaAdAccountData {
  id: string
  name: string
  account_status: number
  currency: string
}

export interface MetaAdInsights {
  spend: string
  impressions: string
  clicks: string
  reach: string
  actions?: Array<{
    action_type: string
    value: string
  }>
  cost_per_action_type?: Array<{
    action_type: string
    value: string
  }>
  date_start: string
  date_stop: string
}

export interface MetaPixelStats {
  pixel_id: string
  ad_spend: number
  impressions: number
  clicks: number
  reach: number
  complete_registration_count: number
  purchase_count: number
  cost_per_registration: number
  cost_per_purchase: number
  roas: number // Return on Ad Spend
  date_range: {
    start: string
    end: string
  }
}

/**
 * Fetch ad account information using access token
 */
export async function getAdAccount(
  accessToken: string,
  adAccountId: string
): Promise<MetaAdAccountData | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}?fields=id,name,account_status,currency&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[Meta API] Error fetching ad account:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[Meta API] Failed to fetch ad account:', error)
    return null
  }
}

/**
 * Fetch ad insights for a specific date range
 */
export async function getAdInsights(
  accessToken: string,
  adAccountId: string,
  dateRange: { start: string; end: string } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  }
): Promise<MetaAdInsights | null> {
  try {
    const params = new URLSearchParams({
      fields: 'spend,impressions,clicks,reach,actions,cost_per_action_type',
      time_range: JSON.stringify({
        since: dateRange.start,
        until: dateRange.end,
      }),
      level: 'account',
      access_token: accessToken,
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/insights?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[Meta API] Error fetching ad insights:', error)
      return null
    }

    const data = await response.json()
    
    // Return first insight data (account level)
    if (data.data && data.data.length > 0) {
      return {
        ...data.data[0],
        date_start: dateRange.start,
        date_stop: dateRange.end,
      }
    }

    return null
  } catch (error) {
    console.error('[Meta API] Failed to fetch ad insights:', error)
    return null
  }
}

/**
 * Get comprehensive pixel statistics combining ad data and conversion events
 */
export async function getPixelStats(
  accessToken: string,
  adAccountId: string,
  dateRange?: { start: string; end: string }
): Promise<MetaPixelStats | null> {
  try {
    const insights = await getAdInsights(accessToken, adAccountId, dateRange)
    
    if (!insights) {
      return null
    }

    // Extract conversion counts from actions
    let completeRegistrationCount = 0
    let purchaseCount = 0
    let costPerRegistration = 0
    let costPerPurchase = 0

    if (insights.actions) {
      const registrationAction = insights.actions.find(
        (a) => a.action_type === 'offsite_conversion.fb_pixel_complete_registration'
      )
      const purchaseAction = insights.actions.find(
        (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )

      completeRegistrationCount = registrationAction ? parseInt(registrationAction.value) : 0
      purchaseCount = purchaseAction ? parseInt(purchaseAction.value) : 0
    }

    if (insights.cost_per_action_type) {
      const costPerReg = insights.cost_per_action_type.find(
        (c) => c.action_type === 'offsite_conversion.fb_pixel_complete_registration'
      )
      const costPerPur = insights.cost_per_action_type.find(
        (c) => c.action_type === 'offsite_conversion.fb_pixel_purchase'
      )

      costPerRegistration = costPerReg ? parseFloat(costPerReg.value) : 0
      costPerPurchase = costPerPur ? parseFloat(costPerPur.value) : 0
    }

    const spend = parseFloat(insights.spend) || 0
    const roas = purchaseCount > 0 && spend > 0 ? (purchaseCount * 100) / spend : 0 // Simplified ROAS

    return {
      pixel_id: adAccountId,
      ad_spend: spend,
      impressions: parseInt(insights.impressions as any) || 0,
      clicks: parseInt(insights.clicks as any) || 0,
      reach: parseInt(insights.reach as any) || 0,
      complete_registration_count: completeRegistrationCount,
      purchase_count: purchaseCount,
      cost_per_registration: costPerRegistration,
      cost_per_purchase: costPerPurchase,
      roas,
      date_range: {
        start: insights.date_start,
        end: insights.date_stop,
      },
    }
  } catch (error) {
    console.error('[Meta API] Failed to get pixel stats:', error)
    return null
  }
}

/**
 * Validate Meta access token
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`,
      {
        method: 'GET',
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Meta API] Token validation failed:', error)
    return false
  }
}

/**
 * Get long-lived access token from short-lived token
 * This should be done on the server-side only
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('[Meta API] Token exchange failed:', error)
    return null
  }
}
