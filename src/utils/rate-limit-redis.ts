// utils/rate-limit-redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Returns { allowed: boolean, count: number }
export async function rateLimitByIp(
  key: string,
  limit: number,
  windowSeconds: number
) {
  // Atomically increment and check count
  const count = await redis.incr(key);
  if (count === 1) {
    // Set expiry on first increment
    await redis.expire(key, windowSeconds);
  }
  return { allowed: count <= limit, count };
}
