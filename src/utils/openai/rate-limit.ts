// src/utils/openai/rate-limit.ts

// A simple in-memory store, use Redis/Upstash in production!
const rateLimitStore: Record<string, { count: number; reset: number }> = {};

export async function rateLimitByIpOrUser(
  key: string,
  limit: number,
  windowSeconds: number
) {
  const now = Date.now();
  const entry = rateLimitStore[key];
  if (!entry || entry.reset < now) {
    rateLimitStore[key] = { count: 1, reset: now + windowSeconds * 1000 };
    return { allowed: true };
  }
  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true };
  }
  return { allowed: false };
}
