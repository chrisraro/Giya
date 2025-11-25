import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationToDevice, sendNotificationToMultipleDevices, sendNotificationToTopic } from '@/lib/firebase/admin'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, userIds, topic, title, message, data } = body

    // Validate request
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Send to single user
    if (type === 'user' && userId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('fcm_token')
        .eq('user_id', userId)
        .single()

      if (!customer?.fcm_token) {
        return NextResponse.json(
          { error: 'User has no FCM token' },
          { status: 404 }
        )
      }

      const success = await sendNotificationToDevice(
        customer.fcm_token,
        title,
        message,
        data
      )

      return NextResponse.json({ success })
    }

    // Send to multiple users
    if (type === 'users' && userIds?.length > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('fcm_token')
        .in('user_id', userIds)
        .not('fcm_token', 'is', null)

      const tokens = customers?.map(c => c.fcm_token).filter(Boolean) || []

      if (tokens.length === 0) {
        return NextResponse.json(
          { error: 'No valid FCM tokens found' },
          { status: 404 }
        )
      }

      const result = await sendNotificationToMultipleDevices(
        tokens,
        title,
        message,
        data
      )

      return NextResponse.json(result)
    }

    // Send to topic
    if (type === 'topic' && topic) {
      const success = await sendNotificationToTopic(topic, title, message, data)
      return NextResponse.json({ success })
    }

    return NextResponse.json(
      { error: 'Invalid notification type or missing parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
