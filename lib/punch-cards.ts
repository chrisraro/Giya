// lib/punch-cards.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PunchCard {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  punches_required: number;
  reward_description: string;
  image_url?: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PunchCardCustomer {
  id: string;
  punch_card_id: string;
  customer_id: string;
  punches_count: number;
  created_at: string;
  last_punch_at?: string;
  completed_at?: string;
  is_completed: boolean;
}

export interface PunchCardPunch {
  id: string;
  punch_card_customer_id: string;
  business_id: string;
  customer_id: string;
  punch_at: string;
  transaction_id?: string;
  validated_by?: string;
}

/**
 * Create a new punch card for a business
 */
export async function createPunchCard(punchCardData: Omit<PunchCard, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('punch_cards')
    .insert([punchCardData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating punch card: ${error.message}`);
  }

  return data;
}

/**
 * Get all punch cards for a business
 */
export async function getPunchCardsForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('punch_cards')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching punch cards: ${error.message}`);
  }

  return data;
}

/**
 * Get a specific punch card by ID
 */
export async function getPunchCardById(id: string) {
  const { data, error } = await supabase
    .from('punch_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching punch card: ${error.message}`);
  }

  return data;
}

/**
 * Update a punch card
 */
export async function updatePunchCard(id: string, updateData: Partial<PunchCard>) {
  const { data, error } = await supabase
    .from('punch_cards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating punch card: ${error.message}`);
  }

  return data;
}

/**
 * Delete a punch card
 */
export async function deletePunchCard(id: string) {
  const { error } = await supabase
    .from('punch_cards')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting punch card: ${error.message}`);
  }
}

/**
 * Join a punch card (create customer participation)
 */
export async function joinPunchCard(punchCardId: string, customerId: string) {
  const { data, error } = await supabase
    .from('punch_card_customers')
    .insert([{
      punch_card_id: punchCardId,
      customer_id: customerId,
      punches_count: 0,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error joining punch card: ${error.message}`);
  }

  return data;
}

/**
 * Get customer's participation in punch cards
 */
export async function getPunchCardParticipationForCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('punch_card_customers')
    .select(`
      id,
      punches_count,
      is_completed,
      created_at,
      last_punch_at,
      completed_at,
      punch_cards!inner (
        id,
        title,
        description,
        punches_required,
        reward_description,
        image_url,
        is_active,
        valid_from,
        valid_until,
        businesses!inner (
          business_name
        )
      )
    `)
    .eq('customer_id', customerId);

  if (error) {
    throw new Error(`Error fetching punch card participation: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    punches_count: item.punches_count,
    is_completed: item.is_completed,
    created_at: item.created_at,
    last_punch_at: item.last_punch_at,
    completed_at: item.completed_at,
    punch_card: {
      id: item.punch_cards.id,
      title: item.punch_cards.title,
      description: item.punch_cards.description,
      punches_required: item.punch_cards.punches_required,
      reward_description: item.punch_cards.reward_description,
      image_url: item.punch_cards.image_url,
      is_active: item.punch_cards.is_active,
      valid_from: item.punch_cards.valid_from,
      valid_until: item.punch_cards.valid_until,
      business_name: item.punch_cards.businesses?.business_name || 'Unknown Business'
    }
  }));
}

/**
 * Get all punches for a customer
 */
export async function getPunchesForCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('punch_card_punches')
    .select('*')
    .eq('customer_id', customerId)
    .order('punch_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching punches: ${error.message}`);
  }

  return data;
}

/**
 * Add a punch to a customer's punch card (legacy function - use addPunchToCustomerCard from punch-card-utils instead)
 */
export async function addPunch(punchData: {
  punch_card_customer_id: string;
  business_id: string;
  customer_id: string;
  transaction_id?: string;
  validated_by?: string;
}) {
  // This function is maintained for backward compatibility, but the preferred method
  // is to use addPunchToCustomerCard which handles all the logic properly

  // For now, we'll call the utility function to ensure consistency
  const punchCardCustomer = await getPunchCardCustomerById(punchData.punch_card_customer_id);
  if (!punchCardCustomer) {
    throw new Error('Punch card customer not found');
  }

  // Use the updated utility function
  const result = await import('./punch-card-utils').then(utils =>
    utils.addPunchToCustomerCard(
      punchCardCustomer.punch_card_id,
      punchData.business_id,
      punchData.customer_id,
      punchData.transaction_id
    )
  );

  if (!result.success) {
    throw new Error(result.message);
  }

  return {
    ...result.data!,
    message: result.message
  };
}

/**
 * Helper function to get punch card customer by ID
 */
async function getPunchCardCustomerById(id: string) {
  const { data, error } = await supabase
    .from('punch_card_customers')
    .select('punch_card_id')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data;
}