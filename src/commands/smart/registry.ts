// src/commands/smart/registry.ts

import type { CommandMeta } from "./utils";
import { globalCommandKeys } from "./sets/global";
import { adminCommandKeys } from "./sets/admin";
// import { getContactMessages } from "@/app/actions/contact/get-contact-messages";
import { User } from "@/types/user";
import { entriesListCommand } from "@/commands/smart/entries-command";

export const commandRegistry: Record<string, CommandMeta> = {
  // --- Basic/Navigation ---
  back: {
    content: "`back` - Go back to the previous page.",
    description: "Navigate to the previous page in your browser history.",
    usage: "back",
  },
  forward: {
    content: "`forward` - Go forward to the next page.",
    description: "Navigate forward in your browser history.",
    usage: "forward",
  },
  clear: {
    content: "`clear` - clear the terminal",
    description: "Clear the terminal history.",
    usage: "clear",
  },
  clearall: {
    content: "__RESET_HISTORY__",
    description: "Clear all terminal histories from local storage.",
    usage: "clearall",
  },
  go: {
    content: "`go <page>` - go to a page",
    description: "Navigate to a page by name or slug.",
    usage: "go <page-slug-or-name>",
  },
  nav: {
    content: `[**go blog** - go to blog](/blog)  
[**go about** - go to about](/about)  
[**go home** - go to home](/)   
[**go contact** - go to contact](/contact)   
[**go privacy** - go to privacy](/privacy)  
[**go post** - go to post](/post)`,
    description: "Show navigation menu.",
    usage: "nav",
  },
  pwd: {
    content: "",
    description: "Print working directory.",
    usage: "pwd",
  },
  top: {
    content: "__SCROLL_TOP__",
    description: "Scroll browser window to top.",
    usage: "top",
  },
  esc: {
    content: "`esc key` - scroll to the terminal input if hidden",
    description: "Scroll to terminal input.",
    usage: "esc",
  },

  // theme //
  // --- Theme Switch ---
  dark: {
    content: "Switch to dark mode.",
    description: "Change the site theme to dark mode.",
    usage: "dark",
  },
  light: {
    content: "Switch to light mode.",
    description: "Change the site theme to light mode.",
    usage: "light",
  },
  theme: {
    content: "`theme <mode>` - set the site theme (dark, light, or system).",
    description:
      "Set the theme. Usage: `theme dark`, `theme light`, or `theme system`.",
    usage: "theme <dark|light|system>",
  },

  // --- User/Auth ---
  user: {
    content: "__SHOW_USER__",
    description: "Show the current logged-in Supabase user.",
    usage: "user",
  },
  logout: {
    content: "__SUPABASE_LOGOUT__",
    description: "Sign out the current Supabase user.",
    usage: "logout",
  },

  // Ledger CLI

  entries: {
    description:
      "List and filter ledger entries with powerful search options. Supports business filtering, vendor search, date ranges, and counting.",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => entriesListCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `entries [limit] [date|created] [asc|desc] [options]
  
  **Basic Usage:**
  • \`entries\` — List 20 most recent entries
  • \`entries 50\` — List 50 most recent entries  
  • \`entries created asc\` — Sort by creation date, oldest first
  
  **Filtering Options:**
  • \`--business <name>\` — Filter by business (Personal, MyOnlineBusiness, etc.)
  • \`--vendor <name>\` — Filter by vendor/description (case-insensitive)
  • \`--month YYYY-MM\` — Filter by specific month
  • \`--count\` — Show count only, no entries listed
  • \`--sum\` — Show total amount at bottom
  
  **Examples:**
  • \`entries --business MyOnlineBusiness\` — All entries for specific business
  • \`entries --vendor Starbucks --month 2025-08\` — Starbucks purchases in August
  • \`entries --business Personal --count\` — Count personal entries
  • \`entries --month 2025-08 --sum\` — August entries with total
  • \`entries created desc 10 --business Channel60\` — Latest 10 Channel60 entries`,
  },
  ent: {
    description: "Alias for entries command with same functionality",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => entriesListCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ent [limit] [date|created] [asc|desc] [options]
  
  **Quick Examples:**
  • \`ent\` — Recent entries
  • \`ent count\` — Total entry count
  • \`ent --business Personal\` — Personal business entries
  • \`ent --vendor coffee\` — Find coffee purchases
  • \`ent --month 2025-08 --sum\` — August total
  
  See \`help entries\` for full documentation.`,
  },

  //

  // --- Blog/Projects (NOTE: logic handled in handle-command.ts) ---
  update: {
    content: "Clear the terminal and show the latest posts.",
    description: "Clears history and runs the latest posts command.",
    usage: "update",
  },
  latest: {
    content: "Show the 10 latest blog or project posts.",
    description: "List the 10 latest posts.",
    usage: "latest [limit]",
  },
  recent: {
    content: "Alias for latest.",
    description: "Alias for `latest` — List the 10 latest blog posts by date.",
    usage: "recent [limit]",
  },
  popular: {
    content: "Show the 10 most liked posts.",
    description: "List the 10 most liked blog or project posts.",
    usage: "popular [limit]",
  },
  search: {
    content: "Search posts by keyword, tag, category, etc.",
    description:
      "Search posts by keywords. Supports flags: `tag`, `category`, `sort`, `limit`, etc.",
    usage:
      "search <keyword> [--tag <tag>] [--category <cat>] [--sort <type>] [--limit <n>]",
  },
  list: {
    content: "List all blog/project post titles.",
    description: "List all blog/project post titles.",
    usage: "list [limit]",
  },
  like: {
    content: "Like a blog post by slug (e.g. `like my-post`).",
    description: "Like a blog post by slug (e.g. `like my-post`).",
    usage: "like <slug>",
  },
  unlike: {
    content: "Unlike a blog post by slug (e.g. `unlike my-post`).",
    description: "Unlike a blog post by slug (e.g. `unlike my-post`).",
    usage: "unlike <slug>",
  },

  count: {
    content:
      "Count published posts. Usage: `count [blog|project]` or `count --type blog`.",
    description: "Count published posts, optionally filtered by type.",
    usage: "count [type]",
  },

  // --- CRUD/Posts ---
  create: {
    content: "__CREATE_POST__",
    description:
      "`create <type> <post name>` Example: create blog My Blog. Create a new post at /post/create/<slug>?type=<category>, e.g., blog or project. Requires login.",
    usage: "create <blog|project> <post-name>",
  },
  edit: {
    content: "__EDIT_POST__",
    description: "Edit an existing post at /post/edit/<slug>. Requires login.",
    usage: "edit <slug>",
  },

  // --- Info/About ---
  info: {
    content:
      "This is my personal website. I'm a software developer. This site is built with Next.js, Tailwind CSS, and Supabase. This is a terminal-inspired interface aimed at providing a mouse-free experience while navigating the site. The terminal is powered by AI so feel free to ask it questions. Type `help` to see the list of commands.",
    description: "Information about this site.",
    usage: "info",
  },
  team: {
    content: "It's just me OWolf, the developer of this site.",
    description: "Who made this site.",
    usage: "team",
  },
  skills: {
    content:
      "I am a software developer with a passion for modern web development.",
    description: "My skills.",
    usage: "skills",
  },
  cache: {
    content: "__CACHE_POSTS__",
    description: "Manually regenerate the blog/project post cache.",
    usage: "cache",
  },
  "cache-posts": {
    content: "__CACHE_POSTS__",
    description: "Alias for `cache` - regenerate post cache.",
    usage: "cache-posts",
  },

  // --- Misc/UI ---
  fancy: {
    content: `
# Fancy MDX!
<my-alert message="I am MDX dammit!" />
    `,
    description: "Render custom MDX output.",
    usage: "fancy",
  },

  // --- AI/Help ---
  aiusage: {
    content: "__AI_USAGE__",
    description: "Show how many AI requests you've made this hour.",
    usage: "aiusage",
  },
  quota: {
    content: "__AI_USAGE__",
    description: "Alias for `aiusage` — check your AI usage this hour.",
    usage: "quota",
  },

  help: {
    content: async (arg, _context, set) => {
      // Clean arg
      const argTrimmed = (arg || "").trim().toLowerCase();

      // The full merged set for this session
      const allCommands = set || {};

      // Helper: find command object and its "set"
      function findCommandSet(cmd: string) {
        if (!allCommands[cmd]) return null;
        if (globalCommandKeys.includes(cmd)) return "global";
        if (adminCommandKeys.includes(cmd)) return "admin";
        return "page";
      }

      // Help on a specific command
      if (argTrimmed && allCommands[argTrimmed]) {
        const meta = allCommands[argTrimmed];
        const setType = findCommandSet(argTrimmed);
        return [
          `### \`${argTrimmed}\` (${setType} command)`,
          "",
          meta.description || "(no description)",
          "",
          meta.usage ? `\n\n**Usage:**\n\n\`${meta.usage}\`` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }

      // Help on a specific set
      if (
        argTrimmed === "global" ||
        argTrimmed === "admin" ||
        argTrimmed === "page"
      ) {
        const setKeys =
          argTrimmed === "global"
            ? globalCommandKeys
            : argTrimmed === "admin"
            ? adminCommandKeys
            : Object.keys(allCommands).filter(
                (k) =>
                  !globalCommandKeys.includes(k) &&
                  !adminCommandKeys.includes(k)
              );
        if (setKeys.length === 0) return `No ${argTrimmed} commands available.`;

        return [
          `### ${argTrimmed[0].toUpperCase() + argTrimmed.slice(1)} Commands`,
          "",
          ...setKeys
            .filter((key) => allCommands[key])
            .map(
              (key) =>
                `- **${key}** — ${
                  allCommands[key].description || "(no description)"
                }`
            ),
        ].join("\n");
      }

      // Default help
      return [
        "### Help & Command Sets",
        "",
        "Type one of:",
        "- `help global` — show always-available commands",
        "- `help admin` — show admin/user-only commands",
        "- `help page` — show page-specific commands",
        "- `help <command>` — get help on a specific command",
        "",
        "Or just type your command directly into the terminal input.",
      ].join("\n");
    },
    description: "Show help info for all, page, admin, global, or one command.",
    usage: "help [global|admin|page|<command>]",
  },

  // Ledger CLI
  new: {
    content: "__LEDGER_NEW_ENTRY__",
    description:
      "Create a new double-entry ledger transaction from natural language. Automatically categorizes expenses and supports multiple businesses. Items are mapped to appropriate accounts (e.g., 'coffee' → Food:Coffee, 'napkins' → Supplies:Packaging).",
    usage: `new <item> <amount>[, <item> <amount>...], <vendor> [options]
  
  **Basic Examples:**
  • \`new coffee 150 Starbucks\` — Simple expense (defaults to Personal business)
  • \`new fruit 500, soap 200 Gourmet Market\` — Multiple items
  • \`new subscription 1000 Supabase, business MyOnlineBusiness\` — Specify business
  
  **Business Context:**
  • \`new:MyBrickAndMortar napkins 300 supplier\` — Prefix syntax
  • \`new supplies 500 vendor, biz MyOnlineBusiness\` — Token syntax
  • No business specified defaults to "Personal"
  
  **Optional Parameters:**
  • **Date:** \`yesterday\`, \`2025/08/10\`, or \`today\` (default)
  • **Payment:** \`credit card\`, \`bank card\`, \`paypal\`, or \`cash\` (default)
  • **Memo:** \`memo "weekly supplies order"\`
  • **Currency:** Auto-detected from symbols (\`฿\` = THB, \`$\` = USD)
  
  **Full Example:**
  \`new coffee 150, pastry 100 Starbucks, yesterday, credit card, business Personal, memo "morning meeting"\`
  
  **Account Mapping:**
  • Personal: \`Expenses:Personal:Food:Coffee\`
  • MyBrickAndMortar: \`Expenses:MyBrickAndMortar:Supplies:Packaging\`  
  • MyOnlineBusiness: \`Expenses:MyOnlineBusiness:Subscription:Software\``,
  },

  // Contact Messages
  // In your commandRegistry, under messages:
  messages: {
    content: async (
      arg?: string,
      _context?: string,
      _set?: Record<string, CommandMeta>,
      user?: User | null
    ) => {
      if (!user) {
        return "<my-alert message='You must be logged in to view messages.' />";
      }

      // Parse limit from arg (default: 20)
      const limit = arg && /^\d+$/.test(arg.trim()) ? Number(arg.trim()) : 20;

      try {
        // Call your API endpoint (or direct DB if preferred)
        const res = await fetch(`/api/contact-messages?limit=${limit}`);
        if (!res.ok) throw new Error("Failed to fetch contact messages");
        const messages = await res.json();

        if (!Array.isArray(messages) || !messages.length) {
          return "_No contact messages found._";
        }

        return (
          "### Latest Contact Messages\n" +
          messages
            .map(
              (m: {
                created_at?: string;
                name?: string;
                email?: string;
                message?: string;
              }) =>
                `- [${m.created_at?.slice(0, 10) || "??"}] **${
                  m.name || "(no name)"
                }** — ${m.email || "(no email)"}: ${
                  m.message ? `\`${m.message.slice(0, 80)}\`` : ""
                }`
            )
            .join("\n")
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return `<my-alert message="Error fetching contact messages: ${errorMessage}" />`;
      }
    },
    description: "Show latest contact messages (requires login).",
    usage: "messages [limit]",
  },
};
