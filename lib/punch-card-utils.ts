// lib/punch-card-utils.ts
// Updated to use API routes for proper authentication and RLS policy compliance
import { PunchCard, PunchCardPunch } from './punch-cards';

/**
 * Add a punch to a customer's punch card
 */
export async function addPunchToCustomerCard(
  punchCardId: string,
  businessId: string,
  customerId: string,
  transactionId?: string
): Promise<{ success: boolean; message: string; data?: PunchCardPunch }> {
  try {
    // Make API call to add punch
    const response = await fetch('/api/punch-cards/punches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        punch_card_id: punchCardId,
        business_id: businessId,
        customer_id: customerId,
        transaction_id: transactionId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.error || 'Error adding punch to customer card' };
    }

    const result = await response.json();

    return {
      success: true,
      message: result.message,
      data: result.data
    };
  } catch (error) {
    console.error('Error adding punch to customer card:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all punch card customers for a business
 */
export async function getPunchCardCustomersForBusiness(businessId: string) {
  const response = await fetch(`/api/punch-cards/punches?businessId=${businessId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error fetching punch card customers');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get punch card customers for a specific punch card
 */
export async function getPunchCardCustomers(punchCardId: string) {
  // This would need a dedicated API route - for now returning empty
  console.warn('getPunchCardCustomers function needs to be implemented with proper API endpoint');
  return [];
}

/**
 * Add punches in bulk to multiple customers for a punch card
 */
export async function bulkAddPunches(
  punchesData: {
    punch_card_id: string;
    customer_id: string;
    transaction_id?: string;
  }[]
): Promise<{ 
  success: boolean; 
  message: string; 
  results?: any[]; 
  errors?: any[] 
}> {
  try {
    const response = await fetch('/api/punch-cards/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        operation: 'bulk_add_punches',
        data: punchesData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.error || 'Error performing bulk punch operation' 
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error performing bulk punch operation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get comprehensive punch card analytics for a business
 */
export async function getPunchCardAnalytics(businessId: string) {
  // This would need a dedicated API route - for now returning empty
  console.warn('getPunchCardAnalytics function needs to be implemented with proper API endpoint');
  return { punch_cards: [], recent_activity: [] };
}

/**
 * Bulk create punch cards
 */
export async function bulkCreatePunchCards(
  punchCardsData: Omit<PunchCard, 'id' | 'created_at' | 'updated_at' | 'business_id'>[]
): Promise<{ 
  success: boolean; 
  message: string; 
  data?: PunchCard[]; 
  errors?: any[] 
}> {
  try {
    const response = await fetch('/api/punch-cards/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        operation: 'bulk_create_punch_cards',
        data: punchCardsData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.error || 'Error creating punch cards in bulk' 
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating punch cards in bulk:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk update punch cards
 */
export async function bulkUpdatePunchCards(
  updates: { id: string; [key: string]: any }[]
): Promise<{ 
  success: boolean; 
  message: string; 
  results?: any[]; 
  errors?: any[] 
}> {
  try {
    const response = await fetch('/api/punch-cards/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        operation: 'bulk_update_punch_cards',
        data: updates
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.error || 'Error updating punch cards in bulk' 
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating punch cards in bulk:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk delete punch cards
 */
export async function bulkDeletePunchCards(
  punchCardIds: string[]
): Promise<{ 
  success: boolean; 
  message: string 
}> {
  try {
    const response = await fetch('/api/punch-cards/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        operation: 'bulk_delete_punch_cards',
        data: punchCardIds
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.error || 'Error deleting punch cards in bulk' 
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting punch cards in bulk:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Synchronize punch card completion with customer loyalty points
 * This function can be called when a punch card is completed to add points
 */
export async function syncPunchCardWithPoints(punchCardCustomerId: string, businessId: string, customerId: string) {
  // This function would need to be implemented with proper API endpoint if needed
  console.warn('syncPunchCardWithPoints function needs to be implemented with proper API endpoint');
  return { success: true, message: 'Sync completed (simulated)' };
}