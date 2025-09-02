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

  "storage-health-check": {
    content:
      "`storage-health-check` - Check the health and accessibility of your storage bucket",
    description:
      "Debug storage issues by showing all files in your receipts bucket, their URLs, and testing accessibility. Useful for troubleshooting image persistence problems.",
    usage: "storage-health-check",
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

    // NEW: Natural language support
    intent: "query",
    priority: 8,
    naturalLanguage: [
      "show me",
      "list",
      "display",
      "find",
      "get my",
      "what did i spend",
      "how much did i spend",
      "my expenses",
      "transactions",
      "entries",
      "where did i",
      "when did i",
    ],
    examples: [
      {
        input: "Show me today's expenses",
        output: "entries today",
        description: "Today's entries",
      },
      {
        input: "How much did I spend on coffee this month?",
        output: "entries -v coffee -s -m august",
        description: "Coffee expenses with totals for current month",
      },
      {
        input: "List my Starbucks transactions",
        output: "entries -v Starbucks",
        description: "Filter by vendor",
      },
      {
        input: "What did I spend on Personal business last month?",
        output: "entries -b Personal -s -m july",
        description: "Business filter with totals for specific month",
      },
      {
        input: "Show me my recent USD expenses",
        output: "entries -c USD -l 20",
        description: "Currency filter with limit",
      },
    ],
    categories: ["query", "finance", "search"],
    aliases: ["ent", "e", "list", "show", "find"],

    usage: `entries [options]
    
    **📋 Quick Reference - All Available Flags:**
    
    **Filtering:**
    • \`--business <name>\` / \`-b <name>\`     — Filter by business account
    • \`--vendor <name>\` / \`-v <name>\`       — Filter by vendor/description
    • \`--account <pattern>\` / \`-A <pattern>\` — Filter by account name
    • \`--currency <code>\` / \`-c <code>\`     — Filter by currency (USD, THB, EUR)
    
    **Date & Display:**
    • \`--date <date>\` / \`-d <date>\`         — Filter by specific date or alias (today, yesterday, august)
    • \`--month <month>\` / \`-m <month>\`      — Filter by month (january, february, etc.)
    • \`--limit <number>\` / \`-l <number>\`    — Limit number of results
    • \`--summary\` / \`-s\`                    — Show totals and summaries
    
    **Navigation:**
    • \`--goto <id>\` / \`-g <id>\`             — Navigate to specific entry
    
    **🚀 Smart Examples:**
    • \`entries today\`                         — Today's entries
    • \`entries -v Starbucks -s\`               — Starbucks expenses with totals
    • \`entries -b Personal -m august -s\`      — Personal business expenses for August with totals

    • \`entries -A Food -l 10\`                 — Food account entries, limit 10`,
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
  
  **Date & Display:**
  • \`--date <date>\` / \`-d <date>\`         — Filter by specific date or alias (today, yesterday, august)
  • \`--month <month>\` / \`-m <month>\`      — Filter by month (january, february, etc.)
  • \`--limit <number>\` / \`-l <number>\`    — Limit number of results
  • \`--summary\` / \`-s\`                    — Show totals and summaries
  
  **Navigation:**
  • \`--goto <id>\` / \`-g <id>\`             — Navigate to specific entry
  
  **🚀 Smart Examples:**
  • \`ent today\`                              — Today's entries
  • \`ent -v Starbucks -s\`                    — Starbucks expenses with totals
  • \`ent -b Personal -m august -s\`           — Personal business expenses for August with totals

  • \`ent -A Food -l 10\`                      — Food account entries, limit 10
  
  **Date Filtering:**
  • \`--month <YYYY-MM|name>\` / \`-m <YYYY-MM|name>\` — Filter by month
  • \`--day <YYYY-MM-DD>\` / \`-D <YYYY-MM-DD>\`       — Filter by specific day
  • \`--year <YYYY>\` / \`-y <YYYY>\`                   — Filter by year
  • \`--range <start> <end>\` / \`-r <start> <end>\`   — Filter by date range
  
  **Output & Navigation:**
  • \`--sum\` / \`-s\`                    — Show totals with multi-currency breakdown
  • \`--count\` / \`-n\`                  — Show count only, no entries listed
  • \`--go <id>\` / \`-g <id>\`           — Navigate to specific entry by ID
  • \`--entry <id>\` / \`-e <id>\`        — View specific entry by ID
  
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

  // --- Edit Entry ---
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

    // NEW: Natural language support
    intent: "action",
    priority: 6,
    naturalLanguage: [
      "change",
      "update",
      "edit",
      "modify",
      "fix",
      "correct",
      "i need to change",
      "i made a mistake",
      "wrong",
      "incorrect",
    ],
    examples: [
      {
        input: "Change entry 323 business to MyBrick",
        output: "edit-entry 323 --business MyBrick",
        description: "Change business context",
      },
      {
        input: "Fix the vendor name for entry 330 to Starbucks",
        output: "edit-entry 330 --vendor Starbucks",
        description: "Update vendor name",
      },
      {
        input: "I need to correct the date on entry 325 to yesterday",
        output: "edit-entry 325 --date yesterday",
        description: "Fix transaction date",
      },
      {
        input: "Update entry 340 memo to client meeting",
        output: 'edit-entry 340 --memo "client meeting"',
        description: "Add memo to entry",
      },
    ],
    categories: ["edit", "modify", "finance"],
    aliases: ["editent", "modify", "fix", "update"],

    usage: `edit-entry id --[options]
  
  **Basic Usage:**
  • \`edit-entry 323 --business MyBrick\` / \`edit-entry 323 -b MyBrick\` — Change business context
  • \`edit-entry 323 --vendor "Starbucks Coffee"\` / \`edit-entry 323 -v "Starbucks"\` — Update vendor name
  • \`edit-entry 323 --date 2025-08-15\` / \`edit-entry 323 -D 2025-08-15\` — Change transaction date
  • \`edit-entry 323 --memo "client meeting"\` / \`edit-entry 323 -m "client meeting"\` — Add or update memo
  • \`edit-entry 323 --delete\` / \`edit-entry 323 -d\` — Delete the entry
  
  **Combined Operations:**
  • \`edit-entry 323 --vendor "Coffee Shop" --memo "team meeting"\` — Update vendor and memo`,
    // ... rest of your existing usage stays the same
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
  • \`editent 323 --delete\` or \`editent 323 -d\` — Delete the entry
  
  **Multiple changes:**
  • \`editent 323 --business Personal --vendor "Coffee Shop" --memo "team meeting"\`
  

  
  See \`help edit-entry\` for full documentation.`,
  },

  ee: {
    description:
      "Short alias for edit-entry - edit a single ledger entry (business, vendor, date, memo)",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => editEntryCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ee id --[options]
  
  **Quick Examples:**
  • \`ee 323 --business MyBrick\` / \`ee 323 -b MyBrick\` — Change business
  • \`ee 323 --vendor "Starbucks"\` / \`ee 323 -v "Starbucks"\` — Update vendor
  • \`ee 323 --date 2025-08-15\` / \`ee 323 -D 2025-08-15\` — Change date
  • \`ee 323 --memo "note"\` / \`ee 323 -m "note"\` — Add memo
  • \`ee 323 --delete\` / \`ee 323 -d\` — Delete the entry
  
  **Multiple changes:**
  • \`ee 323 --business Personal --vendor "Coffee Shop" --memo "team meeting"\`
  

  
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
      "Create a new double-entry ledger transaction from natural language or receipt images. Uses unified flag-based syntax with -i for items and --flags for options. Supports expenses (default), income, assets, and liabilities with --type flag. Both manual entry and automated OCR parsing use the same syntax for consistency. Automatically categorizes transactions and supports multiple businesses with AI-powered categorization.",

    // NEW: Natural language support
    intent: "action",
    priority: 10,
    naturalLanguage: [
      // Expense patterns
      "i just bought",
      "i purchased",
      "i spent money on",
      "i had",
      "i paid for",
      "bought",
      "purchased",
      "spent",
      "paid for",
      "expense",
      // Income patterns
      "i received",
      "i got paid",
      "i earned",
      "payment received",
      "income",
      "salary",
      "freelance",
      "consulting",
      // Asset patterns
      "i bought",
      "purchased",
      "acquired",
      // Liability patterns
      "i paid off",
      "debt payment",
      "loan payment",
      // Opening balance patterns
      "opening balance",
      "initial balance",
      "starting balance",
      "beginning balance",
      // General
      "transaction",
    ],
    examples: [
      {
        input: "I just bought coffee for 150 baht",
        output: "new -i coffee 150",
        description: "Simple expense entry",
      },
      {
        input: "I spent $20 at Starbucks for coffee",
        output: "new -i coffee 20 --vendor Starbucks",
        description: "Expense with vendor",
      },
      {
        input: "Upload receipt from Starbucks",
        output:
          "new -i coffee 20 --vendor Starbucks --memo 'Receipt total $20'",
        description: "Automated receipt parsing (same syntax)",
      },
      {
        input: "MyBrick: office supplies for $100",
        output: "new -i supplies 100 --business MyBrick",
        description: "Business expense with flag syntax",
      },
      {
        input: "I had lunch yesterday for 200 baht",
        output: "new -i lunch 200 --date yesterday",
        description: "Expense with date",
      },
      {
        input: "Bought gas $50 with credit card",
        output: 'new -i gas 50 --payment "credit card"',
        description: "Expense with payment method",
      },
      {
        input: "I bought a coffee mug for 200 baht",
        output: 'new -i "coffee mug" 200',
        description: "Multi-word item with quotes",
      },
      {
        input: "Office supplies and coffee for the team",
        output:
          'new -i supplies 500 coffee 150 --business MyBrick --memo "team meeting"',
        description: "Multiple items with business context and memo",
      },
      // NEW: Income examples
      {
        input: "I received $5000 for consulting work",
        output: "new -i consulting 5000 --type income --client Acme Corp",
        description: "Income entry with client",
      },
      {
        input: "Freelance payment of $2000",
        output: "new -i freelance 2000 --type income --client Client ABC",
        description: "Freelance income",
      },
      {
        input: "Salary payment of $8000",
        output: "new -i salary 8000 --type income --client My Company",
        description: "Salary income",
      },
      // NEW: Asset examples
      {
        input: "Bought a laptop for $2000 with credit card",
        output: "new -i laptop 2000 --type asset --payment credit-card",
        description: "Asset purchase with payment method",
      },
      {
        input: "Bought a laptop from Apple Store on my KBank Credit card",
        output:
          "new -i laptop 40000 --type asset --vendor Apple Store --payment KBank Credit card",
        description: "Asset purchase with vendor and credit card",
      },
      {
        input: "Purchased office furniture for $1500",
        output: "new -i furniture 1500 --type asset --business MyBrick",
        description: "Business asset purchase",
      },
      // NEW: Liability examples
      {
        input: "Paid off $500 of credit card debt",
        output: "new -i credit-card 500 --type liability --payment checking",
        description: "Liability payment",
      },
      {
        input: "Student loan payment of $1000",
        output: "new -i student-loan 1000 --type liability --payment savings",
        description: "Student loan payment",
      },
      // NEW: Opening balance examples
      {
        input: "Opening balance of 1000000 in my Kasikorn bank account",
        output:
          "new -i opening_balance 1000000 --type asset --payment Kasikorn Bank",
        description: "Opening balance entry",
      },
      {
        input: "Initial balance of $50000 in checking account",
        output: "new -i initial_balance 50000 --type asset --payment checking",
        description: "Initial balance entry",
      },
    ],
    categories: ["expense", "finance", "accounting"],
    aliases: ["expense", "spend", "buy", "purchase"],

    usage: `new -i <item1> <price1> <item2> <price2>... [--options]
    
    **📋 Quick Reference - All Available Flags:**
    
    **Core Options:**
    • \`--items <item1> <price1> <item2> <price2>...\` / \`-i <item1> <price1> <item2> <price2>...\` — Items and prices (required)
    • \`--type <type>\` / \`-t <type>\`            — Transaction type: expense (default), income, asset, liability, transfer
    • \`--business <name>\` / \`-b <name>\`     — Set business context
    • \`--vendor <name>\` / \`-v <name>\`        — Set vendor/merchant name (expenses)
    • \`--client <name>\` / \`-c <name>\`        — Set client name (income)
    • \`--payment <method>\` / \`-p <method>\`   — Payment method (cash, credit card, etc.)
    • \`--memo <text>\` / \`-m <text>\`          — Add memo/note
    • \`--date <date>\` / \`-d <date>\`          — Set transaction date
    • \`--image <url>\` / \`-I <url>\`            — Attach image URL
    
    **AI Categorization:**
    • \`--use-ai\` / \`-u\`                      — Force AI categorization (default)
    • \`--no-ai\` / \`-n\`                       — Disable AI, use rule-based mapping
    
    **🚀 Smart Syntax Examples:**
    • \`new -i coffee 150\`                      — Simple expense (Personal business)
    • \`new -i supplies 500 --business MyBrick\` — Business context with flag
    • \`new -i coffee 150 --vendor Starbucks\`   — With vendor using flag
    • \`new -i coffee $6 pastry $4 --vendor Starbucks\`  — Multiple items with vendor
    • \`new -i "coffee mug" 200 croissant 150\` — Multi-word items with quotes`,
  },

  // --- Account Management ---
  accounts: {
    content: "__ACCOUNTS_COMMAND__",
    description:
      "Manage account mappings for payment methods and ledger accounts.",
    usage: `accounts <subcommand> [options]

**📋 Subcommands:**
• \`accounts list\` / \`accounts ls\`           — List all account mappings
• \`accounts show <alias>\`                    — Show details for a specific account
• \`accounts add <alias> <accountPath>\`       — Add a new account mapping
• \`accounts edit <alias> <accountPath>\`      — Edit an existing account mapping
• \`accounts delete <alias>\` / \`accounts del\` — Delete an account mapping
• \`accounts set-default <alias>\`             — Set an account as the default
• \`accounts help\`                            — Show detailed help

**💡 Examples:**
• \`accounts list\`                            — View all mappings
• \`accounts show kasikorn\`                   — View Kasikorn account details
• \`accounts add scb "Assets:Bank:SCB:Savings"\` — Add SCB account
• \`accounts edit kasikorn "Assets:Bank:Kasikorn:Checking"\` — Change account path
• \`accounts set-default kasikorn\`            — Make Kasikorn the default

**🔧 Account Types:**
• \`asset\` — What you own (bank accounts, cash, investments)
• \`liability\` — What you owe (credit cards, loans)
• \`equity\` — Net worth
• \`income\` — Money coming in
• \`expense\` — Money going out`,

    // Natural language support
    intent: "utility",
    priority: 5,
    naturalLanguage: [
      "accounts",
      "account",
      "payment methods",
      "bank accounts",
      "manage accounts",
      "show accounts",
      "list accounts",
      "add account",
      "edit account",
      "delete account",
    ],
    examples: [
      {
        input: "Show me all my accounts",
        output: "accounts list",
        description: "List all account mappings",
      },
      {
        input: "Add a new SCB bank account",
        output: 'accounts add scb "Assets:Bank:SCB:Savings"',
        description: "Add new bank account mapping",
      },
      {
        input: "What accounts do I have?",
        output: "accounts list",
        description: "View account mappings",
      },
      {
        input: "Change my default account to cash",
        output: "accounts set-default cash",
        description: "Set default payment method",
      },
    ],
    categories: ["management", "finance", "accounts"],
    aliases: ["account", "acct", "payments"],
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
