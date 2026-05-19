import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Cliente con service_role para operaciones server-side que bypasean RLS.
// Solo usar en API routes de servidor — nunca exponer al cliente.
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
