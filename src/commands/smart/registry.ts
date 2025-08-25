// src/commands/smart/registry.ts

import type { CommandMeta } from "./utils";
import { globalCommandKeys } from "./sets/global";
import { adminCommandKeys } from "./sets/admin";
// import { getContactMessages } from "@/app/actions/contact/get-contact-messages";
import { User } from "@/types/user";
import { entriesListCommand } from "@/commands/smart/entries-command";
import { editEntryCommand } from "@/commands/smart/edit-entry-command";
import { ledgerCliCommand } from "@/commands/smart/ledger-cli-command";

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
  c: {
    content: "`c` - clear the terminal",
    description: "Clear the terminal history (alias for clear)",
    usage: "c",
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

  // --- Cleanup Commands ---
  "cleanup-orphaned-images": {
    content:
      "`cleanup-orphaned-images [--force]` - Scan and clean up orphaned receipt images",
    description:
      "Scan Supabase Storage for receipt images that don't have corresponding database entries and optionally delete them. Use --force to actually delete the orphaned images.",
    usage: "cleanup-orphaned-images [--force]",
  },

  // Ledger CLI

  entries: {
    description:
      "List and filter ledger entries with powerful search options including multi-currency support. Supports business filtering, vendor search, account filtering, currency filtering, date ranges with smart aliases, counting, and navigation to specific entries.",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => entriesListCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `entries [options]
  
  **📋 Quick Reference - All Available Flags:**
  
  **Filtering:**
  • \`--business <name>\` / \`-b <name>\`     — Filter by business account
  • \`--vendor <name>\` / \`-v <name>\`       — Filter by vendor/description
  • \`--account <pattern>\` / \`-A <pattern>\` — Filter by account name
  • \`--currency <code>\` / \`-c <code>\`     — Filter by currency (USD, THB, EUR)
  
  **Date Filtering:**
  • \`--month <YYYY-MM|name>\` / \`-m <YYYY-MM|name>\` — Filter by month
  • \`--day <YYYY-MM-DD>\` / \`-D <YYYY-MM-DD>\`       — Filter by specific day
  • \`--year <YYYY>\` / \`-y <YYYY>\`                   — Filter by year
  • \`--range <start> <end>\` / \`-r <start> <end>\`   — Filter by date range
  
  **Output & Navigation:**
  • \`--sum\` / \`-s\`                    — Show totals with multi-currency breakdown
  • \`--count\` / \`-n\`                  — Show count only, no entries listed
  • \`--go <id>\` / \`-g <id>\`           — Navigate to specific entry by ID
  
  **Sorting & Limits:**
  • \`--sort <date|created>\` / \`-D <date|created>\` — Sort by date or creation time
  • \`--dir <asc|desc>\` / \`-d <asc|desc>\`           — Sort direction
  • \`--limit <number>\` / \`-l <number>\`             — Limit number of results
  
  **🚀 Smart Date Aliases (No Flags Needed):**
  • \`entries today\`      — Today's entries
  • \`entries yesterday\`  — Yesterday's entries
  • \`entries 2025\`       — All 2025 entries
  • \`entries jan\`        — January entries (current year)
  • \`entries august\`     — August entries (current year)
  
  **💡 Quick Examples:**
  • \`entries\`                           — Recent entries (10 most recent)
  • \`entries -l 50\`                     — 50 most recent entries
  • \`entries -s\`                        — With totals
  • \`entries -n\`                        — Count only
  • \`entries -b Personal\`                — Personal business entries
  • \`entries -v Starbucks\`               — Starbucks purchases
  • \`entries -A Coffee\`                  — Coffee-related accounts
  • \`entries -c USD\`                     — USD entries only
  • \`entries -g 330\`                     — Navigate to entry #330
  • \`entries today -s\`                   — Today with totals
  • \`entries aug -b Personal\`            — August personal entries
  • \`entries -m 2025-01 -s\`              — January 2025 with totals
  • \`entries -r jan mar\`                 — January through March
  
  **🔧 Advanced Combinations:**
  • \`entries -b Personal -v coffee -s\`  — Personal coffee expenses with totals
  • \`entries -c USD -m aug -n\`          — Count USD entries in August
  • \`entries -r 2025-01 2025-06 -b MyBrick -s\` — MyBrick entries Jan-Jun with totals
  
  **📱 Mobile-Friendly Short Flags:**
  Use short flags for quick typing on mobile:
  • \`-b\` instead of \`--business\`
  • \`-v\` instead of \`--vendor\`
  • \`-s\` instead of \`--sum\`
  • \`-n\` instead of \`--count\`
  • \`-g\` instead of \`--go\`
  • \`-l\` instead of \`--limit\`
  
  **🔄 Backward Compatibility:**
  • Numeric limits without \`--limit\` still work: \`entries 50\`
  • Date aliases still work: \`entries today\`, \`entries 2025\`
  • Currency codes still work: \`entries USD\``,
  },
  ent: {
    description:
      "Alias for entries command with same functionality including smart date aliases, navigation, filtering (business, vendor, account, currency), multi-currency totals, and ranges",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => entriesListCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ent [options]
  
  **📋 Quick Reference - All Available Flags:**
  
  **Filtering:**
  • \`--business <name>\` / \`-b <name>\`     — Filter by business account
  • \`--vendor <name>\` / \`-v <name>\`       — Filter by vendor/description
  • \`--account <pattern>\` / \`-A <pattern>\` — Filter by account name
  • \`--currency <code>\` / \`-c <code>\`     — Filter by currency (USD, THB, EUR)
  
  **Date Filtering:**
  • \`--month <YYYY-MM|name>\` / \`-m <YYYY-MM|name>\` — Filter by month
  • \`--day <YYYY-MM-DD>\` / \`-D <YYYY-MM-DD>\`       — Filter by specific day
  • \`--year <YYYY>\` / \`-y <YYYY>\`                   — Filter by year
  • \`--range <start> <end>\` / \`-r <start> <end>\`   — Filter by date range
  
  **Output & Navigation:**
  • \`--sum\` / \`-s\`                    — Show totals with multi-currency breakdown
  • \`--count\` / \`-n\`                  — Show count only, no entries listed
  • \`--go <id>\` / \`-g <id>\`           — Navigate to specific entry by ID
  
  **Sorting & Limits:**
  • \`--sort <date|created>\` / \`-D <date|created>\` — Sort by date or creation time
  • \`--dir <asc|desc>\` / \`-d <asc|desc>\`           — Sort direction
  • \`--limit <number>\` / \`-l <number>\`             — Limit number of results
  
  **🚀 Smart Date Aliases (No Flags Needed):**
  • \`ent today\`      — Today's entries
  • \`ent yesterday\`  — Yesterday's entries
  • \`ent 2025\`       — All 2025 entries
  • \`ent aug\`        — August entries (current year)
  
  **💡 Quick Examples:**
  • \`ent\`                           — Recent entries (10 most recent)
  • \`ent -l 50\`                     — 50 most recent entries
  • \`ent -s\`                        — With totals
  • \`ent -n\`                        — Count only
  • \`ent -b Personal\`                — Personal business entries
  • \`ent -v Starbucks\`               — Starbucks purchases
  • \`ent -A Coffee\`                  — Coffee-related accounts
  • \`ent -c USD\`                     — USD entries only
  • \`ent -g 330\`                     — Navigate to entry #330
  • \`ent today -s\`                   — Today with totals
  • \`ent aug -b Personal\`            — August personal entries
  • \`ent -m 2025-01 -s\`              — January 2025 with totals
  • \`ent -r jan mar\`                 — January through March
  
  **🔧 Advanced Combinations:**
  • \`ent -b Personal -v coffee -s\`  — Personal coffee expenses with totals
  • \`ent -c USD -m aug -n\`          — Count USD entries in August
  • \`ent -r 2025-01 2025-06 -b MyBrick -s\` — MyBrick entries Jan-Jun with totals
  
  **📱 Mobile-Friendly Short Flags:**
  Use short flags for quick typing on mobile:
  • \`-b\` instead of \`--business\`
  • \`-v\` instead of \`--vendor\`
  • \`-s\` instead of \`--sum\`
  • \`-n\` instead of \`--count\`
  • \`-g\` instead of \`--go\`
  • \`-l\` instead of \`--limit\`
  
  **🔄 Backward Compatibility:**
  • Numeric limits without \`--limit\` still work: \`ent 50\`
  • Date aliases still work: \`ent today\`, \`ent 2025\`
  • Currency codes still work: \`ent USD\``,
  },
  e: {
    description:
      "Short alias for entries - list and filter ledger entries with all the same features",
    content: (arg, pageCtx, cmds, user) =>
      entriesListCommand(arg, pageCtx, cmds, user),
    usage: `e [options] - Quick reference for common flags:

  **📱 Quick Flags (Mobile-Friendly):**
  • \`-b <name>\`     — Business filter
  • \`-v <name>\`     — Vendor filter  
  • \`-A <pattern>\`  — Account filter
  • \`-c <code>\`     — Currency filter
  • \`-s\`            — Show totals
  • \`-n\`            — Count only
  • \`-g <id>\`       — Go to entry
  • \`-l <number>\`   — Limit results
  
  **🚀 Smart Aliases:**
  • \`e today\`       — Today's entries
  • \`e 2025\`        — All 2025 entries
  • \`e aug\`         — August entries
  
  **💡 Examples:**
  • \`e -b Personal -s\`     — Personal entries with totals
  • \`e today -n\`            — Count today's entries
  • \`e -v Starbucks\`        — Starbucks purchases
  
  See \`help entries\` for full documentation and all options.`,
  },

  "edit-entry": {
    description:
      "Edit a single ledger entry - change business, vendor, date, or memo. Requires login and entry ownership.",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => editEntryCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `edit-entry id --[options]
  
  **Basic Usage:**
  • \`edit-entry 323 --business MyBrick\` — Change business context
  • \`edit-entry 323 --vendor "Starbucks Coffee"\` — Update vendor name
  • \`edit-entry 323 --date 2025-08-15\` — Change transaction date
  • \`edit-entry 323 --memo "client meeting"\` — Add or update memo
  • \`edit-entry 323 --delete\` — Delete the entry
  
  **Options:**
  • \`--business <n>\` — Change business (updates all account names)
  • \`--vendor <n>\` — Update vendor/description
  • \`--description <n>\` — Alias for --vendor
  • \`--date YYYY-MM-DD\` — Change transaction date
  • \`--memo <text>\` — Add or update memo field
  • \`--delete\` — Delete the entry
  
  **Multiple Changes:**
  • \`edit-entry 323 --business Personal --vendor "Updated Vendor" --memo "notes"\`
  
  **Business Changes:**
  When changing business, all account names are updated:
  • \`Expenses:OldBusiness:Food:Coffee\` → \`Expenses:NewBusiness:Food:Coffee\`
  • Updates both main entry and individual postings
  
  **Examples:**
  • \`edit-entry 330 --business Channel60\` — Move to Channel60 business
  • \`edit-entry 330 --vendor "Corrected Name"\` — Fix vendor name
  • \`edit-entry 330 --date 2025-08-16 --memo "corrected date"\` — Fix date with note`,
  },

  editent: {
    description:
      "Alias for edit-entry - edit a single ledger entry (business, vendor, date, memo)",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => editEntryCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `editent id --[options]
  
  **Quick Examples:**
  • \`editent 323 --business MyBrick\` — Change business
  • \`editent 323 --vendor "Starbucks"\` — Update vendor
  • \`editent 323 --date 2025-08-15\` — Change date
  • \`editent 323 --memo "note"\` — Add memo
  • \`editent 323 --delete\` — Delete the entry
  
  **Multiple changes:**
  • \`editent 323 --business Personal --vendor "Coffee Shop" --memo "team meeting"\`
  
  See \`help edit-entry\` for full documentation.`,
  },

  // Ledger CLI Commands

  ledger: {
    description:
      "Execute actual Ledger CLI commands against the synced .ledger file. Available in development mode only. Automatically syncs database to file before execution. Enhanced with security features including command whitelisting and argument validation.",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => ledgerCliCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ledger <command> [args...]
  
  **🔒 Security Features:**
  • **Command Whitelisting** — Only safe Ledger CLI commands allowed
  • **Argument Validation** — Dangerous patterns are blocked
  • **Input Sanitization** — Shell injection attempts are prevented
  • **User Authentication** — Requires login to execute commands
  • **Security Logging** — All commands are logged for monitoring
  
  **✅ Safe Commands (Whitelisted):**
  
  **Balance & Reports:**
  • \`balance\`, \`bal\` — Show account balances
  • \`equity\` — Show equity report
  • \`cleared\` — Show cleared transactions
  
  **Transactions & Register:**
  • \`register\`, \`reg\` — Show transaction register
  • \`print\` — Print transactions
  • \`xact\` — Show specific transaction
  
  **Accounts & Metadata:**
  • \`accounts\` — List all account names
  • \`payees\` — List all payees/vendors
  • \`stats\` — Show ledger statistics
  • \`files\` — List source files
  
  **Reports & Queries:**
  • \`report\` — Generate custom reports
  • \`budget\` — Show budget information
  • \`activity\` — Show account activity
  • \`query\` — Run custom queries
  • \`calc\` — Perform calculations
  
  **💡 Common Usage Examples:**
  • \`ledger balance\` — Show all account balances
  • \`ledger register coffee\` — Register entries containing "coffee"
  • \`ledger bal Expenses\` — Balance for Expenses accounts only
  • \`ledger reg --monthly\` — Monthly register report
  • \`ledger bal Expenses:Personal\` — Personal expenses only
  • \`ledger reg --begin 2025-08-01\` — Transactions since August 1st
  • \`ledger bal --depth 2\` — Balance to depth 2 accounts
  
  **🏢 Business Filtering:**
  • \`ledger bal Expenses:MyBrick\` — MyBrick business expenses
  • \`ledger reg Expenses:Personal:Food\` — Personal food expenses
  • \`ledger bal Liabilities\` — All liabilities (credit cards, etc.)
  
  **🚫 Blocked for Security:**
  • Shell command separators (\`;\`, \`&\`, \`|\`, \`\`\`, \`$\`)
  • Directory traversal attempts (\`../\`)
  • File manipulation flags (\`--file\`, \`--output\`)
  • Unauthorized commands not in whitelist
  
  **🔧 Features:**
  • Auto-syncs database to \`.ledger\` file before execution
  • Full Ledger CLI power with your data (safe commands only)
  • Development mode only for security
  • Formatted output with syntax highlighting
  • Security logging and monitoring
  
  **⚠️ Security Notes:**
  • Commands are validated and sanitized before execution
  • All executions are logged for security monitoring
  • Requires Ledger CLI installed and available in PATH
  • Restricted to authenticated users only`,
  },

  // You might also want shorter aliases:
  bal: {
    description: "Alias for 'ledger balance' - show account balances",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) =>
      ledgerCliCommand(
        `balance ${arg || ""}`,
        pageCtx || "",
        cmds || {},
        user || null
      ),
    usage: `bal [account-pattern]
    
  **Examples:**
  • \`bal\` — All account balances
  • \`bal Expenses\` — Expense account balances only
  • \`bal Expenses:Personal\` — Personal expense balances
  • \`bal --monthly\` — Monthly balance report`,
  },

  reg: {
    description: "Alias for 'ledger register' - show transaction register",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) =>
      ledgerCliCommand(
        `register ${arg || ""}`,
        pageCtx || "",
        cmds || {},
        user || null
      ),
    usage: `reg [search-term]
    
  **Examples:**
  • \`reg\` — All transactions
  • \`reg coffee\` — Transactions containing "coffee"  
  • \`reg Starbucks\` — All Starbucks transactions
  • \`reg --monthly\` — Monthly register report`,
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
    description:
      "Edit an existing blog post at /post/edit/<slug>. Requires login.",
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
          meta.usage ? `\n\n**Usage:**\n\n${meta.usage}` : "",
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
      "Create a new double-entry ledger transaction from natural language. Uses intuitive @ syntax for vendors and --flags for options. Automatically categorizes expenses and supports multiple businesses with AI-powered categorization.",
    usage: `new [business:]<items> [@ vendor] [--options]
  
  **📋 Quick Reference - All Available Flags:**
  
  **Core Options:**
  • \`--business <name>\` / \`-b <name>\`     — Set business context
  • \`--payment <method>\` / \`-p <method>\`   — Payment method (cash, credit card, etc.)
  • \`--memo <text>\` / \`-m <text>\`          — Add memo/note
  • \`--date <date>\` / \`-d <date>\`          — Set transaction date
  • \`--image <url>\` / \`-i <url>\`            — Attach image URL
  
  **AI Categorization:**
  • \`--use-ai\` / \`-u\`                      — Force AI categorization (default)
  • \`--no-ai\` / \`-n\`                       — Disable AI, use rule-based mapping
  
  **🚀 Smart Syntax (No Flags Needed):**
  • \`new coffee 150\`                         — Simple expense (Personal business)
  • \`new MyBrick: supplies 500\`              — Business prefix syntax
  • \`new coffee 150 @ Starbucks\`             — With vendor using @ syntax
  • \`new coffee $6, pastry $4 @ Starbucks\`  — Multiple items with vendor
  
  **💡 Quick Examples with Short Flags:**
  • \`new coffee 150 -b Personal\`             — Personal business coffee
  • \`new supplies 500 -p cash\`               — Cash payment for supplies
  • \`new lunch 200 -m "client meeting"\`      — Lunch with memo
  • \`new coffee 150 -d yesterday\`            — Yesterday's coffee
  • \`new supplies 300 -i "https://..."\`      — Supplies with image
  
  **🔧 Advanced Combinations:**
  • \`new coffee $6, lunch $12 @ Cafe -b Personal -p "credit card" -m "client meeting"\`
  • \`new Channel60: marketing 1000 @ Agency -p cash -d yesterday\`
  • \`new subscription 50 @ Netflix -b Personal -m "monthly" -d 2025-08-10\`
  • \`new supplies 500 @ HomeDepot -b MyBrick -p cash -m "office supplies"\`
  
  **📱 Mobile-Friendly Short Flags:**
  Use short flags for quick typing on mobile:
  • \`-b\` instead of \`--business\`
  • \`-p\` instead of \`--payment\`
  • \`-m\` instead of \`--memo\`
  • \`-d\` instead of \`--date\`
  • \`-i\` instead of \`--image\`
  • \`-u\` instead of \`--use-ai\`
  • \`-n\` instead of \`--no-ai\`
  
  **🏢 Business Context Options:**
  • **Prefix syntax:** \`MyBrick: items...\` (quick and intuitive)
  • **Flag syntax:** \`--business MyBrick\` (explicit and clear)
  • **Default:** Personal business if none specified
  
  **💳 Payment Methods:**
  • \`--payment cash\` → Assets:Cash (default)
  • \`--payment "credit card"\` → Liabilities:CreditCard
  • \`--payment paypal\` → Assets:PayPal
  • \`--payment "bank card"\` → Assets:Bank:Checking
  
  **📅 Date Formats:**
  • \`--date yesterday\` — Relative date
  • \`--date 2025-08-10\` — YYYY-MM-DD format
  • \`--date 2025/08/10\` — YYYY/MM/DD format
  • **Default:** Today's date if none specified
  
  **🤖 AI Categorization:**
  • **Default:** AI-enabled for smart categorization
  • \`--use-ai\` / \`-u\` — Force AI categorization
  • \`--no-ai\` / \`-n\` — Use rule-based fallback
  • **Fallback:** If AI fails, automatically retries with rules
  
  **💰 Currency Detection:**
  • **Auto-detected:** \`$\` = USD, \`฿\` = THB
  • **Default:** THB (Thai Baht) if no currency symbols found
  
  **📊 Account Mapping Examples:**
  • **Personal:** \`Expenses:Personal:Food:Coffee\`
  • **MyBrick:** \`Expenses:MyBrick:Supplies:General\`  
  • **MyOnline:** \`Expenses:MyOnline:Subscription:Software\`
  
  **🔄 Backward Compatibility:**
  • Business prefix syntax still works: \`MyBrick: items...\`
  • @ vendor syntax still works: \`@ Starbucks\`
  • All existing long flags continue to work
  
  **💡 Pro Tips:**
  • Use business prefix for quick context: \`MyBrick: supplies 500\`
  • Combine multiple flags: \`-b Personal -p cash -m "note"\`
  • AI automatically categorizes items based on description and vendor
  • Payment methods map to standard ledger accounts automatically`,
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
