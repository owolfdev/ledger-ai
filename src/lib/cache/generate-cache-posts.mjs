// lib/cache/generate-cache-posts.mjs
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { config } from "../config/config.js";
import { parseISO, startOfDay, format } from "date-fns";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function extractMetadata(fileContents) {
  const match = fileContents.match(/export const metadata = ({[\s\S]*?});/);
  if (!match) return null;
  try {
    // biome-ignore lint/security/noGlobalEval: local trusted dev content
    return eval(`(${match[1]})`);
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return null;
  }
}

async function fetchLikesCount(postId) {
  const { count, error } = await supabase
    .from(config.likesTable)
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    console.error(`Error fetching likes for postId ${postId}:`, error);
    return 0;
  }

  return count ?? 0;
}

export async function generatePostsCache() {
  console.log(
    "Generating posts cache from src/lib/cache/generate-cache-posts.mjs..."
  );

  const postsDirectory = path.join(process.cwd(), "src/content/posts");
  const files = fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("."));
  const currentDate = startOfDay(new Date());

  const results = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(postsDirectory, file);
      const contents = fs.readFileSync(fullPath, "utf8");
      const metadata = extractMetadata(contents);
      if (!metadata) return null;

      const slug = file.replace(/\.mdx$/, "");
      const likes = await fetchLikesCount(metadata.id);

      let postDate;
      try {
        metadata.publishDate = format(
          parseISO(metadata.publishDate),
          "yyyy-MM-dd"
        );
        postDate = startOfDay(parseISO(metadata.publishDate));
      } catch (err) {
        console.warn(`Invalid publishDate in ${file}:`, err);
        return null;
      }

      const post = {
        slug,
        ...metadata,
        likes,
      };

      return {
        post,
        isPublished: !metadata.draft && postDate <= currentDate,
      };
    })
  );

  const publishedPosts = [];
  const allPosts = [];

  for (const item of results) {
    if (item?.post) {
      allPosts.push(item.post);
      if (item.isPublished) publishedPosts.push(item.post);
    }
  }

  const cacheDir = path.join(process.cwd(), "public/cache");
  fs.writeFileSync(
    path.join(cacheDir, "all-posts.json"),
    JSON.stringify(allPosts, null, 2)
  );
  fs.writeFileSync(
    path.join(cacheDir, "published-posts.json"),
    JSON.stringify(publishedPosts, null, 2)
  );

  return publishedPosts;
}

// Run script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePostsCache().catch((err) => {
    console.error("Error generating posts cache:", err);
    process.exit(1);
  });
}
