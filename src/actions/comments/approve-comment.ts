// src/actions/comments/approve-comment.ts
"use server";

import { createClient } from "@/utils/supabase/server";

export async function approveComment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("owolf_blog_comments")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
