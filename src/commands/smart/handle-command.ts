//src/commands/smart/handle-command.ts
import type { CommandMeta } from "./utils";
import { TerminalOutputRendererProps } from "@/types/terminal";
import { getPublishedPosts } from "@/data/layer/blog";
import { createClient } from "@/utils/supabase/client";
import type { CachedBlogPost } from "@/types/blog";
import { setThemeClient } from "@/lib/theme-client";
import type { User } from "@/types/user";
// import { extractLedgerDateAndText } from "@/lib/ledger-date-parse";
// import * as chrono from "chrono-node";
// import { getLedgerDate } from "@/lib/ledger-date";
import { LEDGER_TIMEZONE } from "@/lib/ledger-config";
import { createLedgerEntry } from "@/app/actions/ledger/create-ledger-entry"; // <-- server action
import { syncLedgerFile } from "@/app/actions/ledger/sync-ledger-file";
import {
  autoBalanceLedgerEntry,
  LedgerLine,
} from "@/lib/ledger/auto-balance-ledger-entry";

type CommandMap = Record<string, CommandMeta>;
type PageEntry = { title: string; slug: string; route: string };

function cleanLedgerEntry(entry: string): string {
  return entry
    .replace(/^[*\s"]+/, "") // Remove leading *, spaces, quotes
    .replace(/```[a-z]*\n?/gi, "") // Remove code block starts
    .replace(/```$/, "") // Remove code block ends
    .trim();
}

function getLocalDate() {
  const now = new Date();
  // Extract year, month, day in the desired timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LEDGER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const yearPart = parts.find((p) => p.type === "year");
  const monthPart = parts.find((p) => p.type === "month");
  const dayPart = parts.find((p) => p.type === "day");

  if (!yearPart || !monthPart || !dayPart) {
    throw new Error("Could not parse date parts");
  }

  return `${yearPart.value}-${monthPart.value}-${dayPart.value}`; // e.g., "2025-08-07"
}

function parseFlags(arg: string) {
  const args = arg.split(/\s+/);
  const flags: Record<string, string> = {};
  const terms: string[] = [];
  let i = 0;

  while (i < args.length) {
    const word = args[i];
    // Handle --flag value
    if (word.startsWith("--")) {
      const key = word.slice(2).toLowerCase();
      if (args[i + 1] && !args[i + 1].startsWith("-")) {
        flags[key] = args[i + 1];
        i += 2;
        continue;
      }
      flags[key] = "";
      i++;
      continue;
    }

    // Handle flag:value, flag=value, flag: value, flag value
    const match = word.match(/^([a-zA-Z][\w-]*)[:=]?$/);
    if (match && args[i + 1] && !args[i + 1].startsWith("-")) {
      // If next word is a value, treat as flag value
      flags[match[1].toLowerCase()] = args[i + 1];
      i += 2;
      continue;
    }
    // Handle flag:value and flag=value (in same token)
    const keyval = word.match(/^([a-zA-Z][\w-]*)[:=](.+)$/);
    if (keyval) {
      flags[keyval[1].toLowerCase()] = keyval[2];
      i++;
      continue;
    }

    // If this is the last arg and is a number, treat as limit
    if (i === args.length - 1 && /^\d+$/.test(word)) {
      flags["limit"] = word;
      i++;
      continue;
    }

    // Otherwise, just add to terms
    terms.push(word);
    i++;
  }

  return { terms: terms.filter(Boolean), flags };
}

function matchTag(post: CachedBlogPost, tag: string): boolean {
  return post.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()) ?? false;
}

function matchCategory(post: CachedBlogPost, category: string): boolean {
  return (
    Array.isArray(post.categories) &&
    post.categories.some((c) => c.toLowerCase() === category.toLowerCase())
  );
}

function matchTerm(post: CachedBlogPost, term: string): boolean {
  const lcTerm = term.toLowerCase();
  return (
    post.title.toLowerCase().includes(lcTerm) ||
    (post.summary?.toLowerCase().includes(lcTerm) ?? false) ||
    (post.tags?.some((tag) => tag.toLowerCase().includes(lcTerm)) ?? false)
  );
}

// function hasCategory(post: unknown): post is { category: string } {
//   return (
//     typeof post === "object" &&
//     post !== null &&
//     "category" in post &&
//     typeof (post as { category?: unknown }).category === "string"
//   );
// }

// function hasCategories(post: unknown): post is { categories: string[] } {
//   return (
//     typeof post === "object" &&
//     post !== null &&
//     "categories" in post &&
//     Array.isArray((post as { categories?: unknown }).categories)
//   );
// }

// --- AI fallback utility ---
async function processAiPrompt(
  cmd: string,
  setHistory: React.Dispatch<
    React.SetStateAction<TerminalOutputRendererProps[]>
  >,
  history: TerminalOutputRendererProps[],
  commands: Record<string, CommandMeta>,
  pageContext?: string
) {
  setHistory((h) => [
    ...h,
    { type: "input", content: `$ ${cmd}` },
    { type: "output", content: "_Thinking..._", format: "markdown" },
  ]);
  const posts = await getPublishedPosts();

  function extractAIHistory(history: TerminalOutputRendererProps[]) {
    const result: { role: "user" | "assistant"; content: string }[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const userEntry = history[i];
      const aiEntry = history[i + 1];
      if (
        userEntry.type === "input" &&
        aiEntry.type === "output" &&
        aiEntry.format === "markdown" &&
        !aiEntry.content.startsWith("Unknown command:")
      ) {
        result.push({
          role: "user",
          content: userEntry.content.replace("$ ", ""),
        });
        result.push({ role: "assistant", content: aiEntry.content });
      }
    }
    return result.slice(-20);
  }
  const aiHistory = extractAIHistory(history);
  const systemPrompt = `
You are the helpful developer assistant for OWolf.com.
You must only suggest commands that are allowed in the command registry.
Output trusted components like <my-alert ... /> if useful.
Never suggest generic shell/Unix commands.
If a question relates to site content, recommend relevant blog posts with markdown links.

Here is the page context:
${pageContext || ""}

Here are the available commands:
${Object.entries(commands)
  .map(([name, meta]) => `- ${name}: ${meta.description || ""}`)
  .join("\n")}
`;

  const safeCommands = Object.fromEntries(
    Object.entries(commands).map(([k, v]) => [
      k,
      { description: v.description ?? "" },
    ])
  );

  const response = await fetch("/api/openai", {
    method: "POST",
    body: JSON.stringify({
      prompt: cmd,
      systemPrompt,
      history: aiHistory,
      posts: posts.slice(0, 5),
      commands: safeCommands,
      pageContext,
    }),
  });

  if (response.status === 429) {
    const data = await response.json();
    console.log("RATE LIMITED:", data); // Debug!
    setHistory((h) => [
      ...h.slice(0, -1),
      {
        type: "output",
        content: `<custom-alert message="${
          data.error || "You’ve reached the limit. Try again later."
        }" />`,
        format: "markdown",
      },
    ]);
    return;
  }

  if (!response.body) {
    setHistory((h) => [
      ...h.slice(0, -1),
      {
        type: "output",
        content: "<my-alert message='No response from AI.' />",
        format: "markdown",
      },
    ]);
    return;
  }

  // Stream output to terminal
  const reader = response.body.getReader();
  let buffer = "";
  let result = "";
  const decoder = new TextDecoder();
  setHistory((h) => h.slice(0, -1)); // Remove "Thinking..."

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const json = trimmed.replace(/^data:\s*/, "");
      if (!json || json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content ?? "";
        if (content) {
          result += content;
          setHistory((h) => {
            const next = [...h];
            if (next.length > 0 && next[next.length - 1].type === "output") {
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: result,
              };
              return next;
            }
            return [
              ...next,
              { type: "output", content: result, format: "markdown" },
            ];
          });
        }
      } catch {
        // skip
      }
    }
  }
}

