// src/app/protected/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SmartTerminal from "@/components/terminal/smart-terminal";

// Dynamically import MDX for SEO and content
export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/protected.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Protected Page",
    description: metadata?.description || "Protected page",
  };
}

export default async function ProtectedPage() {
  // Import MDX as content
  const mdxModule = await import("@/content/pages/protected.mdx");
  const MdxContent = mdxModule.default;

  // Supabase protected route check
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="flex flex-col gap-2 items-start w-full px-4 pb-8">
          <h2 className="font-bold text-2xl mb-4">Your user details</h2>
          <pre className="text-xs font-mono p-3 rounded border max-h-100 overflow-auto w-full">
            {JSON.stringify(data.claims, null, 2)}
          </pre>
        </div>
        <div className="px-4">
          <SmartTerminal
            storageKey="terminal_key_protected"
            commandSet="about"
            contextKey="pages/protected"
          />
        </div>
      </div>
    </div>
  );
}
