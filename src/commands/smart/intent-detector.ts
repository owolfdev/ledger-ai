// src/commands/smart/intent-detector.ts

import type { CommandMeta } from "./utils";
import { getNaturalLanguageCommands } from "./utils";

export interface IntentResult {
  shouldGenerateCommand: boolean;
  confidence: number;
  potentialCommands: string[];
  reasoning: string;
}

export class IntentDetector {
  private nlCommands: Record<string, CommandMeta>;

  // Common patterns that indicate command intent
  private readonly EXPENSE_PATTERNS = [
    /^i\s+(just\s+)?(bought|purchased|got|had|spent|paid)/i,
    /^bought\s+/i,
    /^purchased\s+/i,
    /^spent\s+.*\s+on/i,
    /^paid\s+.*\s+for/i,
    /^got\s+.*\s+for/i,
    /^had\s+.*\s+at/i,
    /expense/i,
    /transaction/i,
  ];

  private readonly QUERY_PATTERNS = [
    /^(show|list|display|find|get)\s+(me\s+)?(my\s+)?/i,
    /^what.*did\s+i\s+(spend|buy|purchase)/i,
    /^how\s+much.*did\s+i\s+(spend|pay)/i,
    /^(where|when)\s+did\s+i\s+(buy|spend|go)/i,
    /entries/i,
    /transactions/i,
    /balance/i,
    /total/i,
  ];

  private readonly EDIT_PATTERNS = [
    /^(change|update|edit|modify|fix|correct)/i,
    /^i\s+need\s+to\s+(change|update|edit|fix)/i,
    /wrong/i,
    /mistake/i,
    /incorrect/i,
  ];

  constructor(commandRegistry: Record<string, CommandMeta>) {
    this.nlCommands = getNaturalLanguageCommands(commandRegistry);
  }

  async detectIntent(input: string): Promise<IntentResult> {
    const trimmed = input.trim().toLowerCase();

    // Quick exit for very short inputs
    if (trimmed.length < 3) {
      return {
        shouldGenerateCommand: false,
        confidence: 0,
        potentialCommands: [],
        reasoning: "Input too short",
      };
    }

    // Check for direct command keywords first (if user types "entries" they probably want the command)
    const directCommandMatch = this.checkDirectCommandKeywords(trimmed);
    if (directCommandMatch.confidence > 0.8) {
      return directCommandMatch;
    }

    // Pattern-based detection
    const patternResult = this.checkPatterns(trimmed);
    if (patternResult.confidence > 0.7) {
      return patternResult;
    }

    // Registry-based pattern matching
    const registryResult = this.checkRegistryPatterns(trimmed);
    if (registryResult.confidence > 0.6) {
      return registryResult;
    }

    // Fallback: If it looks like a sentence describing an action, try AI
    const sentenceResult = this.checkSentenceStructure(trimmed);
    return sentenceResult;
  }

  private checkDirectCommandKeywords(input: string): IntentResult {
    const commandKeywords = Object.keys(this.nlCommands);

    for (const cmdKey of commandKeywords) {
      const meta = this.nlCommands[cmdKey];

      // Check if input contains command name or aliases
      const allNames = [cmdKey, ...(meta.aliases || [])];

      for (const name of allNames) {
        if (input.includes(name)) {
          return {
            shouldGenerateCommand: true,
            confidence: 0.9,
            potentialCommands: [cmdKey],
            reasoning: `Contains command keyword: ${name}`,
          };
        }
      }
    }

    return {
      shouldGenerateCommand: false,
      confidence: 0,
      potentialCommands: [],
      reasoning: "No direct command keywords found",
    };
  }

