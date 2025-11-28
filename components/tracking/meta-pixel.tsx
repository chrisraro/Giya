"use client"

import { useEffect } from "react"
import Script from "next/script"

interface MetaPixelProps {
  pixelId: string
  enabled?: boolean
}

/**
 * Meta (Facebook) Pixel Component
 * Loads and initializes the Meta Pixel for conversion tracking
 * 
 * @param pixelId - The Meta Pixel ID from the business
 * @param enabled - Whether to load the pixel (default: true, respects cookie consent)
 */
export function MetaPixel({ pixelId, enabled = true }: MetaPixelProps) {
  useEffect(() => {
    if (!enabled || !pixelId) return

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

      console.log(`[Meta Pixel] Initialized for Pixel ID: ${pixelId}`)
    }
  }, [pixelId, enabled])

  if (!enabled || !pixelId) {
    return null
  }

  return (
    <>
      {/* Meta Pixel Base Code */}
      <Script
        id={`facebook-pixel-${pixelId}`}
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
 * Track a custom Meta Pixel event
 * 
 * @param pixelId - The Meta Pixel ID
 * @param eventName - The event name ('PageView', 'Lead', 'Purchase', 'CompleteRegistration', etc.)
 * @param data - Optional event data
 */
export function trackMetaPixelEvent(
  pixelId: string,
  eventName: string,
  data?: Record<string, any>
) {
  if (typeof window === 'undefined') return

  try {
    // @ts-ignore
    if (window.fbq) {
      // Initialize the pixel if not already done
      // @ts-ignore
      window.fbq('init', pixelId)
      
      // Track the event
      if (data) {
        // @ts-ignore
        window.fbq('track', eventName, data)
      } else {
        // @ts-ignore
        window.fbq('track', eventName)
      }
      
      console.log(`[Meta Pixel] Event tracked:`, { pixelId, eventName, data })
    } else {
      console.warn('[Meta Pixel] fbq not initialized yet')
    }
  } catch (error) {
    console.error('[Meta Pixel] Error tracking event:', error)
  }
}

/**
 * Track a CompleteRegistration event (when user signs up)
 */
export function trackSignupConversion(pixelId: string, data?: {
  value?: number
  currency?: string
  content_name?: string
}) {
  trackMetaPixelEvent(pixelId, 'CompleteRegistration', data)
}

/**
 * Track a Purchase event (first transaction)
 */
export function trackPurchaseConversion(pixelId: string, data: {
  value: number
  currency?: string
  content_type?: string
  content_name?: string
}) {
  trackMetaPixelEvent(pixelId, 'Purchase', {
    value: data.value,
    currency: data.currency || 'PHP',
    content_type: data.content_type || 'product',
    content_name: data.content_name || 'Receipt Transaction',
  })
}

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}
