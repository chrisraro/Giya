"use client"

import { useEffect } from "react"
import Script from "next/script"

interface BusinessPixelProps {
  pixelId: string | null
}

/**
 * Dynamic Business Meta Pixel Component
 * 
 * This component dynamically injects the Meta Pixel script ONLY when:
 * 1. A user arrives via a business referral link (?ref=BUSINESS_ID)
 * 2. The business has a Meta Pixel ID configured
 * 
 * This prevents "double counting" and ensures each business only tracks
 * their own referrals, not global traffic.
 * 
 * @param pixelId - The Meta Pixel ID from the referring business (null if not referred)
 */
export function BusinessPixel({ pixelId }: BusinessPixelProps) {
  useEffect(() => {
    if (!pixelId) {
      console.log('[Business Pixel] No pixel ID provided - not loading')
      return
    }

    // Initialize fbq function if it doesn't exist
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.fbq = window.fbq || function() {
        // @ts-ignore
        (window.fbq.q = window.fbq.q || []).push(arguments)
      }
      // @ts-ignore
      window._fbq = window._fbq || window.fbq
      // @ts-ignore
      window.fbq.loaded = true
      // @ts-ignore
      window.fbq.version = '2.0'
      // @ts-ignore
      window.fbq.queue = []

      console.log(`[Business Pixel] Initialized for Business Pixel ID: ${pixelId}`)
    }
  }, [pixelId])

  // If no pixel ID, render nothing (Privacy-first approach)
  if (!pixelId) {
    return null
  }

  return (
    <>
      {/* Meta Pixel Base Code - Dynamic Injection */}
      <Script
        id={`business-pixel-${pixelId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* Noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Track a CompleteRegistration event (when user signs up)
 * 
 * @param pixelId - The Meta Pixel ID of the referring business
 * @param data - Optional event data
 */
export function trackSignupConversion(pixelId: string, data?: {
  value?: number
  currency?: string
  content_name?: string
}) {
  if (typeof window === 'undefined') return

  try {
    // Ensure fbq is loaded - if not, load it dynamically
    if (!window.fbq) {
      console.log('[Business Pixel] fbq not loaded, initializing...')
      
      // Initialize fbq
      window.fbq = function() {
        // @ts-ignore
        (window.fbq.q = window.fbq.q || []).push(arguments)
      }
      // @ts-ignore
      window._fbq = window.fbq
      // @ts-ignore
      window.fbq.loaded = true
      // @ts-ignore
      window.fbq.version = '2.0'
      // @ts-ignore
      window.fbq.queue = []
      
      // Load the pixel script
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)
      
      // Wait for script to load before tracking
      script.onload = () => {
        console.log('[Business Pixel] Script loaded, tracking CompleteRegistration')
        // @ts-ignore
        window.fbq('init', pixelId)
        // @ts-ignore
        window.fbq('track', 'CompleteRegistration', data || {})
        console.log(`[Business Pixel] CompleteRegistration tracked:`, { pixelId, data })
      }
    } else {
      // fbq already loaded
      // @ts-ignore
      window.fbq('init', pixelId)
      // @ts-ignore
      window.fbq('track', 'CompleteRegistration', data || {})
      console.log(`[Business Pixel] CompleteRegistration tracked:`, { pixelId, data })
    }
  } catch (error) {
    console.error('[Business Pixel] Error tracking signup:', error)
  }
}

/**
 * Track a Purchase event (first transaction from referred customer)
 * 
 * This should ONLY be called when:
 * 1. It's the customer's first transaction
 * 2. The customer was referred by a business with a Meta Pixel ID
 * 
 * @param pixelId - The Meta Pixel ID of the referring business
 * @param data - Purchase event data
 */
export function trackPurchaseConversion(pixelId: string, data: {
  value: number
  currency?: string
  content_type?: string
  content_name?: string
}) {
  if (typeof window === 'undefined') return

  try {
    // @ts-ignore
    if (window.fbq) {
      // @ts-ignore
      window.fbq('init', pixelId)
      // @ts-ignore
      window.fbq('track', 'Purchase', {
        value: data.value,
        currency: data.currency || 'PHP',
        content_type: data.content_type || 'product',
        content_name: data.content_name || 'Receipt Transaction',
      })
      
      console.log(`[Business Pixel] Purchase tracked:`, { pixelId, data })
    } else {
      console.warn('[Business Pixel] fbq not initialized yet')
    }
  } catch (error) {
    console.error('[Business Pixel] Error tracking purchase:', error)
  }
}

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}
