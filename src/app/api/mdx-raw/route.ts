// src/app/api/mdx-raw/route.ts

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const ALLOWED_ROOTS = ["pages", "posts"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentPath = searchParams.get("contentPath");
  if (!contentPath)
    return new NextResponse("Missing contentPath", { status: 400 });

  // Only allow "pages/..." or "posts/..."
  const parts = contentPath.split("/");
  if (parts.length < 2 || !ALLOWED_ROOTS.includes(parts[0])) {
    console.log("[MDX-RAW] Invalid path:", contentPath);
    return new NextResponse("Invalid path", { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "src/content",
    `${contentPath}.mdx`
  );
  if (!fs.existsSync(filePath)) {
    console.log("[MDX-RAW] Not found:", filePath);
    return new NextResponse("Not found", { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf8");
  // Log the file path and preview of content for debug (never log full in prod)
  console.log(
    "[MDX-RAW] Serving:",
    filePath,
    "Preview:",
    content.slice(0, 100)
  );

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
