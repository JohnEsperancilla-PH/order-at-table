import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missingRequiredEnv = requiredEnv.filter((key) => !process.env[key])

  return NextResponse.json(
    {
      status: missingRequiredEnv.length === 0 ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        requiredEnv: missingRequiredEnv.length === 0,
      },
      missingRequiredEnv,
    },
    {
      status: missingRequiredEnv.length === 0 ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
