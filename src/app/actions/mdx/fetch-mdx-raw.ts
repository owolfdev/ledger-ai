//src/app/actions/mdx/fetch-mdx-raw.ts
"use server";
import fs from "fs";
import path from "path";

export async function fetchMdxRawSource(contextKey: string): Promise<string> {
  // Map contextKey to file path
  const mdxPath = path.join(
    process.cwd(),
    "src/content/pages",
    `${contextKey}.mdx`
  );
  if (!fs.existsSync(mdxPath)) return "";
  return fs.readFileSync(mdxPath, "utf8");
}
