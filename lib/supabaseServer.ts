/**
 * Server-side Supabase client for API routes
 * Uses service role key for server-side operations (bypasses RLS)
 * Falls back to anon key if service role key is not available
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Use service role key for server-side if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL is missing from environment variables")
  console.error("Please create a .env.local file in the project root with your Supabase credentials")
}

if (!supabaseKey) {
  console.error("ERROR: Both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing")
  console.error("Please set at least NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
}

// Create client with fallback empty strings if env vars are missing (will fail gracefully on API calls)
export const supabaseServer = createClient(
  supabaseUrl || '', 
  supabaseKey || '', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

