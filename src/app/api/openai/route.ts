// app/api/openai/route.ts

import { NextRequest } from "next/server";
import { getClientIp } from "@/utils/openai/get-client-ip";
import { rateLimitByIp } from "@/utils/rate-limit-redis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export type KnowledgePost = {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  link?: string;
};
export type AIHistoryEntry = { role: "user" | "assistant"; content: string };
export type CommandMeta = { description?: string };
export type CommandsObject = Record<string, CommandMeta>;

export async function POST(req: NextRequest) {
  // --- Parse Request Body ---
  const {
    prompt,
    systemPrompt,
    history,
    posts,
    userId, // Unused now
    pageContext,
    commands = {}, // Expect plain object { [name]: { description } }
  }: {
    prompt: string;
    systemPrompt: string;
    history: AIHistoryEntry[];
    posts: KnowledgePost[];
    userId?: string;
    pageContext?: string;
    commands?: CommandsObject;
  } = await req.json();

  // --- Rate limiting (per IP, 20/hour) ---
  const ip = getClientIp(req);
  const limitKey = `ip:${ip}`;
  const { allowed } = await rateLimitByIp(limitKey, 20, 60 * 60);

  if (!allowed) {
    const message =
      "You’ve reached the hourly limit for AI responses. This app still works — type `help` to explore other commands.";
    return new Response(JSON.stringify({ error: message }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // --- Build OpenAI prompt context ---
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const contextPosts = (posts || [])
    .map(
      (p, i) =>
        `#${i + 1}: ${p.title}\n${p.description ?? ""}\nLink: ${
          p.link || `${siteUrl}/blog/${p.slug}`
        }\nTags: ${p.tags.join(", ")}`
    )
    .join("\n\n");

  const conversation = (history || [])
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const pageContextStr = pageContext
    ? `\n\n# CURRENT POST\nThis is the current blog post the user is viewing. When they refer to "this post" or "this", it refers to the following:\n\n${String(
        pageContext
      ).substring(0, 3000)}`
    : "";

  const commandsSection =
    commands && Object.keys(commands).length > 0
      ? `\n\n# Available Commands\n${Object.entries(commands)
          .map(
            ([cmd, meta]) =>
              `- \`${cmd}\`${meta?.description ? `: ${meta.description}` : ""}`
          )
          .join("\n")}`
      : "";

  const fullSystemPrompt = `${systemPrompt}

Here are some relevant articles from the site:
${contextPosts}${pageContextStr}${commandsSection}

Conversation:
${conversation}`;

  const fullPromptString = `${fullSystemPrompt}\n\nUser: ${prompt}`;
  const wordCount = fullPromptString.split(/\s+/).filter(Boolean).length;
      // console.log(`[OpenAI] Full Prompt Word Count: ${wordCount}`);

  // --- Prepare messages for OpenAI ---
  const messages = [
    { role: "system", content: fullSystemPrompt },
    { role: "user", content: prompt },
  ];

  // --- Stream from OpenAI ---
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      stream: true,
      max_tokens: 512,
    }),
  });

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
