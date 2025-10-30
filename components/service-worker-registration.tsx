'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)

          // Check for updates every hour
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  toast('New version available!', {
                    description: 'Click to update and reload',
                    action: {
                      label: 'Update',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }
                    },
                    duration: 10000
                  })
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New Service Worker activated')
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[PWA] Cache updated:', event.data.url)
        }
      })
    }
  }, [])

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => {
      toast.success('Back online!', {
        description: 'Your connection has been restored'
      })
    }

    const handleOffline = () => {
      toast.warning('You are offline', {
        description: 'Some features may be limited',
        duration: 5000
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