export function createHandleCommand(
  commands: CommandMap,
  routes: Record<string, string> = {},
  pageContext?: string,
  pagesList: PageEntry[] = [],
  currentSlug?: string,
  postType?: "blog" | "project"
) {
  return async function handleCommand(
    cmd: string,
    setHistory: React.Dispatch<
      React.SetStateAction<TerminalOutputRendererProps[]>
    >,
    router: { push: (route: string) => void },
    user?: User | null, // <--- accept full user, not just ID
    history?: TerminalOutputRendererProps[]
  ): Promise<boolean> {
    const trimmed = cmd.trim();
    const [rawBase, ...rest] = trimmed.split(" ");
    const base = (rawBase || "").toLowerCase(); // 👈 Lowercase the command name!
    const arg = rest.join(" ");
    // ----------- Side-effect/Imperative Commands ----------- //

    if (base === "dark" && commands[base]) {
      setThemeClient("dark");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: "🌙 Switched to **dark mode**.",
          format: "markdown",
        },
      ]);
      return true;
    }

    if (base === "light" && commands[base]) {
      setThemeClient("light");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: "🔆 Switched to **light mode**.",
          format: "markdown",
        },
      ]);
      return true;
    }

    // --- Enhanced: Back and Forward commands ---
    if (
      base === "back" ||
      (base === "go" && arg.trim().toLowerCase() === "back")
    ) {
      window.history.back();
      return true;
    }

    if (
      base === "forward" ||
      (base === "go" && arg.trim().toLowerCase() === "forward")
    ) {
      window.history.forward();
      return true;
    }
    // Clear terminal history
    if (base === "clear") {
      setHistory([]);
      return true;
    }

    // Clear all terminal histories from localStorage
    if (base === "clearall") {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("terminal_key_"))
        .forEach((k) => localStorage.removeItem(k));
      setHistory([]);
      return true;
    }

    // Go to a page by slug/title/route — now with fuzzy matching!
    if (base === "go") {
      const dest = arg.toLowerCase().trim();

      // 1. Try exact match (route, slug, title)
      let page = pagesList.find(
        (p) =>
          p.route.toLowerCase() === dest ||
          p.slug.toLowerCase() === dest ||
          p.title.toLowerCase() === dest
      );

      // 2. Fuzzy: find all pages where slug, route, or title includes dest
      if (!page && dest.length > 0) {
        const fuzzy = pagesList.filter(
          (p) =>
            p.route.toLowerCase().includes(dest) ||
            p.slug.toLowerCase().includes(dest) ||
            p.title.toLowerCase().includes(dest)
        );

        if (fuzzy.length === 1) {
          page = fuzzy[0];
        } else if (fuzzy.length > 1) {
          setHistory([
            ...(history ?? []),
            { type: "input", content: cmd },
            {
              type: "output",
              content:
                "Multiple matches found:\n" +
                fuzzy.map((p) => `- [${p.title}](${p.route})`).join("\n") +
                "\n\nPlease refine your query.",
              format: "markdown",
            },
          ]);
          return true;
        }
      }

      // Special: 'home'
      if (!page && dest === "home") {
        page = pagesList.find((p) => p.route === "/");
      }

      if (page) {
        router.push(page.route);
        return true; // do NOT echo to history!
      } else {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          {
            type: "output",
            content: `Page not found: ${arg}`,
            format: "markdown",
          },
        ]);
        return true;
      }
    }

    // Scroll to top
    if (base === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    // Esc key - optional focus/fn
    if (base === "esc") {
      // Optional: Focus terminal input if implemented
      return true;
    }

    // Print working directory (shows pathname)
    if (base === "pwd") {
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        { type: "output", content: window.location.pathname },
      ]);
      return true;
    }

    // Supabase user
    if (base === "user") {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        let output: string;
        if (error) {
          output = "Failed to fetch user info.";
        } else if (!user) {
          output = "No user is currently logged in.";
        } else {
          output = `**User ID:** ${user.id}\n**Email:** ${user.email}`;
        }
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "output", content: output, format: "markdown" },
        ]);
      } catch (e) {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "error", content: "Failed to get user info." },
        ]);
      }
      return true;
    }

    // Supabase logout
    if (base === "logout") {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        let output: string;
        if (error) {
          output = `Logout failed: ${error.message}`;
        } else {
          output = "You have been signed out.";
        }
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "output", content: output, format: "markdown" },
        ]);
      } catch (e) {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "error", content: "Logout failed." },
        ]);
      }
      return true;
    }

    // --- CRUD/Posts Side-effect handlers (create, edit) ---
    if (base === "create" || commands[trimmed]?.content === "__CREATE_POST__") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let output = "";
        if (!user) {
          output =
            '<my-alert message="You must be logged in to create a post." />';
        } else {
          const parts = cmd.trim().split(" ").slice(1);
          const type = parts[0];
          const slug = parts.slice(1).join("-").toLowerCase();
          const targetUrl = slug
            ? `/post/create/${slug}?type=${encodeURIComponent(type)}`
            : "/post";
          window.location.href = targetUrl;
          output = `Navigating to ${targetUrl}...`;
        }
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "output", content: output, format: "markdown" },
        ]);
      } catch (e) {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "error", content: "Failed to create post." },
        ]);
      }
      return true;
    }

    if (base === "edit" || commands[trimmed]?.content === "__EDIT_POST__") {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let output = "";
        if (!user) {
          output =
            '<my-alert message="You must be logged in to edit a post." />';
        } else {
          const raw = cmd.trim().split(" ").slice(1).join(" ");
          const slug =
            raw.trim().length > 0
              ? raw.trim().toLowerCase().replace(/\s+/g, "-")
              : currentSlug; // or fallback as you prefer

          if (!slug) {
            output =
              '<my-alert message="Could not determine post slug. Please enter `edit my-post` or run this on a post page." />';
          } else {
            const targetUrl = `/post/edit/${slug}`;
            window.location.href = targetUrl;
            output = `Navigating to [edit ${slug}](${targetUrl})...`;
          }
        }
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "output", content: output, format: "markdown" },
        ]);
      } catch (e) {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "error", content: "Failed to edit post." },
        ]);
      }
      return true;
    }

    // ----------- Blog/Project DATA COMMANDS -----------
    // LIST COMMAND with optional limit
    if (base === "list" && commands[base]) {
      let posts = await getPublishedPosts();
      if (postType) posts = posts.filter((p) => p.type === postType); // 👈
      let limit = 0;
      // Try to parse the last argument as a number
      const args = arg.split(" ").filter(Boolean);
      if (args.length && /^\d+$/.test(args[args.length - 1])) {
        limit = parseInt(args[args.length - 1], 10);
        args.pop();
      }
      const items = posts
        .slice(0, limit > 0 ? limit : posts.length)
        .map((p) => `- [${p.title}](/blog/${p.slug})`)
        .join("\n");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: items || "No posts found.",
          format: "markdown",
        },
      ]);
      return true;
    }

    // LATEST COMMAND with optional limit
    if (base === "latest" && commands[base]) {
      let posts = await getPublishedPosts();
      if (postType) posts = posts.filter((p) => p.type === postType);
      let limit = 0;
      const args = arg.split(" ").filter(Boolean);
      if (args.length && /^\d+$/.test(args[args.length - 1])) {
        limit = parseInt(args[args.length - 1], 10);
        args.pop();
      }
      const latest = posts
        .sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        )
        .slice(0, limit > 0 ? limit : 10)
        .map((p) => `- [${p.title}](/blog/${p.slug})`)
        .join("\n");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: latest || "No posts found.",
          format: "markdown",
        },
      ]);
      return true;
    }

    // POPULAR COMMAND with optional limit
    if (base === "popular" && commands[base]) {
      let posts = await getPublishedPosts();
      if (postType) posts = posts.filter((p) => p.type === postType);
      let limit = 0;
      const args = arg.split(" ").filter(Boolean);
      if (args.length && /^\d+$/.test(args[args.length - 1])) {
        limit = parseInt(args[args.length - 1], 10);
        args.pop();
      }
      const popular = posts
        .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
        .slice(0, limit > 0 ? limit : 10)
        .map((p) => `- [${p.title}](/blog/${p.slug})`)
        .join("\n");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: popular || "No posts found.",
          format: "markdown",
        },
      ]);
      return true;
    }

    if (base === "search" && commands[base]) {
      const { terms, flags } = parseFlags(arg);

      const term = terms.join(" ").trim().toLowerCase();
      let posts = await getPublishedPosts();
      if (postType) posts = posts.filter((p) => p.type === postType);

      // Tag flag
      if (flags.tag) {
        posts = posts.filter((p) => matchTag(p, flags.tag));
      }

      // Category flag
      if (flags.category) {
        posts = posts.filter((p) => matchCategory(p, flags.category));
      }

      // Term keyword
      if (term) {
        posts = posts.filter((p) => matchTerm(p, term));
      }

      // Sort flag
      if (flags.sort === "date") {
        posts = posts.sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        );
      } else if (flags.sort === "likes") {
        posts = posts.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
      }

      // Limit flag
      const limit = Number(flags.limit) || posts.length;
      posts = posts.slice(0, limit);

      const filtered = posts
        .map((p) => `- [${p.title}](/blog/${p.slug})`)
        .join("\n");
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: filtered || `No posts found matching: ${term}`,
          format: "markdown",
        },
      ]);
      return true;
    }

    // AI USAGE COMMAND
    if ((base === "aiusage" || base === "quota") && commands[base]) {
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: "_Checking AI usage..._",
          format: "markdown",
        },
      ]);
      try {
        const res = await fetch("/api/ai-usage");
        const data = await res.json();
        setHistory((h) => [
          ...h.slice(0, -1),
          {
            type: "output",
            content: `You have used **${data.count}** of your hourly AI requests (limit: 20).`,
            format: "markdown",
          },
        ]);
      } catch (err) {
        console.error("❌ Failed to fetch AI usage quota:", err);
        setHistory((h) => [
          ...h.slice(0, -1),
          {
            type: "output",
            content: "Could not fetch AI usage quota.",
            format: "markdown",
          },
        ]);
      }
      return true;
    }

    // COUNT COMMAND
    if (base === "count" && commands[base]) {
      const { flags, terms } = parseFlags(arg);

      // Prefer --type flag, fallback to arg as type (e.g. `count blog`)
      const type =
        flags.type || (terms.length > 0 ? terms[0].toLowerCase() : undefined);

      let posts = await getPublishedPosts();
      if (type) posts = posts.filter((p) => p.type === type);

      const typeMsg = type ? `of type \`${type}\`` : "";
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: `There ${posts.length === 1 ? "is" : "are"} **${
            posts.length
          }** published post${posts.length !== 1 ? "s" : ""} ${typeMsg}.`,
          format: "markdown",
        },
      ]);
      return true;
    }

    // --- UPDATE command ---
    if (base === "update" && commands[base]) {
      let posts = await getPublishedPosts();
      if (postType) posts = posts.filter((p) => p.type === postType);
      const latest = posts
        .sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        )
        .slice(0, 10)
        .map((p) => `- [${p.title}](/blog/${p.slug})`)
        .join("\n");

      // Clear history and show latest posts
      setHistory([
        { type: "input", content: cmd },
        {
          type: "output",
          content: latest || "No posts found.",
          format: "markdown",
        },
      ]);
      return true;
    }

    // CACHE COMMAND //
    if (
      (base === "cache" || base === "cache-posts") &&
      (commands[base] || commands[trimmed]?.content === "__CACHE_POSTS__")
    ) {
      try {
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          {
            type: "output",
            content: "_Regenerating posts cache..._",
            format: "markdown",
          },
        ]);
        // Optional: if in Node.js, run generatePostsCache()
        // Otherwise, just call an API endpoint or shell script.
        await fetch("/api/admin/cache-posts", { method: "POST" });
        setHistory((h) => [
          ...h,
          {
            type: "output",
            content: "✅ Posts cache regenerated.",
            format: "markdown",
          },
        ]);
      } catch (err) {
        console.error("❌ Failed to regenerate posts cache:", err);
        setHistory((h) => [
          ...h,
          {
            type: "output",
            content: "❌ Failed to regenerate posts cache.",
            format: "markdown",
          },
        ]);
      }
      return true;
    }

    // --- NEW: LEDGER ENTRY from plain language ---

    if (base === "new" && commands[base]) {
      setHistory([
        ...(history ?? []),
        { type: "input", content: cmd },
        {
          type: "output",
          content: "_Creating Ledger entry..._",
          format: "markdown",
        },
      ]);

      const today = getLocalDate();

      // --- 1. Build AI prompt ---
      const ledgerPrompt = `
You are a Ledger CLI entry formatter.

- Output a valid, balanced Ledger CLI entry for each input.
- Date must be in YYYY/MM/DD (slash) format (not dash). Today's date is ${today}.
- No asterisks or quotes in the payee.
- The payee should be just the merchant name (e.g. Starbucks).
- Expenses must be positive; Assets:Cash must be negative.
- The entry **must balance exactly**: all expense and asset lines must sum to zero.
- The sum of all expense lines (including tax) must exactly match the total amount paid.
- If there is a rounding difference, adjust the smallest line or add an Expenses:Personal:Misc line to ensure the entry balances.
- Align amounts as in the example.
- Output only the ledger entry—no code blocks, no commentary, nothing else.
- Use granular subcategories where possible, based on context.
- Categorize as business or personal as appropriate; default to personal.
- If unable to classify a purchase, use Expenses:Personal:Misc.
- Timezone: Asia/Bangkok

Example:
2025/08/06 Starbucks
    Expenses:Personal:Food:Coffee    $5.00
    Assets:Cash           -$5.00

Input: ${arg}
`.trim();

      // --- 2. Generate the ledger entry using OpenAI ---
      let ledgerEntry = "";
      const openaiRes = await fetch("/api/openai", {
        method: "POST",
        body: JSON.stringify({
          prompt: ledgerPrompt,
          systemPrompt: "You are an expert at writing Ledger CLI entries.",
        }),
      });

      if (openaiRes.body) {
        const reader = openaiRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) buffer += decoder.decode(value, { stream: !done });
        }
        ledgerEntry = buffer
          .split("\n")
          .map((line) => {
            if (!line.startsWith("data:")) return "";
            if (line.includes("[DONE]")) return "";
            try {
              const j = JSON.parse(line.replace(/^data:\s*/, ""));
              return j.choices?.[0]?.delta?.content || "";
            } catch {
              return "";
            }
          })
          .join("");
      } else {
        ledgerEntry = await openaiRes.text();
      }

      ledgerEntry = ledgerEntry
        .replace(/```[a-z]*\n?/gi, "")
        .replace(/```$/, "")
        .trim();

      ledgerEntry = cleanLedgerEntry(ledgerEntry);

      // Helper to parse ledger lines (excluding date/payee line)
      function parseLedgerLines(entry: string): LedgerLine[] {
        // Skips first line (date/payee), expects: '    Account             $Amount'
        return entry
          .split("\n")
          .slice(1)
          .map((line) => {
            const m = line.trim().match(/^([A-Za-z:]+)\s+(-?\$?\d+\.\d{2})$/);
            if (!m) return null;
            return {
              account: m[1],
              amount: parseFloat(m[2].replace("$", "")),
            };
          })
          .filter(Boolean) as LedgerLine[];
      }

      function formatLedgerLines(
        dateLine: string,
        lines: LedgerLine[]
      ): string {
        return [
          dateLine,
          ...lines.map(
            (l) =>
              `    ${l.account.padEnd(30)}${
                l.amount >= 0 ? " " : ""
              }$${l.amount.toFixed(2)}`
          ),
        ].join("\n");
      }

      // ---- Insert auto-balance step ----
      const lines = ledgerEntry.split("\n");
      const dateLine = lines[0];
      const parsedLines = parseLedgerLines(ledgerEntry);

      let balancedLines: LedgerLine[];
      try {
        balancedLines = autoBalanceLedgerEntry(parsedLines); // will throw if not balanceable
        ledgerEntry = formatLedgerLines(dateLine, balancedLines);
      } catch (e) {
        // Handle (show user, etc.)
        ledgerEntry += "\n; ⚠️ Entry not balanced: " + (e as Error).message;
      }

      // --- 3. Show ledger code block in UI (unchanged)
      setHistory((h) => [
        ...h.slice(0, -1),
        {
          type: "output",
          content: "```ledger\n" + ledgerEntry + "\n```",
          format: "markdown",
        },
      ]);

      // --- 3. Show ledger code block in UI ---
      setHistory((h) => [
        ...h.slice(0, -1),
        {
          type: "output",
          content: "```ledger\n" + ledgerEntry + "\n```",
          format: "markdown",
        },
      ]);

      // --- 4. Save to Supabase via server action ---
      let saveResult = "";
      try {
        // Optionally pass business_id if you have it in context
        await createLedgerEntry({
          entry_text: ledgerEntry,
          entry_raw: arg,
          // business_id: businessId || null, // add this if you track business in UI
        });
        await syncLedgerFile();
        saveResult = "_✅ Entry saved to your ledger (Supabase)_";
      } catch (e: unknown) {
        if (e instanceof Error) {
          saveResult = `<my-alert message="❌ Error saving to ledger: ${e.message}" />`;
        } else {
          saveResult = `<my-alert message="❌ Error saving to ledger: Unknown error" />`;
        }
      }

      setHistory((h) => [
        ...h,
        { type: "output", content: saveResult, format: "markdown" },
      ]);
      return true;
    }

    // ----------- DATA-DRIVEN COMMANDS (must be in allowed set) ----------- //

    // Blog/project commands (logic only enabled if in allowed set)
    if (commands[base]) {
      // Don't display special handler tokens as output
      const cmdMeta = commands[base];
      if (
        typeof cmdMeta.content === "string" &&
        cmdMeta.content.startsWith("__") &&
        cmdMeta.content.endsWith("__")
      ) {
        // Handler token—show description or generic
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          {
            type: "output",
            content: cmdMeta.description || "Command executed.",
            format: "markdown",
          },
        ]);
        return true;
      } else {
        // Normal command (string or function output)
        const output =
          typeof cmdMeta.content === "function"
            ? await cmdMeta.content(arg, pageContext, commands, user)
            : cmdMeta.content;
        setHistory([
          ...(history ?? []),
          { type: "input", content: cmd },
          { type: "output", content: output ?? "", format: "markdown" },
        ]);
        return true;
      }
    }

    // ----------- AI Fallback: unknown or not allowed ----------- //
    await processAiPrompt(
      cmd,
      setHistory,
      history || [],
      commands,
      pageContext
    );
    return true;
  };
}
