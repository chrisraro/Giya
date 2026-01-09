"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"

export default function TestPage() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [swStatus, setSwStatus] = useState<string>('checking...')
  const [isOnline, setIsOnline] = useState(true)
  const [cspErrors, setCspErrors] = useState<string[]>([])
  const [cacheStatus, setCacheStatus] = useState<string>('checking...')
  const [manifestStatus, setManifestStatus] = useState<string>('checking...')

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setSwRegistration(registration)
          setSwStatus('registered')
        } else {
          setSwStatus('not registered')
        }
      }).catch(() => {
        setSwStatus('error')
      })
    } else {
      setSwStatus('not supported')
    }

    // Check Cache API
    if ('caches' in window) {
      caches.keys().then((keys) => {
        setCacheStatus(`${keys.length} cache(s) found: ${keys.join(', ')}`)
      }).catch(() => {
        setCacheStatus('error checking caches')
      })
    } else {
      setCacheStatus('not supported')
    }

    // Check manifest
    fetch('/manifest.json')
      .then((res) => res.json())
      .then((data) => {
        setManifestStatus(`loaded: ${data.name}`)
      })
      .catch(() => {
        setManifestStatus('error loading manifest')
      })

    // Listen for CSP errors
    const cspErrorHandler = (event: SecurityPolicyViolationEvent) => {
      setCspErrors(prev => [...prev, `${event.violatedDirective}: ${event.blockedURI}`])
    }
    document.addEventListener('securitypolicyviolation', cspErrorHandler as any)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('securitypolicyviolation', cspErrorHandler as any)
    }
  }, [])

  const clearAllCaches = async () => {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
      setCacheStatus('all caches cleared')
    }
  }

  const unregisterSW = async () => {
    if (swRegistration) {
      await swRegistration.unregister()
      setSwStatus('unregistered')
      setSwRegistration(null)
    }
  }

  const hardReload = () => {
    if (typeof window !== 'undefined') {
      // Clear all caches and reload
      clearAllCaches().then(() => {
        window.location.reload()
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-6">PWA & CSP Diagnostics</h1>

      {/* Online Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {swStatus === 'registered' ? <CheckCircle className="text-green-500" /> : 
             swStatus === 'not registered' ? <AlertCircle className="text-yellow-500" /> : 
             <XCircle className="text-red-500" />}
            Service Worker
          </CardTitle>
          <CardDescription>Status: {swStatus}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {swRegistration && (
            <div className="text-sm space-y-1">
              <p>Scope: {swRegistration.scope}</p>
              <p>Active: {swRegistration.active ? 'Yes' : 'No'}</p>
              <p>Waiting: {swRegistration.waiting ? 'Yes' : 'No'}</p>
              <p>Installing: {swRegistration.installing ? 'Yes' : 'No'}</p>
            </div>
          )}
          <Button onClick={unregisterSW} disabled={!swRegistration} variant="destructive" size="sm">
            Unregister Service Worker
          </Button>
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Storage</CardTitle>
          <CardDescription>{cacheStatus}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={clearAllCaches} variant="destructive" size="sm">
            Clear All Caches
          </Button>
        </CardContent>
      </Card>

      {/* Manifest Status */}
      <Card>
        <CardHeader>
          <CardTitle>PWA Manifest</CardTitle>
          <CardDescription>{manifestStatus}</CardDescription>
        </CardHeader>
      </Card>

      {/* CSP Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {cspErrors.length > 0 ? <XCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
            Content Security Policy
          </CardTitle>
          <CardDescription>
            {cspErrors.length === 0 ? 'No CSP violations detected' : `${cspErrors.length} violation(s) detected`}
          </CardDescription>
        </CardHeader>
        {cspErrors.length > 0 && (
          <CardContent>
            <ul className="space-y-1 text-sm">
              {cspErrors.map((error, i) => (
                <li key={i} className="text-red-600">{error}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={hardReload} variant="default" className="w-full">
            Hard Reload (Clear Cache & Reload)
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Normal Reload
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}