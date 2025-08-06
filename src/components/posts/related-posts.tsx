import React from "react";
import Link from "next/link";
import { getRelatedPostTitles } from "@/app/actions/posts/getRelatedPostTitles";

type RelatedPostsListProps = {
  relatedSlugs: string[] | null;
  postType: string;
};

const RelatedPostsList = async ({
  relatedSlugs,
  postType,
}: RelatedPostsListProps) => {
  if (!relatedSlugs || relatedSlugs.length === 0) {
    console.log("no related posts");
    return null;
  }

  // Fetch the related post titles on the server side
  const relatedPosts = await getRelatedPostTitles(relatedSlugs);

  if (!relatedPosts || relatedPosts.length === 0) {
    console.log("no related posts found");
    return null;
  }

  return (
    <div className="mt-8">
      <hr className="pb-8" />
      <h3 className="text-2xl font-bold mb-4">Related Posts</h3>
      <ul>
        {relatedPosts.map((post) => (
          <li key={post?.slug} className="mb-2">
            <Link
              href={`/${postType}/${post?.slug}`}
              passHref
              className="hover:underline text-accent"
            >
              {post?.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedPostsList;
