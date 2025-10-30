'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showIndicator && isOnline) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-white animate-pulse'
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're Offline</span>
          </>
        )}
      </div>
    </div>
  )
}
