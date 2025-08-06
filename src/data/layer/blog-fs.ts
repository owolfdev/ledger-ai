// src/data/layer/blog-fs.ts
import { readFileSync } from "fs";
import { join } from "path";
import type { CachedBlogPost } from "@/types/blog";

export function getPublishedPosts(): CachedBlogPost[] {
  const filePath = join(process.cwd(), "public/cache/published-posts.json");
  const raw = readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as CachedBlogPost[];
  return data.filter((post) => !post.draft);
}
