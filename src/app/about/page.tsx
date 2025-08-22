//src/app/about/page.tsx
// import SmartTerminal from "@/components/terminal/smart-terminal";

// Dynamically import MDX and its metadata
export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/about.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "About OWolf",
    description: metadata?.description || "Learn more about OWolf",
  };
}

export default async function About() {
  // Import MDX for static rendering (SEO and page content)
  const mdxModule = await import("@/content/pages/about.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        {/* <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_about"
            commandSet="about"
            contextKey="pages/about"
          />
        </div> */}
      </div>
    </div>
  );
}
