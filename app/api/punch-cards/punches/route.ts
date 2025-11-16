import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to get session
async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

// GET: Fetch punches for a customer or business
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const businessId = url.searchParams.get('businessId');
    const punchCardId = url.searchParams.get('punchCardId');

    // Fetch punches for a customer
    if (customerId) {
      if (session.user.id !== customerId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('punch_card_punches')
        .select(`
          id,
          punch_at,
          transaction_id,
          punch_card_customers!inner (
            id,
            punch_cards!inner (
              title
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('punch_at', { ascending: false });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ data }, { status: 200 });
    }

    // Fetch punches for a business
    if (businessId) {
      if (session.user.id !== businessId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('punch_card_punches')
        .select('*')
        .eq('business_id', businessId)
        .order('punch_at', { ascending: false });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ data }, { status: 200 });
    }

    // Fetch punches for a specific punch card
    if (punchCardId) {
      // Check if the user has access to this punch card
      const { data: punchCard, error: cardError } = await supabase
        .from('punch_cards')
        .select('business_id')
        .eq('id', punchCardId)
        .single();

      if (cardError || !punchCard) {
        return Response.json({ error: 'Punch card not found' }, { status: 404 });
      }

      if (session.user.id !== punchCard.business_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('punch_card_punches')
        .select(`
          id,
          punch_at,
          customer_id,
          transaction_id,
          punch_card_customers (
            id,
            customer_id,
            punches_count,
            is_completed
          )
        `)
        .eq('punch_card_customer_id', punchCardId)
        .order('punch_at', { ascending: false });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ data }, { status: 200 });
    }

    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching punches:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a new punch
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { punch_card_customer_id, transaction_id } = body;

    if (!punch_card_customer_id) {
      return Response.json({ error: 'Missing punch card customer ID' }, { status: 400 });
    }

    // Get the punch card customer record
    const { data: customerPunchCard, error: fetchError } = await supabase
      .from('punch_card_customers')
      .select(`
        id,
        punch_card_id,
        customer_id,
        punches_count,
        is_completed,
        punch_cards!inner (
          business_id,
          punches_required
        )
      `)
      .eq('id', punch_card_customer_id)
      .single();

    if (fetchError || !customerPunchCard) {
      return Response.json({ error: 'Punch card customer record not found' }, { status: 404 });
    }

    // Verify that the requesting user is the business that owns the punch card
    if (session.user.id !== customerPunchCard.punch_cards.business_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the punch card is already completed
    if (customerPunchCard.is_completed) {
      return Response.json({ error: 'Punch card already completed' }, { status: 400 });
    }

    // Start a transaction to ensure data consistency
    const { data: newPunch, error: punchError } = await supabase
      .from('punch_card_punches')
      .insert([{
        punch_card_customer_id,
        business_id: customerPunchCard.punch_cards.business_id,
        customer_id: customerPunchCard.customer_id,
        transaction_id: transaction_id || null,
        validated_by: session.user.id
      }])
      .select()
      .single();

    if (punchError) {
      console.error('Error creating punch:', punchError);
      return Response.json({ error: punchError.message }, { status: 500 });
    }

    // Update the customer's punch count
    const newPunchCount = customerPunchCard.punches_count + 1;
    const isCompleted = newPunchCount >= customerPunchCard.punch_cards.punches_required;
    
    const { error: updateError } = await supabase
      .from('punch_card_customers')
      .update({
        punches_count: newPunchCount,
        last_punch_at: new Date().toISOString(),
        completed_at: isCompleted ? new Date().toISOString() : null,
        is_completed: isCompleted
      })
      .eq('id', punch_card_customer_id);

    if (updateError) {
      console.error('Error updating punch count:', updateError);
      // Try to rollback the punch if updating the count failed
      await supabase
        .from('punch_card_punches')
        .delete()
        .eq('id', newPunch.id);
      
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ 
      data: newPunch,
      message: isCompleted ? 'Punch card completed! Reward unlocked.' : 'Punch added successfully.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding punch:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a punch (if needed, for admin purposes)
export async function PUT(request: NextRequest) {
  // For now, punches are generally immutable - they represent events that happened
  // This could be used for administrative purposes if needed
  return Response.json({ error: 'Updating punches is not allowed' }, { status: 405 });
}

// DELETE: Delete a punch (for administrative purposes)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing punch ID' }, { status: 400 });
    }

    // Get the punch record to check permissions
    const { data: punch, error: fetchError } = await supabase
      .from('punch_card_punches')
      .select('business_id')
      .eq('id', id)
      .single();

    if (fetchError || !punch) {
      return Response.json({ error: 'Punch not found' }, { status: 404 });
    }

    // Check if the requesting user is the business that added the punch
    if (session.user.id !== punch.business_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('punch_card_punches')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Punch deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting punch:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}