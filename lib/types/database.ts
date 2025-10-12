// Database types for the Giya application

export interface Customer {
  id: string
  created_at: string
  full_name: string
  email: string
  profile_pic_url: string | null
  total_points: number
  qr_code_data: string
  nickname: string | null
  date_of_birth: string | null
  phone_number: string | null
}

export interface Business {
  id: string
  created_at: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  points_per_currency: number
  description: string | null
  phone_number: string | null
  social_media_links: any | null
}

export interface Influencer {
  id: string
  created_at: string
  full_name: string
  email: string
  profile_pic_url: string | null
  total_points: number
  social_media_links: any | null
}

export interface PointsTransaction {
  id: string
  created_at: string
  customer_id: string
  business_id: string
  amount_spent: number
  points_earned: number
  transaction_date: string
}

export interface Reward {
  id: string
  created_at: string
  business_id: string
  reward_name: string
  description: string
  points_required: number
  redemption_limit: number | null
  redemption_count: number
  is_active: boolean
  image_url: string | null
}

export interface Redemption {
  id: string
  created_at: string
  customer_id: string
  reward_id: string
  business_id: string
  points_redeemed: number
  redemption_date: string
  status: 'pending' | 'validated' | 'completed' | 'cancelled'
  validated_at: string | null
  validated_by: string | null
  redemption_qr_code: string
}

export interface DiscountOffer {
  id: string
  created_at: string
  business_id: string
  offer_title: string
  description: string
  discount_percentage: number
  points_required: number
  redemption_limit: number | null
  redemption_count: number
  is_active: boolean
  validity_start: string
  validity_end: string
  terms_and_conditions: string | null
}

export interface ExclusiveOffer {
  id: string
  created_at: string
  business_id: string
  offer_title: string
  description: string
  points_required: number
  redemption_limit: number | null
  redemption_count: number
  is_active: boolean
  validity_start: string
  validity_end: string
  terms_and_conditions: string | null
}

export interface AffiliateLink {
  id: string
  created_at: string
  influencer_id: string
  business_id: string
  unique_code: string
}

export interface AffiliateConversion {
  id: string
  created_at: string
  affiliate_link_id: string
  customer_id: string
  converted_at: string
  points_earned: number
}

export interface BusinessPoints {
  business_id: string
  business_name: string
  profile_pic_url: string | null
  total_points: number
  available_rewards: number
}