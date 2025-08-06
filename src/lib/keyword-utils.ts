import { STOPWORDS } from "./stopwords";

/**
 * Extracts the first N significant keywords from a given text.
 * Removes punctuation, lowercases words, and excludes common stopwords.
 *
 * @param text Input text (e.g., question or sentence)
 * @param count Maximum number of keywords to return
 * @returns Array of cleaned, relevant words
 */
export function extractSignificantWords(text: string, count = 20): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ""))
    .filter((word) => word && !STOPWORDS.includes(word))
    .slice(0, count);
}
