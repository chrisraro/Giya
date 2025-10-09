# Authenticated User Redirects

This document outlines the implementation of automatic redirects for authenticated users to their respective dashboards.

## Overview

When users are already logged in, they will be automatically redirected to their role-specific dashboard instead of seeing the landing page or authentication pages. This improves user experience by eliminating confusion and providing direct access to their account.

## Implementation Details

### 1. Middleware Redirects (`lib/supabase/middleware.ts`)

The middleware now checks if a user is authenticated when they access:
- The root path (`/`)
- Any authentication pages (`/auth/*`)

If authenticated, the user is redirected to their role-specific dashboard:
- Customers → `/dashboard/customer`
- Businesses → `/dashboard/business`
- Influencers → `/dashboard/influencer`

### 2. Server-Side Redirects (`app/page.tsx`)

The root page now includes server-side logic to check authentication status and redirect users before rendering the landing page content.

### 3. Client-Side Redirects (Existing)

Authentication pages already include client-side useEffect hooks that check authentication status and redirect users appropriately.

## Redirect Logic Flow

1. **Middleware Check** (Server-side, runs on every request):
   - Checks if user is authenticated
   - If accessing root or auth pages and authenticated, redirects to dashboard
   - If not authenticated and accessing protected pages, redirects to login

2. **Page Component Check** (Server-side, runs on page load):
   - Root page checks authentication status
   - Redirects authenticated users to appropriate dashboard

3. **Client-Side Check** (Runs in browser):
   - Authentication pages check authentication status
   - Redirects authenticated users to appropriate dashboard

## Benefits

1. **Improved User Experience**: Authenticated users go directly to their dashboard
2. **Reduced Confusion**: No duplicate content between landing page and dashboard
3. **Better Navigation**: Consistent entry point for all user roles
4. **Performance**: Reduces unnecessary page rendering for authenticated users

## Files Modified

1. `lib/supabase/middleware.ts` - Added authentication checks and redirects
2. `app/page.tsx` - Added server-side authentication check and redirect
3. `app/auth/login/page.tsx` - Already had client-side redirect logic
4. `app/auth/signup/page.tsx` - Already had client-side redirect logic

## Testing

To verify the implementation works correctly:

1. Log in as a customer and visit the root URL (`/`) - should redirect to `/dashboard/customer`
2. Log in as a business and visit `/auth/login` - should redirect to `/dashboard/business`
3. Log in as an influencer and visit `/auth/signup` - should redirect to `/dashboard/influencer`
4. Log out and visit `/` - should show the landing page
5. Log out and visit `/auth/login` - should show the login page

## Role-Based Dashboard Mapping

| Role | Dashboard Path |
|------|----------------|
| Customer | `/dashboard/customer` |
| Business | `/dashboard/business` |
| Influencer | `/dashboard/influencer` |

If a user's role cannot be determined, they are redirected to the customer dashboard by default.