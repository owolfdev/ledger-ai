// src/app/page.tsx
import SmartTerminal from "@/components/terminal/smart-terminal";

// Optionally: If you want dynamic SEO meta for Home, add this:
export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/home.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Ledger AI",
    description:
      metadata?.description ||
      "Ledger AI a simple app that allows you to create and manage your ledger with the aid of artificial intelligence.",
  };
}

export default async function Home() {
  // Static import for MDX rendering (SEO, page content)
  const mdxModule = await import("@/content/pages/home.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_home"
            commandSet="home"
            contextKey="pages/home"
          />
        </div>
      </div>
    </div>
  );
}
