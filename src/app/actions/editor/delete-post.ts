// File: src/app/actions/editor/delete-post.ts
"use server";

import fs from "fs/promises";
import path from "path";
import { generatePostsCache } from "@/lib/cache/generate-cache-posts"; // ✅ import cache generator

export async function deletePost(slug: string) {
  const filePath = path.join(process.cwd(), "src/content/posts", `${slug}.mdx`);
  await fs.unlink(filePath);
  await generatePostsCache(); // ✅ refresh cache after delete
}
