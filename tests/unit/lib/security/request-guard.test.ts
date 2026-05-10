import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getClientIp, isRateLimited } from '@/lib/security/request-guard'

describe('getClientIp', () => {
  it('prefers first address from x-forwarded-for', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '203.0.113.1, 198.51.100.2')
    expect(getClientIp(headers)).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers()
    headers.set('x-real-ip', '198.51.100.9')
    expect(getClientIp(headers)).toBe('198.51.100.9')
  })

  it('returns unknown when no proxy headers', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})

describe('isRateLimited', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within limit inside window', () => {
    const key = `rl-test-${Math.random()}`
    expect(isRateLimited({ bucketKey: key, limit: 3, windowMs: 60_000 })).toBe(false)
    expect(isRateLimited({ bucketKey: key, limit: 3, windowMs: 60_000 })).toBe(false)
    expect(isRateLimited({ bucketKey: key, limit: 3, windowMs: 60_000 })).toBe(false)
    expect(isRateLimited({ bucketKey: key, limit: 3, windowMs: 60_000 })).toBe(true)
  })

  it('resets bucket after window expires', () => {
    const key = `rl-window-${Math.random()}`
    expect(isRateLimited({ bucketKey: key, limit: 1, windowMs: 1_000 })).toBe(false)
    expect(isRateLimited({ bucketKey: key, limit: 1, windowMs: 1_000 })).toBe(true)

    vi.advanceTimersByTime(1_001)

    expect(isRateLimited({ bucketKey: key, limit: 1, windowMs: 1_000 })).toBe(false)
  })
})
