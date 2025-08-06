// src/app/actions/editor/save-post.ts
"use server";

import fs from "fs/promises";
import path from "path";
import { generatePostsCache } from "@/lib/cache/generate-cache-posts";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // allow dashes!
    .trim()
    .replace(/\s+/g, "-") // spaces to dash
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim dashes
}

export async function savePost(slug: string, content: string) {
  const safeSlug = slugify(slug);
  const filePath = path.join(
    process.cwd(),
    "src/content/posts",
    `${safeSlug}.mdx`
  );
  try {
    await fs.writeFile(filePath, content, "utf-8");
    await generatePostsCache();
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      throw new Error("SAVE_UNSUPPORTED_ENV");
    }
    throw error;
  }
}
