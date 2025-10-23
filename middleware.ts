import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Capture referral code from URL parameters
  const refCode = request.nextUrl.searchParams.get('ref')
  
  // If there's a referral code, store it in a cookie
  if (refCode) {
    const response = NextResponse.next()
    response.cookies.set('affiliate_referral_code', refCode, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax',
      path: '/',
    })
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