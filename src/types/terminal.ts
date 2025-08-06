// src/types/terminal.ts

export type TerminalOutput = {
  type: "output" | "error" | "input";
  content: string;
  format?: "plain" | "markdown" | "mdx";
};

export type TerminalOutputRendererProps = TerminalOutput & {
  className?: string;
};
