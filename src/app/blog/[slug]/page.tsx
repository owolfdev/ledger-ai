// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import HyphenatedTitle from "@/components/typography/hyphenated-title/ht";
import BlogLayoutWrapper from "@/components/blog/blog-layout-wrapper";
import fs from "fs";
import path from "path";
import SmartTerminal from "@/components/terminal/smart-terminal";
import LikeButton from "@/components/like/like-button";
import CommentSection from "@/components/comments/comment-section";
import { getCommentsForPost } from "@/app/actions/comments/get-comments";
import RelatedPostsList from "@/components/posts/related-posts";

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

export default async function BlogPostPage({
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
  const metadata = mdxModule.metadata;

  // Get initial comments via server action
  const comments = await getCommentsForPost(slug);

  return (
    <div>
      <BlogLayoutWrapper>
        <div className="pb-4">
          {metadata && (
            <div className="mb-6">
              <div className="text-primary font-semibold text-lg pb-2">
                {metadata.categories &&
                  metadata.categories.length > 0 &&
                  metadata.categories?.map((category: string, idx: number) => (
                    <span key={category} className="mr-2">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
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
        <div className="pt-6">
          <SmartTerminal
            storageKey={`terminal_key_blog_${slug}`}
            commandSet="post" // or "blog", depends on your sets
            contextKey={`posts/${slug}`} // THIS is the content path
            currentSlug={slug}
          />
        </div>
      </BlogLayoutWrapper>
      <RelatedPostsList relatedSlugs={metadata.relatedPosts} postType="blog" />
      <LikeButton postId={metadata.id} />
      <CommentSection postSlug={slug} initialComments={comments} />
    </div>
  );
}
