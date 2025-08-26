// src/components/terminal/smart-terminal.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Terminal from "./terminal";
import type { TerminalProps } from "./terminal";
import { sharedRoutes } from "@/data/routes";
import { buildPagesList } from "@/data/pages-list";
import { getCommandSet, CommandMeta } from "@/commands/smart/utils";
import { commandRegistry } from "@/commands/smart/registry";
import { createHandleCommand } from "@/commands/smart/handle-command";
import TerminalLoading from "./terminal-loading";
import { useTerminalScrollKeys } from "@/hooks/use-terminal-scroll-keys";
import { globalCommandKeys } from "@/commands/smart/sets/global";
import { adminCommandKeys } from "@/commands/smart/sets/admin";
import { getCurrentUser } from "@/utils/supabase/get-user";
import { User } from "@/types/user";

const pageSetsMap: Record<string, () => Promise<{ default: string[] }>> = {
  about: () =>
    import("@/commands/smart/sets/about").then((mod) => ({
      default: mod.aboutCommandKeys,
    })),
  blog: () =>
    import("@/commands/smart/sets/blog").then((mod) => ({
      default: mod.blogCommandKeys,
    })),
  home: () =>
    import("@/commands/smart/sets/home").then((mod) => ({
      default: mod.homeCommandKeys,
    })),
  contact: () =>
    import("@/commands/smart/sets/contact").then((mod) => ({
      default: mod.contactCommandKeys,
    })),
  post: () =>
    import("@/commands/smart/sets/post").then((mod) => ({
      default: mod.postCommandKeys,
    })),
  privacy: () =>
    import("@/commands/smart/sets/privacy").then((mod) => ({
      default: mod.privacyCommandKeys,
    })),
  projects: () =>
    import("@/commands/smart/sets/projects").then((mod) => ({
      default: mod.projectsCommandKeys,
    })),
};

type PageEntry = { title: string; slug: string; route: string };

type SmartTerminalProps = Omit<
  TerminalProps,
  "onCommand" | "commands" | "pageContext" | "routes" | "pagesList"
> & {
  commandSet: keyof typeof pageSetsMap;
  contextKey: string;
  currentSlug?: string;
  postType?: "blog" | "project";
  onPopulateInput?: (cmd: string) => void; // ✅ ADD THIS LINE
};

export default function SmartTerminal({
  commandSet,
  contextKey,
  currentSlug,
  postType,
  onPopulateInput, // ✅ ADD THIS PARAMETER
  ...rest
}: SmartTerminalProps) {
  const [commands, setCommands] = useState<Record<string, CommandMeta> | null>(
    null
  );
  const [pageContext, setPageContext] = useState<string | null>(null);
  const [pagesList, setPagesList] = useState<PageEntry[]>([]);
  const [user, setUser] = useState<User | null>(null); // Replace 'any' with your actual user type if needed
  const router = useRouter();
  // const pathname = usePathname();

  useTerminalScrollKeys(true);

  // Load user on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        const u = await getCurrentUser();
        if (!cancelled) setUser(u as User); // Type assertion to match expected User type
      } catch {
        if (!cancelled) setUser(null);
      }
    }
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load allowed commands for this page (re-run if user changes)
  useEffect(() => {
    let cancelled = false;
    async function loadSets() {
      let allKeys = [...globalCommandKeys];
      const importPageSet = pageSetsMap[commandSet];
      if (importPageSet) {
        const { default: pageKeys } = await importPageSet();
        allKeys = [...allKeys, ...pageKeys];
      }
      if (user) {
        allKeys = [...allKeys, ...adminCommandKeys];
      }
      allKeys = [...new Set(allKeys)];
      const cmds = getCommandSet(allKeys, commandRegistry);
      if (!cancelled) setCommands(cmds);
    }
    loadSets();
    return () => {
      cancelled = true;
    };
  }, [commandSet, user]);

  // Fetch raw MDX for context
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mdx-raw?contentPath=${contextKey}`)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        if (!cancelled) setPageContext(text);
      })
      .catch(() => {
        if (!cancelled) setPageContext("");
      });
    return () => {
      cancelled = true;
    };
  }, [contextKey]);

  useEffect(() => {
    buildPagesList().then(setPagesList);
  }, []);

  // Handler factory (main terminal handler)
  const handleCommand =
    commands && pageContext !== null
      ? createHandleCommand(
          commands,
          sharedRoutes,
          pageContext,
          pagesList,
          currentSlug,
          postType,
          onPopulateInput
        )
      : null;

  if (!commands || pageContext === null) {
    return (
      <div className="w-full flex pt-3">
        <TerminalLoading />
      </div>
    );
  }

  return (
    <Terminal
      {...rest}
      commands={commands}
      onCommand={(cmd, setHistory, history) =>
        handleCommand!(cmd, setHistory, router, user, history)
      }
      onPopulateInput={onPopulateInput} // ✅ ADD THIS LINE
    />
  );
}
