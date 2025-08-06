// src/components/terminal/blog-terminal-client.tsx
"use client";

import TerminalWithRouting from "@/components/terminal/terminal-with-routing";
import { blogCommands } from "@/commands/_archive/blog-commands";
import { sharedCommands } from "@/commands/_archive/shared-commands";
import { sharedRoutes } from "@/data/routes";
import { useMemo } from "react";

const commands = {
  ...sharedCommands,
  ...blogCommands,
};

export default function BlogTerminalClient({
  welcome,
  pagesList,
}: {
  welcome: string;
  pagesList: { title: string; slug: string; route: string }[];
}) {
  // Build all routes: static + posts
  // (You *could* generate these at build time for perf!)
  const routes = useMemo(() => {
    const allRoutes: Record<string, string> = { ...sharedRoutes };
    for (const page of pagesList) {
      allRoutes[page.slug] = page.route;
    }
    return allRoutes;
  }, [pagesList]);

  return (
    <TerminalWithRouting
      storageKey="terminal_key_blog"
      commands={commands}
      routes={routes}
      welcome={welcome}
      pagesList={pagesList}
    />
  );
}
