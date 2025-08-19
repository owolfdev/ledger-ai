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
      "List and filter ledger entries with powerful search options. Supports business filtering, vendor search, account filtering, date ranges with smart aliases, counting, and navigation to specific entries.",
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
  
  **Navigation:**
  • \`entries go <id>\` — Navigate directly to entry by ID (e.g., \`entries go 330\`)
  
  **Smart Date Aliases:**
  • \`entries today\` — Today's entries
  • \`entries yesterday\` — Yesterday's entries
  • \`entries 2025\` — All entries for year 2025
  • \`entries 2024\` — All entries for year 2024
  • \`entries jan\` or \`entries january\` — January entries (current year)
  • \`entries aug\` or \`entries august\` — August entries (current year)
  • \`entries may\`, \`entries sep\`, etc. — Any month name
  
  **Date Ranges:**
  • \`entries --range 2025-01 2025-06\` — January through June 2025
  • \`entries --range today yesterday\` — Yesterday and today
  • \`entries --range 2024-12 2025-02\` — Cross-year range
  • \`entries --range 2025-01-01 2025-01-31\` — Specific date range
  
  **Traditional Date Filtering:**
  • \`--month YYYY-MM\` — Filter by specific month (e.g., 2025-08)
  • \`--day YYYY-MM-DD\` — Filter by specific day (e.g., 2025-08-17)
  • \`--year YYYY\` — Filter by specific year (e.g., 2025)
  
  **Filtering Options:**
  • \`--business <name>\` — Filter by business (Personal, MyOnlineBusiness, etc.)
  • \`--vendor <name>\` — Filter by vendor/description (case-insensitive)
  • \`--account <pattern>\` — Filter by account name (supports partial matching)
  • \`--count\` — Show count only, no entries listed
  • \`--sum\` — Show total amount at bottom
  
  **Account Filtering Examples:**
  • \`entries --account Coffee\` — Any account containing "Coffee"
  • \`entries --account Expenses:Personal:Food\` — Specific account hierarchy
  • \`entries --account Assets\` — All asset accounts
  • \`entries --account Liabilities\` — All liability accounts
  
  **Filter Priority:** Range > Day > Month > Year (most specific wins)
  
  **Examples:**
  • \`entries go 330\` — Navigate to entry #330
  • \`entries today sum\` — Today's entries with total
  • \`entries aug --business Personal\` — Personal business entries in August
  • \`entries yesterday --vendor Starbucks\` — Yesterday's Starbucks purchases
  • \`entries 2025 count\` — Count all 2025 entries
  • \`entries --business Personal --count --sum\` — Count and total for personal entries
  • \`entries --range jan mar sum\` — January-March total
  • \`entries 2024 --vendor coffee\` — All 2024 coffee purchases
  • \`entries created desc 10 --business Channel60\` — Latest 10 Channel60 entries
  • \`entries --account Coffee --business Personal sum\` — Personal coffee expenses total
  • \`entries --account Assets:Cash today\` — Today's cash transactions`,
  },
  ent: {
    description:
      "Alias for entries command with same functionality including smart date aliases, navigation, filtering (business, vendor, account), and ranges",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => entriesListCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ent [limit] [date|created] [asc|desc] [options]
  
  **Quick Date Access:**
  • \`ent\` — Recent entries (20 most recent)
  • \`ent today\` — Today's entries
  • \`ent yesterday\` — Yesterday's entries
  • \`ent 2025\` — All 2025 entries
  • \`ent aug\` — August entries (current year)
  • \`ent jan\`, \`ent feb\`, etc. — Any month name
  
  **Navigation & Search:**
  • \`ent go 330\` — Navigate to entry #330
  • \`ent count\` — Total entry count
  • \`ent --business Personal\` — Personal business entries
  • \`ent --vendor coffee\` — Find coffee purchases
  • \`ent --account Coffee\` — All coffee-related accounts
  • \`ent --account Assets:Cash\` — Cash transactions only
  
  **Date Ranges:**
  • \`ent --range 2025-01 2025-06\` — January through June
  • \`ent --range today yesterday\` — Yesterday and today
  • \`ent --range jan mar\` — January through March
  
  **Totals & Counting:**
  • \`ent today sum\` — Today's total
  • \`ent aug --sum\` — August total  
  • \`ent 2025 --count\` — Count this year's entries
  • \`ent --business Personal --count --sum\` — Personal count and total
  • \`ent --account Coffee --sum\` — Total coffee expenses
  
  **Smart Examples:**
  • \`ent yesterday --vendor Starbucks\` — Yesterday's Starbucks purchases
  • \`ent aug --business Channel60 sum\` — August Channel60 total
  • \`ent 2024 --vendor coffee count\` — Count 2024 coffee purchases
  • \`ent --range jan today --business Personal\` — Personal entries this year
  • \`ent --account Expenses:Food --business Personal\` — Personal food expenses
  • \`ent --account Assets --vendor ATM\` — ATM withdrawals from asset accounts
  
  **All Features:**
  • **Date aliases:** today, yesterday, year (2025), month names (jan, feb, etc.)
  • **Ranges:** \`--range start end\` with dates, months, or aliases
  • **Navigation:** \`go <id>\` to jump to specific entry
  • **Filtering:** \`--business\`, \`--vendor\`, \`--account\` with flexible matching
  • **Counting:** \`--count\`, \`--sum\` for totals and statistics
  • **Sorting:** \`date\`/\`created\` + \`asc\`/\`desc\`
  
  **Account Filtering:**
  • \`--account Coffee\` — Partial matching (any account with "Coffee")
  • \`--account Expenses:Personal:Food\` — Hierarchical matching
  • \`--account Assets\` — All asset accounts
  • \`--account Liabilities:CreditCard\` — Specific liability account
  
  See \`help entries\` for full documentation.`,
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
      "Execute actual Ledger CLI commands against the synced .ledger file. Available in development mode only. Automatically syncs database to file before execution.",
    content: (
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => ledgerCliCommand(arg || "", pageCtx || "", cmds || {}, user || null),
    usage: `ledger <command> [args...]
  
  **Common Commands:**
  • \`ledger balance\` — Show account balances
  • \`ledger register\` — Show all transactions in register format
  • \`ledger bal Expenses\` — Balance for Expenses accounts only
  • \`ledger reg coffee\` — Register entries containing "coffee"
  • \`ledger accounts\` — List all account names
  • \`ledger payees\` — List all payees/vendors
  • \`ledger stats\` — Show ledger statistics
  
  **Advanced Examples:**
  • \`ledger bal --monthly\` — Monthly balance report
  • \`ledger reg --period "last 30 days"\` — Recent transactions
  • \`ledger bal Expenses:Personal\` — Personal expenses only
  • \`ledger reg --begin 2025-08-01\` — Transactions since August 1st
  • \`ledger bal --depth 2\` — Balance to depth 2 accounts
  
  **Business Filtering:**
  • \`ledger bal Expenses:MyBrick\` — MyBrick business expenses
  • \`ledger reg Expenses:Personal:Food\` — Personal food expenses
  • \`ledger bal Liabilities\` — All liabilities (credit cards, etc.)
  
  **Features:**
  • Auto-syncs database to \`.ledger\` file before execution
  • Full Ledger CLI power with your data
  • Development mode only for security
  • Formatted output with syntax highlighting
  
  **Note:** Requires Ledger CLI installed and available in PATH`,
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
      "Create a new double-entry ledger transaction from natural language. Uses intuitive @ syntax for vendors and --flags for options. Automatically categorizes expenses and supports multiple businesses.",
    usage: `new [business:]<items> [@ vendor] [--options]
  
  **Syntax:**
  • **Items:** \`<description> <amount>[, <description> <amount>...]\`
  • **Vendor:** \`@ VendorName\` (like email addresses)
  • **Business:** \`BusinessName:\` (prefix) or \`--business BusinessName\`
  • **Options:** \`--payment\`, \`--memo\`, \`--date\`
  
  **Basic Examples:**
  • \`new coffee 150\` — Simple expense (defaults to Personal business)
  • \`new coffee 150 @ Starbucks\` — With vendor
  • \`new coffee $6, pastry $4 @ Starbucks\` — Multiple items
  • \`new supplies 500 @ HomeDepot --payment cash\` — With payment method
  
  **Business Context:**
  • \`new MyBrick: supplies 300 @ supplier\` — Prefix syntax
  • \`new coffee 150 @ Starbucks --business MyOnline\` — Flag syntax
  • No business specified defaults to "Personal"
  
  **Payment Methods:**
  • \`--payment cash\` → Assets:Cash (default)
  • \`--payment "credit card"\` → Liabilities:CreditCard
  • \`--payment paypal\` → Assets:PayPal
  • \`--payment "bank card"\` → Assets:Bank:Checking
  
  **Date & Other Options:**
  • \`--date yesterday\` — Use yesterday's date
  • \`--date 2025-08-10\` — Use specific date (YYYY-MM-DD format)
  • \`--date 2025/08/10\` — Alternative date format (YYYY/MM/DD)
  • \`--memo "client meeting"\` — Add memo/note
  • Currency auto-detected: \`$\` = USD, \`฿\` = THB
  
  **Full Examples:**
  • \`new coffee $6, lunch $12 @ Cafe --business Personal --payment "credit card" --memo "client meeting"\`
  • \`new Channel60: marketing 1000 @ Agency --payment cash --date yesterday\`
  • \`new subscription 50 @ Netflix --business Personal --memo "monthly" --date 2025-08-10\`
  
  **Account Mapping:**
  • Personal: \`Expenses:Personal:Food:Coffee\`
  • MyBrick: \`Expenses:MyBrick:Supplies:General\`  
  • MyOnline: \`Expenses:MyOnline:Subscription:Software\``,
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
