/**
 * PWA Utility Functions
 * Handles Progressive Web App functionality including notifications, offline status, and caching
 */

export const pwa = {
  /**
   * Check if the app is running as a PWA
   */
  isInstalled: (): boolean => {
    if (typeof window === 'undefined') return false
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  },

  /**
   * Check if the device is online
   */
  isOnline: (): boolean => {
    if (typeof window === 'undefined') return true
    return navigator.onLine
  },

  /**
   * Request notification permission
   */
  requestNotificationPermission: async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  },

  /**
   * Show a notification
   */
  showNotification: async (
    title: string,
    options?: NotificationOptions
  ): Promise<void> => {
    if (typeof window === 'undefined') return

    const permission = await pwa.requestNotificationPermission()
    
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        icon: '/Naga Perks Logo.png',
        badge: '/giya-logo.png',
        ...options,
      })
    }
  },

  /**
   * Subscribe to push notifications
   */
  subscribeToPush: async (
    vapidPublicKey: string
  ): Promise<PushSubscription | null> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribeFromPush: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        return await subscription.unsubscribe()
      }
      
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  },

  /**
   * Get current push subscription
   */
  getPushSubscription: async (): Promise<PushSubscription | null> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Failed to get push subscription:', error)
      return null
    }
  },

  /**
   * Clear all caches
   */
  clearCache: async (): Promise<void> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const controller = navigator.serviceWorker.controller
    if (controller) {
      controller.postMessage({ type: 'CLEAR_CACHE' })
    }
  },

  /**
   * Check for service worker updates
   */
  checkForUpdates: async (): Promise<void> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
    }
  },

  /**
   * Get cache storage estimate
   */
  getStorageEstimate: async (): Promise<StorageEstimate | null> => {
    if (typeof window === 'undefined' || !('storage' in navigator)) {
      return null
    }

    try {
      return await navigator.storage.estimate()
    } catch (error) {
      console.error('Failed to get storage estimate:', error)
      return null
    }
  },

  /**
   * Add to home screen (for iOS)
   */
  canAddToHomeScreen: (): boolean => {
    if (typeof window === 'undefined') return false
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as any).standalone
    
    return isIOS && !isInStandaloneMode
  },
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Hook for detecting PWA install status
 */
export function useIsPWA(): boolean {
  if (typeof window === 'undefined') return false
  return pwa.isInstalled()
}

/**
 * Hook for detecting online/offline status
 */
export function useOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true
  
  const [isOnline, setIsOnline] = React.useState(pwa.isOnline())

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Import React for hooks
import React from 'react'
