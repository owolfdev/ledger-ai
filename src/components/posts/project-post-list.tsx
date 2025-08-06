import Link from "next/link";

interface BlogPost {
  slug: string;
  type: string;
  date: string;
  title: string;
  description: string;
  image: string;
  author: string;
  tags: string[];
  formattedDate?: string;
  likes?: number; // Change to allow undefined
  link: string;
}

interface BlogPostListProps {
  blogs: BlogPost[];
  trimDescription: (description: string) => string;
  postType: string;
}

const ProjectPostList = ({
  blogs,
  trimDescription,
  postType,
}: BlogPostListProps) => {
  return (
    <ul className="flex flex-col gap-8">
      {blogs.map((blog) => (
        <li key={blog.slug} className="border-none sm:border rounded-lg py-4 ">
          {/* <div>{JSON.stringify(blog)}</div> */}
          <Link href={`${blog.link}`} target="_blank">
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-4xl sm:text-5xl font-jokker">
                {blog.title}
              </h3>
              <p className="font-light">{trimDescription(blog.description)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ProjectPostList;
