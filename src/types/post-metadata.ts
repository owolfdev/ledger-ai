// src/types/post-metadata.ts

export type BlogPostMetadata = {
  id: string;
  type?: string; // "blog", "note", etc
  title: string;
  author: string;
  publishDate: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  modifiedDate?: string;
  image?: string | null;
  draft?: boolean;
  relatedPosts?: string[];
  link?: string | null;
};