  private checkPatterns(input: string): IntentResult {
    let bestMatch: {
      patterns: RegExp[];
      command: string;
      confidence: number;
    } | null = null;

    // Check expense patterns for "new" command
    if (
      this.nlCommands.new &&
      this.matchesAnyPattern(input, this.EXPENSE_PATTERNS)
    ) {
      bestMatch = {
        patterns: this.EXPENSE_PATTERNS,
        command: "new",
        confidence: 0.8,
      };
    }

    // Check query patterns for "entries" command
    if (
      this.nlCommands.entries &&
      this.matchesAnyPattern(input, this.QUERY_PATTERNS)
    ) {
      const queryConfidence = 0.75;
      if (!bestMatch || queryConfidence > bestMatch.confidence) {
        bestMatch = {
          patterns: this.QUERY_PATTERNS,
          command: "entries",
          confidence: queryConfidence,
        };
      }
    }

    // Check edit patterns for "edit-entry" command
    if (
      this.nlCommands["edit-entry"] &&
      this.matchesAnyPattern(input, this.EDIT_PATTERNS)
    ) {
      const editConfidence = 0.7;
      if (!bestMatch || editConfidence > bestMatch.confidence) {
        bestMatch = {
          patterns: this.EDIT_PATTERNS,
          command: "edit-entry",
          confidence: editConfidence,
        };
      }
    }

    if (bestMatch) {
      return {
        shouldGenerateCommand: true,
        confidence: bestMatch.confidence,
        potentialCommands: [bestMatch.command],
        reasoning: `Matched pattern for ${bestMatch.command} command`,
      };
    }

    return {
      shouldGenerateCommand: false,
      confidence: 0,
      potentialCommands: [],
      reasoning: "No patterns matched",
    };
  }

  private checkRegistryPatterns(input: string): IntentResult {
    const matches: { command: string; confidence: number }[] = [];

    for (const [cmdKey, meta] of Object.entries(this.nlCommands)) {
      if (!meta.naturalLanguage) continue;

      for (const pattern of meta.naturalLanguage) {
        if (input.includes(pattern.toLowerCase())) {
          const confidence = this.calculatePatternConfidence(input, pattern);
          matches.push({ command: cmdKey, confidence });
        }
      }
    }

    if (matches.length > 0) {
      // Sort by confidence and get the best match
      matches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = matches[0];

      return {
        shouldGenerateCommand: true,
        confidence: bestMatch.confidence,
        potentialCommands: matches.slice(0, 3).map((m) => m.command), // Top 3 matches
        reasoning: `Matched registry pattern for ${bestMatch.command}`,
      };
    }

    return {
      shouldGenerateCommand: false,
      confidence: 0,
      potentialCommands: [],
      reasoning: "No registry patterns matched",
    };
  }

  private checkSentenceStructure(input: string): IntentResult {
    // Basic heuristics for sentence structure that might indicate a command intent
    const hasAmount = /\d+(?:\.\d+)?/.test(input);
    const hasVerb =
      /(bought|spent|paid|got|had|purchased|show|list|change|update)/i.test(
        input
      );
    const hasObject = input.split(" ").length > 3;

    let confidence = 0;

    if (hasVerb) confidence += 0.3;
    if (hasAmount) confidence += 0.2;
    if (hasObject) confidence += 0.1;

    // If it looks like a complete sentence with action words, worth trying AI
    if (confidence >= 0.4) {
      return {
        shouldGenerateCommand: true,
        confidence: Math.min(confidence, 0.6), // Cap at 0.6 for sentence structure
        potentialCommands: ["new", "entries", "edit-entry"], // Most likely commands
        reasoning: `Sentence structure suggests command intent (confidence: ${confidence.toFixed(
          2
        )})`,
      };
    }

    return {
      shouldGenerateCommand: false,
      confidence: 0,
      potentialCommands: [],
      reasoning: "Does not appear to be a command request",
    };
  }

  private matchesAnyPattern(input: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(input));
  }

  private calculatePatternConfidence(input: string, pattern: string): number {
    // Simple confidence calculation based on pattern match quality
    const patternWords = pattern.toLowerCase().split(" ");
    const inputWords = input.toLowerCase().split(" ");

    let matchedWords = 0;
    for (const patternWord of patternWords) {
      if (inputWords.some((inputWord) => inputWord.includes(patternWord))) {
        matchedWords++;
      }
    }

    const baseConfidence = matchedWords / patternWords.length;

    // Boost confidence if pattern appears early in the input
    const patternIndex = input.toLowerCase().indexOf(pattern.toLowerCase());
    if (patternIndex >= 0 && patternIndex < input.length * 0.3) {
      return Math.min(baseConfidence + 0.2, 1.0);
    }

    return Math.min(baseConfidence + 0.1, 1.0);
  }
}
