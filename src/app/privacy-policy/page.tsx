// app/privacy/page.tsx
import SmartTerminal from "@/components/terminal/smart-terminal";

export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/privacy.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Privacy Policy",
    description: metadata?.description || "Privacy policy for OWolf.com",
  };
}

export default async function Privacy() {
  const mdxModule = await import("@/content/pages/privacy.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_privacy"
            commandSet="privacy"
            contextKey="pages/privacy"
          />
        </div>
      </div>
    </div>
  );
}
