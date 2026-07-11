type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const globalForRateLimit = globalThis as unknown as {
  vitmartRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets = globalForRateLimit.vitmartRateLimitBuckets || new Map<string, RateLimitBucket>();
globalForRateLimit.vitmartRateLimitBuckets = buckets;

function requestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
  return firstForwardedIp || request.headers.get("x-real-ip") || "local";
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 500) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  request: Request,
  action: string,
  identifier: string,
  options: RateLimitOptions
) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const safeIdentifier = identifier.replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 80) || "unknown";
  const key = `${action}:${requestIp(request)}:${safeIdentifier}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
