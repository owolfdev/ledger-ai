// src/data/layer/blog.ts

import type { CachedBlogPost } from "@/types/blog";

export async function getPublishedPosts(): Promise<CachedBlogPost[]> {
  const isServer = typeof window === "undefined";

  const url = isServer
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/cache/published-posts.json` // full URL on server
    : "/cache/published-posts.json"; // relative URL on client

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load blog posts");

  const data: CachedBlogPost[] = await res.json();
  return data.filter((post) => !post.draft);
}
