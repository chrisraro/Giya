import { createBrowserClient } from "@supabase/ssr"

// Use a factory function instead of a singleton to avoid issues with Edge Runtime
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}