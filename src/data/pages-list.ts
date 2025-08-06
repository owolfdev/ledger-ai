// src/data/pages-list.ts
import { getPublishedPosts } from "@/data/layer/blog";

export const staticPages = [
  { title: "Home", slug: "home", route: "/" },
  { title: "About", slug: "about", route: "/about" },
  { title: "Contact", slug: "contact", route: "/contact" },
  { title: "Blog", slug: "blog", route: "/blog" },
  { title: "Privacy", slug: "privacy", route: "/privacy" },
  { title: "Sign In", slug: "login", route: "/auth/login" },
  { title: "Sign Up", slug: "sign-up", route: "/auth/sign-up" },
  { title: "Projects", slug: "projects", route: "/projects" },
  { title: "Create", slug: "create", route: "/create" },
  { title: "Post", slug: "post", route: "/post" },
  // Add others as needed
];

export async function buildPagesList() {
  // Static pages

  // Blog posts (dynamic)
  const posts = await getPublishedPosts();
  const blogPages = posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    route: `/blog/${p.slug}`,
  }));

  return [...staticPages, ...blogPages];
}
