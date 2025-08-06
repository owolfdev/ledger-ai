// src/app/projects/[slug]/page.tsx
import { notFound } from "next/navigation";
import HyphenatedTitle from "@/components/typography/hyphenated-title/ht";
import BlogLayoutWrapper from "@/components/blog/blog-layout-wrapper"; // or ProjectLayoutWrapper if you have one
import SmartTerminal from "@/components/terminal/smart-terminal";
import fs from "fs";
import path from "path";

// If you have ProjectPostMetadata, use it; else, keep BlogPostMetadata
import type { BlogPostMetadata } from "@/types/post-metadata";

async function loadMdxFile(slug: string) {
  try {
    const mdxPath = path.join(
      process.cwd(),
      "src",
      "content",
      "posts",
      `${slug}.mdx`
    );
    if (!fs.existsSync(mdxPath)) {
      return null;
    }

    const mdxModule = await import(`@/content/posts/${slug}.mdx`);
    return mdxModule;
  } catch (error) {
    console.error("Failed to load MDX file:", error);
    return null;
  }
}

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), "src", "content", "posts");
  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".mdx"));

  return files.map((file) => ({
    slug: file.replace(/\.mdx$/, ""),
  }));
}

export default async function ProjectPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mdxModule = await loadMdxFile(slug);

  if (!mdxModule) {
    notFound();
  }

  const MdxContent = mdxModule.default;
  const metadata: BlogPostMetadata = mdxModule.metadata;

  return (
    <BlogLayoutWrapper>
      <div className="pb-4">
        {metadata && (
          <div className="mb-6">
            <div className="text-primary font-semibold text-lg pb-2">
              {metadata.categories?.map((category: string, idx: number) => (
                <span key={category} className="mr-2">
                  {category}
                  {idx < (metadata.categories?.length ?? 0) - 1 && ","}
                </span>
              ))}
            </div>
            <HyphenatedTitle title={metadata.title} />
            <p className="text-muted-foreground pt-2">
              {metadata.publishDate &&
                new Date(metadata.publishDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </p>
            <p className="pt-0 text-muted-foreground">{metadata.author}</p>
          </div>
        )}
        <MdxContent />
      </div>
      <SmartTerminal
        storageKey={`terminal_key_project_${slug}`}
        commandSet="post" // or "project" if you have a set
        contextKey={`posts/${slug}`}
        currentSlug={slug}
      />
      {/* Add your LikeButton or similar if you want */}
    </BlogLayoutWrapper>
  );
}
