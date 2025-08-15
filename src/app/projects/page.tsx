import SmartTerminal from "@/components/terminal/smart-terminal";

export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/projects.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Projects",
    description: metadata?.description || "OWolf projects and portfolio",
  };
}

export default async function ProjectsPage() {
  const mdxModule = await import("@/content/pages/projects.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4 pb-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_projects"
            commandSet="projects"
            contextKey="pages/projects"
            postType="project" // 👈 add this
          />
        </div>
      </div>
    </div>
  );
}
