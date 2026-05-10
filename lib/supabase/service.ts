import { createClient } from '@supabase/supabase-js'

/** Decode JWT payload `role` without verifying signature (caller already trusts env). */
function readJwtRole(jwt: string): string | undefined {
  const parts = jwt.trim().split('.')
  if (parts.length !== 3) return undefined
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    const raw =
      typeof Buffer !== 'undefined'
        ? Buffer.from(b64, 'base64').toString('utf8')
        : atob(b64)
    const json = JSON.parse(raw) as { role?: string }
    return json.role
  } catch {
    return undefined
  }
}

/**
 * Database access with privileges that bypass RLS. Server-only — never import from client components.
 *
 * Required when RLS is enabled on tables: anon/authenticated have no policies, so the Next.js server
 * must use this for all `.from(...)` reads/writes performed by Server Actions and Route Handlers.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (required when RLS is enabled)'
    )
  }

  const role = readJwtRole(serviceKey)
  if (role && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is incorrect: JWT "role" is "${role}" but must be "service_role". You likely pasted the anon key — use Settings → API → service_role secret in Supabase.`
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
