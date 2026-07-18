import { NextRequest } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single-instance MVP deployment; swap for Redis/Upstash when scaling out.
 */
const buckets = new Map<string, number[]>();

const MAX_BUCKETS = 10_000;

function prune(now: number, windowMs: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || now - hits[hits.length - 1] > windowMs) buckets.delete(key);
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key    unique key, e.g. `inquiry:${ip}` or `review:${userId}`
 * @param limit  max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now, windowMs);
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.ceil((hits[0] + windowMs - now) / 1000);
    buckets.set(key, hits);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Test hook — clears all rate-limit state. */
export function resetRateLimits() {
  buckets.clear();
}

// Preset limits used across the app
export const LIMITS = {
  inquiry:  { limit: 5,  windowMs: 10 * 60_000 },  // 5 per 10 min per IP
  review:   { limit: 5,  windowMs: 60 * 60_000 },  // 5 per hour per user
  question: { limit: 10, windowMs: 60 * 60_000 },
  signup:   { limit: 5,  windowMs: 60 * 60_000 },  // 5 per hour per IP
  rsvp:     { limit: 3,  windowMs: 10 * 60_000 },
  report:   { limit: 10, windowMs: 60 * 60_000 },
  stamp:    { limit: 10, windowMs: 60 * 60_000 },
} as const;
