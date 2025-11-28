import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Capture business referral ID from URL parameters (?ref=BUSINESS_ID)
  const refBusinessId = request.nextUrl.searchParams.get('ref')
  
  // If there's a referral business ID, store it in a cookie for attribution
  if (refBusinessId) {
    console.log(`[Middleware] 🎯 Referral link detected! Business ID: ${refBusinessId}`)
    console.log(`[Middleware] 📍 Full URL: ${request.url}`)
    
    const response = await updateSession(request)
    response.cookies.set('referral_business_id', refBusinessId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days (First Touch Attribution)
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    console.log(`[Middleware] ✅ Referral cookie set for business: ${refBusinessId}`)
    console.log(`[Middleware] 🕐 Cookie expires in 30 days`)
    return response
  }

  // Skip middleware for auth callback and role selection routes
  if (request.nextUrl.pathname.startsWith("/auth/callback") || 
      request.nextUrl.pathname.startsWith("/auth/role-selection")) {
    return
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (OAuth callback)
     * - auth/role-selection (Role selection wizard)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth/callback|auth/role-selection).*)",
  ],
}