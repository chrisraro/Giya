import { NextResponse } from 'next/server'
import { expandGoogleMapsShortUrl } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { shortUrl } = await request.json()
    
    if (!shortUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }
    
    // For Google Maps short URLs, we'll return a special response indicating
    // that these cannot be embedded directly
    if (shortUrl.includes('maps.app.goo.gl') || shortUrl.includes('goo.gl/maps')) {
      return NextResponse.json({ 
        expandedUrl: shortUrl,
        isShortUrl: true,
        message: 'Google Maps short URLs cannot be embedded directly'
      })
    }
    
    // For other URLs, we would normally expand them here
    // But for now, we'll just return the original URL
    return NextResponse.json({ 
      expandedUrl: shortUrl,
      isShortUrl: false
    })
  } catch (error) {
    console.error('Error expanding URL:', error)
    return NextResponse.json({ error: 'Failed to expand URL' }, { status: 500 })
  }
}