//src/app/api/ai-usage/route.ts
import { NextRequest } from "next/server";
import { getClientIp } from "@/utils/openai/get-client-ip";
import { redis } from "@/utils/rate-limit-redis"; // Or wherever your Redis client is exported from

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limitKey = `ip:${ip}`;
  const value = await redis.get(limitKey); // Should be the count, or null if unused
  return new Response(JSON.stringify({ count: Number(value) || 0 }), {
    headers: { "Content-Type": "application/json" },
  });
}
