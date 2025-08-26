// src/app/ledger/entries/page.tsx
"use client";
import { useState } from "react";
import SmartTerminal from "@/components/terminal/smart-terminal";

export default function Entries() {
  const [terminalInput, setTerminalInput] = useState("");

  const handlePopulateInput = (cmd: string) => {
    console.log("Entries page: Populating input with:", cmd);
    setTerminalInput(cmd);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pb-4"></div>
        <div className="px-4">
          <SmartTerminal
            storageKey="ledger_ai_terminal_key_entries"
            commandSet="home"
            contextKey="pages/home"
            onPopulateInput={handlePopulateInput}
          />
        </div>
      </div>
    </div>
  );
}
