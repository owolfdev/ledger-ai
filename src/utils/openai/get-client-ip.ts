// utils/get-client-ip.ts
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // Next.js Edge: req.ip is available, Node.js may not
  // @ts-expect-error req.ip exists in Next.js Edge but not in Node.js types
  if (req.ip) return req.ip;
  return "unknown";
}
