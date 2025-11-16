import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAuth } from '@/.auth/web/api';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to get session
async function getSession() {
  const auth = await getAuth();
  return auth.session;
}

// GET: Fetch punch cards for a business or customer
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');
    const customerId = url.searchParams.get('customerId');
    const punchCardId = url.searchParams.get('punchCardId');

    // Fetch all active punch cards for a business
    if (businessId) {
      // Check if the requesting user is the business owner
      if (session.user.id !== businessId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('punch_cards')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ data }, { status: 200 });
    }

    // Fetch punch cards for a customer (their active punch cards)
    if (customerId) {
      if (session.user.id !== customerId) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

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
            valid_until
          )
        `)
        .eq('customer_id', customerId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      // Format the response to be more useful
      const formattedData = data.map(item => ({
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
          valid_until: item.punch_cards.valid_until
        }
      }));

      return Response.json({ data: formattedData }, { status: 200 });
    }

    // Fetch a specific punch card
    if (punchCardId) {
      const { data, error } = await supabase
        .from('punch_cards')
        .select('*')
        .eq('id', punchCardId)
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      // Check if the requesting user has access to this punch card
      if (session.user.id !== data.business_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      return Response.json({ data }, { status: 200 });
    }

    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching punch cards:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new punch card
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      punches_required,
      reward_description,
      image_url,
      is_active,
      valid_from,
      valid_until
    } = body;

    // Validate required fields
    if (!title || !reward_description || !punches_required) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('punch_cards')
      .insert([{
        business_id: session.user.id,
        title,
        description,
        punches_required,
        reward_description,
        image_url,
        is_active: is_active ?? true,
        valid_from: valid_from || new Date().toISOString(),
        valid_until
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating punch card:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating punch card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing punch card
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, punches_required, reward_description, image_url, is_active, valid_from, valid_until } = body;

    if (!id) {
      return Response.json({ error: 'Missing punch card ID' }, { status: 400 });
    }

    // Check if the user owns this punch card
    const { data: punchCard, error: fetchError } = await supabase
      .from('punch_cards')
      .select('business_id')
      .eq('id', id)
      .single();

    if (fetchError || !punchCard) {
      return Response.json({ error: 'Punch card not found' }, { status: 404 });
    }

    if (punchCard.business_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('punch_cards')
      .update({
        title,
        description,
        punches_required,
        reward_description,
        image_url,
        is_active,
        valid_from,
        valid_until,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating punch card:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating punch card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a punch card
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing punch card ID' }, { status: 400 });
    }

    // Check if the user owns this punch card
    const { data: punchCard, error: fetchError } = await supabase
      .from('punch_cards')
      .select('business_id')
      .eq('id', id)
      .single();

    if (fetchError || !punchCard) {
      return Response.json({ error: 'Punch card not found' }, { status: 404 });
    }

    if (punchCard.business_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('punch_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting punch card:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Punch card deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting punch card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}