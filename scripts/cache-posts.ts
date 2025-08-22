#!/usr/bin/env tsx
// scripts/cache-posts.ts

import { generatePostsCache } from "../src/lib/cache/generate-cache-posts";

(async () => {
  try {
    // console.log("Generating posts cache...");
    await generatePostsCache();
          // console.log("✅ Posts cache generated successfully.");
  } catch (err) {
    console.error("❌ Failed to generate posts cache:", err);
    process.exit(1);
  }
})();
