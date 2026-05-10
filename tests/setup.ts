import '@testing-library/jest-dom/vitest'
import { beforeAll } from 'vitest'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'vitest-placeholder-service-role-key'
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'vitest-placeholder-anon-key'
})
