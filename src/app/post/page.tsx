import SmartTerminal from "@/components/terminal/smart-terminal";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/post.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Create Post",
    description: metadata?.description || "Create a new post",
  };
}

export default async function PostPage() {
  // Auth check (server-side)
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Load MDX as a React component
  const mdxModule = await import("@/content/pages/post.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_post"
            commandSet="post"
            contextKey="pages/post"
          />
        </div>
      </div>
    </div>
  );
}
