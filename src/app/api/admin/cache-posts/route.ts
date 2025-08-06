// src/app/api/admin/cache-posts/route.ts
import { NextResponse } from "next/server";
import { generatePostsCache } from "@/lib/cache/generate-cache-posts";

export async function POST() {
  try {
    await generatePostsCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
