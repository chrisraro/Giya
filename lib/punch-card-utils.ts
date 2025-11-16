// lib/punch-card-utils.ts
import { createClient } from '@supabase/supabase-js';
import { PunchCardPunch } from './punch-cards';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    // First, get or create the punch card customer record
    let punchCardCustomer;
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('punch_card_customers')
      .select('*')
      .eq('punch_card_id', punchCardId)
      .eq('customer_id', customerId)
      .single();

    if (fetchError) {
      // Create a new punch card customer record
      const { data: newCustomer, error: createError } = await supabase
        .from('punch_card_customers')
        .insert([{
          punch_card_id: punchCardId,
          customer_id: customerId,
          punches_count: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating punch card customer:', createError);
        return { success: false, message: createError.message };
      }
      punchCardCustomer = newCustomer;
    } else {
      punchCardCustomer = existingCustomer;
    }

    // Add the punch
    const { data: newPunch, error: punchError } = await supabase
      .from('punch_card_punches')
      .insert([{
        punch_card_customer_id: punchCardCustomer.id,
        business_id: businessId,
        customer_id: customerId,
        transaction_id: transactionId || null,
        validated_by: businessId
      }])
      .select()
      .single();

    if (punchError) {
      console.error('Error creating punch:', punchError);
      return { success: false, message: punchError.message };
    }

    // Get the punch card to know the required punches
    const { data: punchCard, error: cardError } = await supabase
      .from('punch_cards')
      .select('punches_required')
      .eq('id', punchCardId)
      .single();

    if (cardError || !punchCard) {
      console.error('Error fetching punch card:', cardError);
      // Try to rollback the punch if we can't validate the card
      await supabase
        .from('punch_card_punches')
        .delete()
        .eq('id', newPunch.id);
      if (fetchError) {  // If we created a new customer record, remove it on error
        await supabase
          .from('punch_card_customers')
          .delete()
          .eq('id', punchCardCustomer.id);
      }
      return { success: false, message: cardError?.message || 'Punch card not found' };
    }

    // Update the customer's punch count
    const newPunchCount = punchCardCustomer.punches_count + 1;
    const isCompleted = newPunchCount >= punchCard.punches_required;

    const { error: updateError } = await supabase
      .from('punch_card_customers')
      .update({
        punches_count: newPunchCount,
        last_punch_at: new Date().toISOString(),
        completed_at: isCompleted ? new Date().toISOString() : null,
        is_completed: isCompleted
      })
      .eq('id', punchCardCustomer.id);

    if (updateError) {
      console.error('Error updating punch count:', updateError);
      // Try to rollback the punch if updating the count failed
      await supabase
        .from('punch_card_punches')
        .delete()
        .eq('id', newPunch.id);
      return { success: false, message: updateError.message };
    }

    return {
      success: true,
      message: isCompleted ? 'Punch card completed! Reward unlocked.' : 'Punch added successfully.',
      data: newPunch
    };
  } catch (error) {
    console.error('Error adding punch to customer card:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all punch card customers for a business
 */
export async function getPunchCardCustomersForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('punch_card_customers')
    .select(`
      id,
      punches_count,
      is_completed,
      created_at,
      last_punch_at,
      completed_at,
      customer_id,
      punch_cards!inner (
        id,
        title,
        description,
        punches_required,
        reward_description,
        image_url,
        is_active,
        valid_from,
        valid_until
      ),
      customers!inner (
        full_name,
        profile_pic_url
      )
    `)
    .eq('punch_cards.business_id', businessId);

  if (error) {
    throw new Error(`Error fetching punch card customers: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    punches_count: item.punches_count,
    is_completed: item.is_completed,
    created_at: item.created_at,
    last_punch_at: item.last_punch_at,
    completed_at: item.completed_at,
    customer_id: item.customer_id,
    punch_card: {
      id: item.punch_cards.id,
      title: item.punch_cards.title,
      description: item.punch_cards.description,
      punches_required: item.punch_cards.punches_required,
      reward_description: item.punch_cards.reward_description,
      image_url: item.punch_cards.image_url,
      is_active: item.punch_cards.is_active,
      valid_from: item.punch_cards.valid_from,
      valid_until: item.punch_cards.valid_until
    },
    customer: {
      full_name: item.customers.full_name,
      profile_pic_url: item.customers.profile_pic_url
    }
  }));
}

/**
 * Get punch card customers for a specific punch card
 */
export async function getPunchCardCustomers(punchCardId: string) {
  const { data, error } = await supabase
    .from('punch_card_customers')
    .select(`
      id,
      punches_count,
      is_completed,
      created_at,
      last_punch_at,
      completed_at,
      customer_id,
      customers!inner (
        full_name,
        profile_pic_url
      )
    `)
    .eq('punch_card_id', punchCardId);

  if (error) {
    throw new Error(`Error fetching punch card customers: ${error.message}`);
  }

  return data.map(item => ({
    id: item.id,
    punches_count: item.punches_count,
    is_completed: item.is_completed,
    created_at: item.created_at,
    last_punch_at: item.last_punch_at,
    completed_at: item.completed_at,
    customer_id: item.customer_id,
    customer: {
      full_name: item.customers.full_name,
      profile_pic_url: item.customers.profile_pic_url
    }
  }));
}

/**
 * Add punches in bulk to multiple customers for a punch card
 */
export async function bulkAddPunches(
  punchCardId: string,
  punchesData: {
    customer_id: string;
    business_id: string;
    transaction_id?: string;
  }[]
) {
  const results = [];
  for (const punchData of punchesData) {
    const result = await addPunchToCustomerCard(
      punchCardId,
      punchData.business_id,
      punchData.customer_id,
      punchData.transaction_id
    );
    results.push(result);
  }
  return results;
}

/**
 * Get comprehensive punch card analytics for a business
 */
export async function getPunchCardAnalytics(businessId: string) {
  // Get overall punch card metrics
  const { data: punchCards, error: cardsError } = await supabase
    .from('punch_cards')
    .select(`
      id,
      title,
      punches_required,
      reward_description,
      is_active,
      created_at,
      updated_at,
      count(punch_card_customers.id) as total_participants,
      count(punch_card_customers.id) filter (where punch_card_customers.is_completed = true) as total_completed
    `)
    .eq('business_id', businessId)
    .group('id, title, punches_required, reward_description, is_active, created_at, updated_at');

  if (cardsError) {
    throw new Error(`Error fetching punch card analytics: ${cardsError.message}`);
  }

  // Get recent activity
  const { data: recentActivity, error: activityError } = await supabase
    .from('punch_card_punches')
    .select(`
      id,
      punch_at,
      customer_id,
      punch_card_customer_id,
      customers!inner (
        full_name
      )
    `)
    .eq('business_id', businessId)
    .order('punch_at', { ascending: false })
    .limit(10);

  if (activityError) {
    console.error('Error fetching recent activity:', activityError);
  }

  return {
    punch_cards: punchCards || [],
    recent_activity: recentActivity || [],
  };
}

/**
 * Synchronize punch card completion with customer loyalty points
 * This function can be called when a punch card is completed to add points
 */
export async function syncPunchCardWithPoints(punchCardCustomerId: string, businessId: string, customerId: string) {
  try {
    // Get the punch card customer details
    const { data: punchCardCustomer, error: customerError } = await supabase
      .from('punch_card_customers')
      .select(`
        id,
        is_completed,
        punch_cards!inner (
          business_id,
          punches_required,
          title
        )
      `)
      .eq('id', punchCardCustomerId)
      .single();

    if (customerError || !punchCardCustomer) {
      console.error('Error fetching punch card customer:', customerError);
      return { success: false, message: customerError?.message || 'Punch card customer not found' };
    }

    // Check if the punch card is completed
    if (!punchCardCustomer.is_completed) {
      return { success: false, message: 'Punch card not completed yet' };
    }

    // Example: Add a fixed number of points based on the punch card completion
    // You can customize this logic based on your business needs
    const pointsToAdd = 10; // Example: add 10 points for completion

    // Update customer's total points
    const { error: pointsError } = await supabase.rpc('increment_customer_points', {
      customer_id: customerId,
      points_to_add: pointsToAdd
    });

    if (pointsError) {
      console.error('Error adding points to customer:', pointsError);
      // Don't treat this as a critical error, just log it
    }

    return {
      success: true,
      message: `Synced punch card completion with points. Added ${pointsToAdd} points.`,
      pointsAdded: pointsToAdd
    };
  } catch (error) {
    console.error('Error syncing punch card with points:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}