// src/commands/utils.ts

export type CommandContent =
  | string
  | ((arg?: string) => string | Promise<string>);

export type CommandMeta = {
  content: CommandContent;
  description?: string;
};

export function generateHelp({
  shared,
  page,
}: {
  shared: Record<string, CommandMeta>;
  page: Record<string, CommandMeta>;
}): string {
  const formatSection = (
    group: Record<string, CommandMeta>,
    label: string
  ): string => {
    const entries = Object.entries(group)
      .filter(([cmd]) => cmd !== "help")
      .map(
        ([cmd, meta]) => `**${cmd}** - ${meta.description ?? "No description"}`
      );
    return entries.length ? `### ${label}\n\n${entries.join("  \n")}` : "";
  };

  const sharedSection = formatSection(shared, "Shared Commands");
  const pageSection = formatSection(page, "Page-Specific Commands");

  return [pageSection, sharedSection].filter(Boolean).join("\n\n");
}
