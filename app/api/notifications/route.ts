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

// GET: Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);

    // Fetch notifications for the current user
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 most recent notifications

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return Response.json({ error: 'Missing or invalid notification IDs' }, { status: 400 });
    }

    const supabase = createClient(request);

    // Update notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notification_ids)
      .eq('user_id', session.user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return Response.json({ error: 'Missing notification ID' }, { status: 400 });
    }

    const supabase = createClient(request);

    // Delete the notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Notification deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}