type RateLimitEntry = {
  count: number
  firstRequestAt: number
}

const requestBuckets = new Map<string, RateLimitEntry>()

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

export function isRateLimited(options: {
  bucketKey: string
  limit: number
  windowMs: number
}): boolean {
  const now = Date.now()
  const existing = requestBuckets.get(options.bucketKey)

  if (!existing || now - existing.firstRequestAt > options.windowMs) {
    requestBuckets.set(options.bucketKey, {
      count: 1,
      firstRequestAt: now,
    })
    return false
  }

  existing.count += 1
  requestBuckets.set(options.bucketKey, existing)

  return existing.count > options.limit
}
