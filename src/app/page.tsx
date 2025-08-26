// src/app/page.tsx
"use client";
import { useState, useEffect } from "react";
import SmartTerminal from "@/components/terminal/smart-terminal";

export default function Home() {
  const [terminalInput, setTerminalInput] = useState("");
  const [MdxContent, setMdxContent] = useState<React.ComponentType | null>(
    null
  );

  const handlePopulateInput = (cmd: string) => {
    console.log("Home page: Populating input with:", cmd);
    setTerminalInput(cmd);
  };

  // Dynamic import for MDX rendering
  useEffect(() => {
    import("@/content/pages/home.mdx").then((module) => {
      setMdxContent(() => module.default);
    });
  }, []);

  if (!MdxContent) {
    return <div>Loading...</div>;
  }

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
            onPopulateInput={handlePopulateInput}
          />
        </div>
      </div>
    </div>
  );
}
