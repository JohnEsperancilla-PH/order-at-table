import { test, expect } from '@playwright/test'

/**
 * Request-only checks — run without installing browsers (`playwright install`).
 * Validates the dev/prod server wiring for API + middleware redirects.
 */
test.describe('API & redirects', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json).toMatchObject({
      status: 'ok',
      checks: { requiredEnv: true },
    })
    expect(json.missingRequiredEnv).toEqual([])
  })

  test('unauthenticated GET /admin redirects to login', async ({ request }) => {
    const res = await request.get('/admin', { maxRedirects: 0 })
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    const loc = res.headers()['location'] ?? ''
    expect(loc).toMatch(/\/admin\/login/)
  })

  test('unauthenticated GET /admin/dashboard redirects to login', async ({ request }) => {
    const res = await request.get('/admin/dashboard', { maxRedirects: 0 })
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect((res.headers()['location'] ?? '')).toMatch(/\/admin\/login/)
  })
})
