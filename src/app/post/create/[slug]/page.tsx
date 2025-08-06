// File: src/app/post/create/[slug]/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import MonacoMDXEditor from "@/components/editor/monaco-mdx-editor";
// import ProductionModeAlert from "@/components/alerts/production-mode-alert";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { slug } = await params;
  // const mdxPath = path.join(process.cwd(), "src/content/posts", `${slug}.mdx`);
  // const filePath = path.join(process.cwd(), "src/content/posts", `${slug}.mdx`);

  // if (!fs.existsSync(filePath)) {
  //   notFound();
  // }

  // const mdxSource = fs.readFileSync(filePath, "utf8");
  // const mdxModule = await import("@/content/pages/create.mdx");
  // const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      {" "}
      {/* -128px for header+footer */}
      <div className="flex flex-col h-full min-h-screen w-full">
        <MonacoMDXEditor slug={slug} mode="create" />
      </div>
    </div>
  );
}
