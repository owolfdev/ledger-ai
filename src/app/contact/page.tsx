// app/contact/page.tsx
// import SmartTerminal from "@/components/terminal/smart-terminal";
import ContactForm from "@/components/contact/contact-form";

// Optionally: for SEO metadata
export async function generateMetadata() {
  const mdxModule = (await import("@/content/pages/contact.mdx")) as {
    default: React.ComponentType;
    metadata?: { title?: string; description?: string; [key: string]: unknown };
  };
  const { metadata } = mdxModule;
  return {
    title: metadata?.title || "Contact OWolf",
    description: metadata?.description || "Get in touch with OWolf.",
  };
}

export default async function Contact() {
  // Import MDX as component for static rendering (SEO and page content)
  const mdxModule = await import("@/content/pages/contact.mdx");
  const MdxContent = mdxModule.default;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4">
          <MdxContent />
        </div>
        <div className="px-4 pb-4">
          <ContactForm />
        </div>
        {/* <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_contact"
            commandSet="contact"
            contextKey="pages/contact"
          />
        </div> */}
      </div>
    </div>
  );
}
