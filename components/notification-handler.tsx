"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase/client'
import { createClient } from '@/lib/supabase/client'

export function NotificationHandler() {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Request notification permission on mount
    async function setupNotifications() {
      const token = await requestNotificationPermission()
      
      if (token) {
        setIsPermissionGranted(true)
        
        // Save FCM token to database
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Update customer profile with FCM token
          const { error } = await supabase
            .from('customers')
            .update({ fcm_token: token })
            .eq('user_id', user.id)
          
          if (error) {
            console.error('[FCM] Error saving token:', error)
          } else {
            console.log('[FCM] Token saved successfully')
          }
        }
      }
    }

    setupNotifications()

    // Listen for foreground messages
    onMessageListener()
      .then((payload: any) => {
        console.log('[FCM] Received foreground message:', payload)
        
        // Show toast notification
        toast(payload.notification?.title || 'New Notification', {
          description: payload.notification?.body,
          duration: 5000,
        })
      })
      .catch((err) => console.log('[FCM] Message listener error:', err))
  }, [])

  return null // This component doesn't render anything
}
