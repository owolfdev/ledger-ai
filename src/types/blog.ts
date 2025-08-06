// src/types/blog.ts

export type CachedBlogPost = {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  description?: string;
  categories: string[];
  tags: string[];
  image?: string | null;
  draft?: boolean;
  relatedPosts?: string[];
  link?: string | null;
  likes?: number;
  type: "project" | "blog";
  summary?: string;
};

// src/types/post-metadata.ts
export type BlogPostMetadata = {
  id: string;
  title: string;
  author: string;
  publishDate: string; // ISO format
  modifiedDate?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  draft?: boolean;
  image?: string | null;
  relatedPosts?: string[];
  type: "blog" | string;
  link?: string | null;
};
