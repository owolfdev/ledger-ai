// lib/cache/generate-cache-posts.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { config } from "../config/config.js";
import { parseISO, startOfDay, format } from "date-fns";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Metadata {
  id: string;
  type: string;
  title: string;
  author: string;
  publishDate: string;
  description: string;
  categories: string[];
  tags: string[];
  modifiedDate: string;
  image: string | null;
  draft: boolean;
  relatedPosts: string[];
  link: string | null;
}

interface Post {
  slug: string;
  likes: number;
  [key: string]: unknown;
}

function extractMetadata(fileContents: string): Metadata | null {
  const match = fileContents.match(/export const metadata = ({[\s\S]*?});/);
  if (!match) return null;

  try {
    // biome-ignore lint/security/noGlobalEval: we trust local dev content
    return eval(`(${match[1]})`) as Metadata;
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return null;
  }
}

async function fetchLikesCount(postId: string): Promise<number> {
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

export async function generatePostsCache(): Promise<Post[]> {
  // console.log(
  //   "Generating posts cache from src/lib/cache/generate-cache-posts.ts..."
  // );

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

      let postDate: Date;
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

      const post: Post = {
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

  const publishedPosts: Post[] = [];
  const allPosts: Post[] = [];

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

if (import.meta.url === `file://${process.argv[1]}`) {
  generatePostsCache().catch((err) => {
    console.error("Error generating posts cache:", err);
    process.exit(1);
  });
}
