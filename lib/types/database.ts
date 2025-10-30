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

export interface MenuItem {
  id: string
  business_id: string
  name: string
  description: string | null
  category: string | null
  base_price: number | null
  image_url: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Reward {
  id: string
  created_at: string
  business_id: string
  reward_name: string | null
  description: string
  points_required: number
  redemption_limit: number | null
  redemption_count: number
  is_active: boolean
  image_url: string | null
  menu_item_id: string | null
  use_menu_item: boolean
  // For joined data
  menu_items?: MenuItem | null
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

export interface Deal {
  id: string
  business_id: string
  title: string
  description: string | null
  deal_type: 'discount' | 'exclusive'
  // Discount deal fields
  discount_percentage: number | null
  discount_value: number | null
  // Exclusive deal fields
  menu_item_id: string | null
  original_price: number | null
  exclusive_price: number | null
  // Common fields
  points_required: number
  image_url: string | null
  terms_and_conditions: string | null
  redemption_limit: number | null
  redemption_count: number
  is_active: boolean
  validity_start: string
  validity_end: string | null
  qr_code_data: string | null
  created_at: string
  updated_at: string
  // Scheduling fields
  schedule_type: 'always_available' | 'time_based' | 'day_based' | 'time_and_day'
  start_time: string | null // HH:MM format
  end_time: string | null // HH:MM format
  active_days: number[] | null // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // For joined data
  menu_items?: MenuItem | null
  businesses?: {
    business_name: string
    profile_pic_url: string | null
  } | null
}

export interface DealUsage {
  id: string
  deal_id: string
  customer_id: string
  business_id: string
  points_used: number
  used_at: string
  validated: boolean
  validated_at: string | null
  validated_by: string | null
  // For joined data
  deals?: Deal | null
  customers?: {
    full_name: string
    profile_pic_url: string | null
  } | null
  businesses?: {
    business_name: string
    profile_pic_url: string | null
  } | null
}

// Keep legacy types for backwards compatibility during migration
/** @deprecated Use Deal with deal_type='discount' instead */
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

/** @deprecated Use Deal with deal_type='exclusive' instead */
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