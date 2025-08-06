// src/components/terminal/terminal-reset-button.tsx

"use client";
import { Button } from "@/components/ui/button";
import type { TerminalOutputRendererProps } from "@/types/terminal";

type Props = {
  setHistory: null | React.Dispatch<
    React.SetStateAction<TerminalOutputRendererProps[]>
  >;
  newHistory?: TerminalOutputRendererProps[];
  label?: string;
};

export default function TerminalResetButton({
  setHistory,
  newHistory = [
    { type: "output", content: "👋 Terminal reset!", format: "markdown" },
    {
      type: "output",
      content: "Type `help` to see available commands.",
      format: "markdown",
    },
  ],
  label = "Reset Terminal",
}: Props) {
  return (
    <Button
      variant="outline"
      disabled={!setHistory}
      onClick={() => setHistory && setHistory([...newHistory])}
      className="mb-2"
    >
      {label}
    </Button>
  );
}
