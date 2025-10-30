'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        // Show install prompt after 30 seconds
        setTimeout(() => {
          setShowPrompt(true)
        }, 30000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Hide install button if already installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed')
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`[PWA] User response to install prompt: ${outcome}`)

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Install Naga Perks</CardTitle>
                <CardDescription className="text-xs">
                  Quick access from your home screen
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDismiss}
          >
            Not now
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleInstallClick}
          >
            Install
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
