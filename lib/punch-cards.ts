// lib/punch-cards.ts
// Functions for punch card operations that can be used in both client and server contexts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Note: This library should be used carefully in client components
// For operations requiring authentication, use API routes instead

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
  // Use the API route to ensure authentication context, include credentials for auth
  const response = await fetch('/api/punch-cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(punchCardData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error creating punch card');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all punch cards for a business
 */
export async function getPunchCardsForBusiness(businessId: string) {
  // This function is used in client components which have session context via the API route
  const response = await fetch(`/api/punch-cards?businessId=${businessId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error fetching punch cards');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get a specific punch card by ID
 */
export async function getPunchCardById(id: string) {
  const response = await fetch(`/api/punch-cards?punchCardId=${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error fetching punch card');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update a punch card
 */
export async function updatePunchCard(id: string, updateData: Partial<PunchCard>) {
  const response = await fetch('/api/punch-cards', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ id, ...updateData }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error updating punch card');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete a punch card
 */
export async function deletePunchCard(id: string) {
  const response = await fetch(`/api/punch-cards?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error deleting punch card');
  }

  const result = await response.json();
  return result;
}

/**
 * Join a punch card (create customer participation)
 */
export async function joinPunchCard(punchCardId: string) {
  const response = await fetch('/api/punch-cards/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ punch_card_id: punchCardId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error joining punch card');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get customer's participation in punch cards
 */
export async function getPunchCardParticipationForCustomer(customerId: string) {
  const response = await fetch(`/api/punch-cards?customerId=${customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error fetching punch card participation');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all punches for a customer
 */
export async function getPunchesForCustomer(customerId: string) {
  const response = await fetch(`/api/punch-cards/punches?customerId=${customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error fetching punches');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Add a punch to a customer's punch card (legacy function)
 */
export async function addPunch(punchData: {
  punch_card_customer_id: string;
  business_id: string;
  customer_id: string;
  transaction_id?: string;
  validated_by?: string;
}) {
  console.warn('addPunch function is legacy, use addPunchToCustomerCard from punch-card-utils instead');
  // For now, use the API route version
  const result = await import('./punch-card-utils').then(utils =>
    utils.addPunchToCustomerCard(
      // We need to get the punch card id from the customer id, which is complex
      // For now, return a placeholder
      'temp_id',
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
 * Helper function that's no longer needed since we're using API routes
 */
async function getPunchCardCustomerById(id: string) {
  // This is now handled through API routes
  console.warn('getPunchCardCustomerById is deprecated in API route approach');
  return null;
}