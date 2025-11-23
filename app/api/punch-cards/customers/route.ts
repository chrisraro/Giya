import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper function to create Supabase client from request
function createClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Extract cookies from the request
  const cookies = request.headers.get('Cookie') ?? '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${name}=`));
        if (cookie) {
          const value = cookie.split('=')[1];
          return decodeURIComponent(value);
        }
        return undefined;
      },
    },
  });
}

// Helper function to get session
async function getSession(request: NextRequest) {
  const supabase = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

// GET: Fetch customer's punch card participation
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const punchCardId = url.searchParams.get('punchCardId');

    // Create client with request context for database operations
    const supabase = createClient(request);

    // Fetch all punch card participations for a customer
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
          punch_cards (
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

      // Format the response
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
          valid_until: item.punch_cards.valid_until,
          business_name: item.punch_cards.businesses?.business_name || 'Unknown Business'
        }
      }));

      return Response.json({ data: formattedData }, { status: 200 });
    }

    // Fetch a specific punch card participation for a customer
    if (punchCardId) {
      const { data, error } = await supabase
        .from('punch_card_customers')
        .select(`
          id,
          punches_count,
          is_completed,
          created_at,
          last_punch_at,
          completed_at,
          punch_cards (
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
        .eq('punch_card_id', punchCardId)
        .eq('customer_id', session.user.id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return Response.json({ data: null }, { status: 200 }); // No participation yet
      }

      // Format the response
      const item = data[0];
      const formattedData = {
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
      };

      return Response.json({ data: formattedData }, { status: 200 });
    }

    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching punch card participation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Join/subscribe to a punch card
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { punch_card_id } = body;

    if (!punch_card_id) {
      return Response.json({ error: 'Missing punch card ID' }, { status: 400 });
    }

    const supabase = createClient(request);

    // Verify that the punch card exists and is active
    const { data: punchCard, error: cardError } = await supabase
      .from('punch_cards')
      .select('id, is_active, valid_from, valid_until')
      .eq('id', punch_card_id)
      .single();

    if (cardError || !punchCard) {
      return Response.json({ error: 'Punch card not found' }, { status: 404 });
    }

    // Check if the punch card is active and within valid dates
    const now = new Date();
    const validFrom = new Date(punchCard.valid_from);
    const validUntil = punchCard.valid_until ? new Date(punchCard.valid_until) : null;

    if (!punchCard.is_active || now < validFrom || (validUntil && now > validUntil)) {
      return Response.json({ error: 'Punch card is not available' }, { status: 400 });
    }

    // Check if the customer is already participating
    const { data: existingParticipation, error: existingError } = await supabase
      .from('punch_card_customers')
      .select('id')
      .eq('punch_card_id', punch_card_id)
      .eq('customer_id', session.user.id)
      .single();

    if (existingParticipation) {
      return Response.json({ error: 'Already participating in this punch card' }, { status: 400 });
    }

    // Create the participation record
    const { data, error } = await supabase
      .from('punch_card_customers')
      .insert([{
        punch_card_id,
        customer_id: session.user.id,
        punches_count: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating punch card participation:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error joining punch card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a punch card participation (e.g., reset punches)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, punches_count } = body;

    if (!id) {
      return Response.json({ error: 'Missing participation ID' }, { status: 400 });
    }

    const supabase = createClient(request);

    // Get the participation record to check permissions
    const { data: participation, error: fetchError } = await supabase
      .from('punch_card_customers')
      .select(`
        id,
        customer_id,
        punch_cards!inner (
          business_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !participation) {
      return Response.json({ error: 'Participation record not found' }, { status: 404 });
    }

    // Check if the requesting user is the customer or business owner
    if (session.user.id !== participation.customer_id &&
        session.user.id !== participation.punch_cards.business_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('punch_card_customers')
      .update({
        punches_count: punches_count ?? participation.punches_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating punch card participation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Leave a punch card
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing participation ID' }, { status: 400 });
    }

    const supabase = createClient(request);

    // Get the participation record to check permissions
    const { data: participation, error: fetchError } = await supabase
      .from('punch_card_customers')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !participation) {
      return Response.json({ error: 'Participation record not found' }, { status: 404 });
    }

    // Check if the requesting user is the customer
    if (session.user.id !== participation.customer_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('punch_card_customers')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Left punch card successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error leaving punch card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}