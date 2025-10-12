import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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