import { createServerClient, type CookieOptions } from "@supabase/ssr"
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

  // Only attempt to get user data for authenticated routes
  // This avoids the Node.js API issues in Edge Runtime for static generation
  const publicRoutes = ["/", "/auth", "/business"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  
  if (!isPublicRoute) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If user is authenticated, redirect them to their dashboard
      if (user && (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/auth"))) {
        console.log("[Middleware] User authenticated:", user.id);
        
        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        console.log("[Middleware] Profile query result:", { profile, profileError });

        if (profile && !profileError) {
          // Redirect to appropriate dashboard based on role
          const url = request.nextUrl.clone()
          console.log("[Middleware] Redirecting user with role:", profile.role);
          switch (profile.role) {
            case "customer":
              url.pathname = "/dashboard/customer"
              console.log("[Middleware] Redirecting to customer dashboard");
              return NextResponse.redirect(url)
            case "business":
              url.pathname = "/dashboard/business"
              console.log("[Middleware] Redirecting to business dashboard");
              return NextResponse.redirect(url)
            case "influencer":
              // Influencer feature temporarily disabled - redirect to homepage
              url.pathname = "/"
              console.log("[Middleware] Influencer feature disabled, redirecting to homepage");
              return NextResponse.redirect(url)
            default:
              // If no role found, redirect to customer dashboard as default
              console.log("[Middleware] Unknown role, redirecting to customer dashboard");
              url.pathname = "/dashboard/customer"
              return NextResponse.redirect(url)
          }
        } else {
          console.log("[Middleware] No profile found or error occurred, checking user_metadata");
          // If profile doesn't exist or there's an error, check user_metadata for role
          // This handles cases where the profile hasn't been created yet
          const userRole = user.user_metadata?.role
          
          if (userRole) {
            console.log("[Middleware] Found role in user_metadata:", userRole);
            // Redirect to appropriate setup page based on role in user_metadata
            const url = request.nextUrl.clone()
            switch (userRole) {
              case "customer":
                url.pathname = "/auth/setup/customer"
                console.log("[Middleware] Redirecting to customer setup");
                return NextResponse.redirect(url)
              case "business":
                url.pathname = "/auth/setup/business"
                console.log("[Middleware] Redirecting to business setup");
                return NextResponse.redirect(url)
              case "influencer":
                // Influencer feature temporarily disabled - redirect to homepage
                url.pathname = "/"
                console.log("[Middleware] Influencer feature disabled, redirecting to homepage");
                return NextResponse.redirect(url)
              default:
                // If no role found, redirect to role selection
                console.log("[Middleware] Unknown role in user_metadata, redirecting to role selection");
                url.pathname = "/auth/role-selection"
                return NextResponse.redirect(url)
            }
          } else {
            console.log("[Middleware] No role in user_metadata, redirecting to role selection");
            // If no role in user_metadata either, redirect to role selection
            const url = request.nextUrl.clone()
            url.pathname = "/auth/role-selection"
            return NextResponse.redirect(url)
          }
        }
      }
    } catch (error) {
      console.log("[Middleware] Error getting user:", error);
      // Continue with normal flow if there's an error
    }
  }

  // Redirect unauthenticated users to login (except for public routes)
  if (!isPublicRoute) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.log("[Middleware] Error checking auth status:", error);
      // If there's an error checking auth, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}