// app/api/punch-cards/customers-by-business/route.ts
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

// GET: Fetch punch card customers for a business
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');

    if (!businessId) {
      return Response.json({ error: 'Missing business ID' }, { status: 400 });
    }

    // Check if the requesting user is the business owner
    if (session.user.id !== businessId) {
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

    return Response.json({ data: formattedData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching punch card customers:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}