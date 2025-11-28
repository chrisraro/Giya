/**
 * Referral tracking utilities for Meta Pixel integration
 * Handles referral cookie management and business attribution
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'

const REFERRAL_COOKIE_NAME = 'referral_business_id'
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Set referral cookie when user visits with ?ref= parameter
 */
export async function setReferralCookie(businessId: string): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set(REFERRAL_COOKIE_NAME, businessId, {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  
  console.log(`[Referral] Cookie set for business: ${businessId}`)
}

/**
 * Get referral cookie value
 */
export async function getReferralCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME)
  
  return referralCookie?.value
}

/**
 * Clear referral cookie (usually after successful attribution)
 */
export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(REFERRAL_COOKIE_NAME)
  
  console.log('[Referral] Cookie cleared')
}

/**
 * Get business Meta Pixel ID from referral cookie
 * Returns the Pixel ID if the referral business exists and has one configured
 */
export async function getReferralPixelId(): Promise<string | null> {
  try {
    const businessId = await getReferralCookie()
    
    if (!businessId) {
      console.log('[Referral] No referral cookie found')
      return null
    }
    
    const supabase = await createServerClient()
    
    const { data: business, error } = await supabase
      .from('businesses')
      .select('meta_pixel_id, business_name, approval_status, is_active')
      .eq('id', businessId)
      .single()
    
    if (error || !business) {
      console.warn('[Referral] Business not found:', businessId, error)
      return null
    }
    
    // Only return pixel ID if business is approved and active
    if (business.approval_status !== 'approved' || !business.is_active) {
      console.warn('[Referral] Business not active:', business.business_name)
      return null
    }
    
    console.log(`[Referral] Pixel ID found for ${business.business_name}: ${business.meta_pixel_id}`)
    return business.meta_pixel_id || null
    
  } catch (error) {
    console.error('[Referral] Error getting pixel ID:', error)
    return null
  }
}

/**
 * Validate business ID format (UUID v4)
 */
export function isValidBusinessId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Get Meta Pixel ID for a specific business (public access)
 * Used for landing pages before user authentication
 */
export async function getBusinessPixelId(businessId: string): Promise<string | null> {
  if (!isValidBusinessId(businessId)) {
    console.warn('[Referral] Invalid business ID format:', businessId)
    return null
  }
  
  try {
    const supabase = await createServerClient()
    
    // This query uses the public RLS policy that allows reading meta_pixel_id
    const { data: business, error } = await supabase
      .from('businesses')
      .select('meta_pixel_id, business_name')
      .eq('id', businessId)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .single()
    
    if (error || !business) {
      console.warn('[Referral] Business not found or not active:', businessId)
      return null
    }
    
    console.log(`[Referral] Pixel ID retrieved for ${business.business_name}`)
    return business.meta_pixel_id || null
    
  } catch (error) {
    console.error('[Referral] Error getting business pixel:', error)
    return null
  }
}
