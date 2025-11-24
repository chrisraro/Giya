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
        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile && !profileError) {
          // If user is a business, check their approval status before allowing dashboard access
          if (profile.role === "business") {
            // Query the businesses table to check approval status
            const { data: businessProfile, error: businessError } = await supabase
              .from("businesses")
              .select("approval_status, is_active, can_access_dashboard")
              .eq("id", user.id)
              .single()
            
            if (businessProfile && !businessError) {
              // If business is not approved or not allowed to access dashboard
              if (businessProfile.approval_status !== "approved" || !businessProfile.can_access_dashboard) {
                // Redirect to pending approval page if they try to access dashboard
                if (request.nextUrl.pathname.startsWith("/dashboard/business")) {
                  const url = request.nextUrl.clone()
                  url.pathname = "/auth/pending-approval"
                  return NextResponse.redirect(url)
                }
              }
            }
          }

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
              // Influencer feature temporarily disabled - redirect to homepage
              url.pathname = "/"
              return NextResponse.redirect(url)
            default:
              // If no role found, redirect to customer dashboard as default
              url.pathname = "/dashboard/customer"
              return NextResponse.redirect(url)
          }
        } else {
          // If profile doesn't exist or there's an error, check user_metadata for role
          // This handles cases where the profile hasn't been created yet
          const userRole = user.user_metadata?.role
          
          if (userRole) {
            // Redirect to appropriate setup page based on role in user_metadata
            const url = request.nextUrl.clone()
            switch (userRole) {
              case "customer":
                url.pathname = "/auth/setup/customer"
                return NextResponse.redirect(url)
              case "business":
                url.pathname = "/auth/setup/business"
                return NextResponse.redirect(url)
              case "influencer":
                // Influencer feature temporarily disabled - redirect to homepage
                url.pathname = "/"
                return NextResponse.redirect(url)
              default:
                // If no role found, redirect to role selection
                url.pathname = "/auth/role-selection"
                return NextResponse.redirect(url)
            }
          } else {
            // If no role in user_metadata either, redirect to role selection
            const url = request.nextUrl.clone()
            url.pathname = "/auth/role-selection"
            return NextResponse.redirect(url)
          }
        }
      }
    } catch (error) {
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
      // If there's an error checking auth, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}