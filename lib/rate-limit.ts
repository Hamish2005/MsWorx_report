const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  bucket.count += 1;
  return {
    limited: bucket.count > MAX_REQUESTS,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000)
  };
}

