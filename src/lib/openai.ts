// lib/openai.ts

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-tWBwcBhd1GUknqp3DJsv8x0e",
});

export async function getEmbedding(text: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return res.data[0].embedding;
}

export async function chatWithContext(
  question: string,
  context: string[],
  onDelta?: (delta: string) => void
) {
  const MAX_WORDS = 10000;
  let combined = "";

  for (const chunk of context) {
    const testCombined = `${combined}\n\n${chunk}`;
    const wordCount = testCombined.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) break;
    combined = testCombined;
  }

  let result = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Use the following documentation to answer:\n${combined.trim()}`,
      },
      {
        role: "user",
        content: question,
      },
    ],
    max_tokens: 2000,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    result += content;
    if (onDelta) onDelta(content); // <-- optional callback for real-time UI
  }

  return result;
}
