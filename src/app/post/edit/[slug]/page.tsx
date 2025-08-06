// File: src/app/post/edit/[slug]/page.tsx
import path from "path";
import fs from "fs";
import { notFound, redirect } from "next/navigation";
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
  const filePath = path.join(process.cwd(), "src/content/posts", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const mdxSource = fs.readFileSync(filePath, "utf8");
  // const mdxModule = await import("@/content/pages/edit.mdx");
  // const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full editor-theme bg-[var(--editor-background)]">
      {/* -128px for header+footer; adjust as needed */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="">
          {/* <MdxContent /> */}
          {/* <ProductionModeAlert /> */}
          {/* <h1 className="text-xl font-bold mb-2">
            Editing: <span className="text-blue-400">{slug}</span>
          </h1> */}
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <MonacoMDXEditor slug={slug} mode="edit" initialCode={mdxSource} />
        </div>
      </div>
    </div>
  );
}
