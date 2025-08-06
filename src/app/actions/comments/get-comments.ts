"use server";

import { createClient } from "@/utils/supabase/server";
import type { Comment } from "@/types/comment";

export async function getCommentsForPost(slug: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owolf_blog_comments")
    .select("*")
    .eq("post_slug", slug)
    .order("created_at", { ascending: true });

  if (!data || error) {
    console.error("Failed to fetch comments:", error?.message);
    return [];
  }
  return data.map((c) => ({
    id: c.id,
    postSlug: c.post_slug,
    authorName: c.author_name,
    content: c.content,
    repliedToId: c.replied_to_id,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    approved: c.is_approved,
  }));
}
