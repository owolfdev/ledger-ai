import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/lib/openai";

async function embedManualTest() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const testText =
    "Next.js 15 introduces a new file-system based routing API and improves server components significantly.";
  const embedding = await getEmbedding(testText);

  const { error } = await client
    .from("mdx_chunks")
    .update({ embedding })
    .eq("hash", "testhash-nextjs15");

  if (error) {
    console.error("❌ Failed to update embedding:", error);
  } else {
    // console.log("✅ Successfully updated embedding for manual test.");
  }
}

embedManualTest();
