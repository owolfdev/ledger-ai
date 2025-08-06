import { openai } from "@/lib/openai";

/**
 * Generates a concise, human-readable chat title using OpenAI.
 * @param message - The first user message in the chat.
 * @returns {Promise<string>} The generated title.
 */
export async function generateConversationTitle(
  message: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following user message as a short, human-friendly chat title (max 7 words, title case):",
        },
        { role: "user", content: message },
      ],
      max_tokens: 15,
      temperature: 0.5,
    });
    const raw = completion.choices[0]?.message?.content || "";
    // Fallback: Use first 40 chars if OpenAI fails
    const fallback = message.trim().replace(/\s+/g, " ").slice(0, 40);
    return raw.trim() || fallback;
  } catch {
    // Fallback: Use first 40 chars if OpenAI fails
    return message.trim().replace(/\s+/g, " ").slice(0, 40);
  }
}
