import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect them to their dashboard
  if (user) {
    // Check if user is accessing the root path or auth pages
    if (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/auth")) {
      // Get user role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile) {
        // Redirect to appropriate dashboard based on role
        const url = request.nextUrl.clone()
        switch (profile.role) {
          case "customer":
            url.pathname = "/dashboard/customer"
            return NextResponse.redirect(url)
          case "business":
            url.pathname = "/dashboard/business"
            return NextResponse.redirect(url)
          case "influencer":
            url.pathname = "/dashboard/influencer"
            return NextResponse.redirect(url)
          default:
            // If no role found, redirect to customer dashboard as default
            url.pathname = "/dashboard/customer"
            return NextResponse.redirect(url)
        }
      }
    }
  }

  const publicRoutes = ["/", "/auth", "/business"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Redirect unauthenticated users to login (except for public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}