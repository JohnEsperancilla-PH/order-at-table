import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/orders/verify/route'

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/orders/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/orders/verify', () => {
  it('returns 415 when Content-Type is not JSON', async () => {
    const req = new Request('http://localhost/api/orders/verify', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(415)
  })

  it('returns 400 when confirmation code is missing', async () => {
    const res = await POST(jsonRequest({ restaurantSlug: 'acme', tableNumber: '1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/required/i)
  })

  it('returns 400 for invalid confirmation code format', async () => {
    const res = await POST(jsonRequest({ confirmationCode: '!!!' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid restaurant slug', async () => {
    const res = await POST(
      jsonRequest({
        confirmationCode: 'ABCD12',
        restaurantSlug: 'Not_Valid!',
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when table number is too long', async () => {
    const res = await POST(
      jsonRequest({
        confirmationCode: 'ABCD12',
        tableNumber: 'x'.repeat(21),
      })
    )
    expect(res.status).toBe(400)
  })
})
