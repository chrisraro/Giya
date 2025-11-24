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

// GET: Fetch punch card analytics for a business
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
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

    const supabase = createClient(request);

    // Get all punch cards for this business
    const { data: punchCards, error: punchCardsError } = await supabase
      .from('punch_cards')
      .select('id, title, punches_required, created_at')
      .eq('business_id', businessId);

    if (punchCardsError) {
      return Response.json({ error: punchCardsError.message }, { status: 500 });
    }

    // Get analytics data for each punch card
    const analyticsData = await Promise.all(punchCards.map(async (punchCard) => {
      // Get total participants
      const { count: totalParticipants, error: participantsError } = await supabase
        .from('punch_card_customers')
        .select('*', { count: 'exact', head: true })
        .eq('punch_card_id', punchCard.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return null;
      }

      // Get completed punch cards
      const { count: completedCount, error: completedError } = await supabase
        .from('punch_card_customers')
        .select('*', { count: 'exact', head: true })
        .eq('punch_card_id', punchCard.id)
        .eq('is_completed', true);

      if (completedError) {
        console.error('Error fetching completed count:', completedError);
        return null;
      }

      // Get total punches
      const { count: totalPunches, error: punchesError } = await supabase
        .from('punch_card_punches')
        .select('*', { count: 'exact', head: true })
        .eq('punch_card_id', punchCard.id);

      if (punchesError) {
        console.error('Error fetching punches:', punchesError);
        return null;
      }

      return {
        punch_card_id: punchCard.id,
        title: punchCard.title,
        punches_required: punchCard.punches_required,
        total_participants: totalParticipants || 0,
        completed_count: completedCount || 0,
        total_punches: totalPunches || 0,
        completion_rate: totalParticipants ? Math.round((completedCount || 0) / totalParticipants * 100) : 0
      };
    }));

    // Filter out any null results
    const validAnalyticsData = analyticsData.filter(item => item !== null);

    // Get overall business stats
    const { count: totalPunchCards, error: totalCardsError } = await supabase
      .from('punch_cards')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (totalCardsError) {
      return Response.json({ error: totalCardsError.message }, { status: 500 });
    }

    const { count: totalBusinessParticipants, error: businessParticipantsError } = await supabase
      .from('punch_card_customers')
      .select('*', { count: 'exact', head: true })
      .eq('punch_cards.business_id', businessId);

    if (businessParticipantsError) {
      return Response.json({ error: businessParticipantsError.message }, { status: 500 });
    }

    const { count: totalBusinessPunches, error: businessPunchesError } = await supabase
      .from('punch_card_punches')
      .select('*', { count: 'exact', head: true })
      .eq('punch_cards.business_id', businessId);

    if (businessPunchesError) {
      return Response.json({ error: businessPunchesError.message }, { status: 500 });
    }

    const { count: totalCompletedPunchCards, error: completedCardsError } = await supabase
      .from('punch_card_customers')
      .select('*', { count: 'exact', head: true })
      .eq('punch_cards.business_id', businessId)
      .eq('is_completed', true);

    if (completedCardsError) {
      return Response.json({ error: completedCardsError.message }, { status: 500 });
    }

    const businessStats = {
      total_punch_cards: totalPunchCards || 0,
      total_participants: totalBusinessParticipants || 0,
      total_punches: totalBusinessPunches || 0,
      total_completed: totalCompletedPunchCards || 0,
      completion_rate: totalBusinessParticipants ? Math.round((totalCompletedPunchCards || 0) / totalBusinessParticipants * 100) : 0
    };

    return Response.json({ 
      business_stats: businessStats,
      punch_card_analytics: validAnalyticsData 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching punch card analytics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}