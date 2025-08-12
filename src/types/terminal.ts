// src/types/terminal.ts
export type TerminalOutput = {
  type: "output" | "error" | "input";
  content: string;
  format?: "plain" | "markdown" | "mdx";
};

export interface TerminalOutputRendererProps {
  type?: "input" | "output" | "error"; // Add "error" here to match TerminalOutput
  content: string;
  format?: "plain" | "markdown" | "mdx" | "component";
  className?: string;
  component?: string; // Component name for custom rendering
  props?: Record<string, unknown>; // Props to pass to the component
}
