// src/app/blog/page.tsx

import SmartTerminal from "@/components/terminal/smart-terminal";

export default async function BlogPage() {
  const mdxModule = await import("@/content/pages/blog.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div></div>
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_blog"
            commandSet="blog"
            contextKey="pages/blog"
            postType="blog" // 👈 add this
          />
        </div>
      </div>
    </div>
  );
}
