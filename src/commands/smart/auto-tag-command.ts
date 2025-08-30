/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ledger/auto-tag-command.ts
// CLI command to test and manage the auto-tagging system

import { createClient } from "@/utils/supabase/client";
import {
  autoTagEntry,
  findMatchingTags,
  extractKeywords,
  extractAccountKeywords,
} from "@/lib/ledger/auto-tagger";
import { AUTO_TAG_CONFIG } from "@/lib/ledger/auto-tag-config";

export async function autoTagCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, any>,
  user?: any
): Promise<string> {
  if (!user) {
    return "❌ Authentication required for auto-tagging operations";
  }

  const args = arg?.trim().split(/\s+/) || [];
  const command = args[0]?.toLowerCase();

  // Debug: Log the incoming command
  console.log("Debug - autoTagCommand called with:", { arg, args, command });

  switch (command) {
    case "test":
      return await testAutoTagging(args.slice(1));
    case "rules":
      return await showAutoTaggingRules();
    case "stats":
      return await showAutoTaggingStats();
    case "debug":
      return await debugDatabase();
    case "help":
      return getAutoTagHelp();
    default:
      return getAutoTagHelp();
  }
}

async function testAutoTagging(args: string[]): Promise<string> {
  if (args.length < 2) {
    return "❌ Usage: auto-tag test <description> <account_path>\nExample: auto-tag test 'Villa Market' 'Expenses:Personal:Food:Pantry:Oil'";
  }

  // Handle quoted arguments properly
  let description = args[0];
  let accountPath = args[1];

  // If we have more than 2 args, the description might be split
  if (args.length > 2) {
    // Find where the account path starts (look for Expenses: or similar)
    const accountIndex = args.findIndex(
      (arg) =>
        arg.startsWith("Expenses:") ||
        arg.startsWith("Assets:") ||
        arg.startsWith("Liabilities:") ||
        arg.startsWith("Income:")
    );

    if (accountIndex !== -1) {
      description = args.slice(0, accountIndex).join(" ");
      accountPath = args.slice(accountIndex).join(" ");
    }
  }

  // Clean up quotes if present
  description = description.replace(/^['"]|['"]$/g, "");
  accountPath = accountPath.replace(/^['"]|['"]$/g, "");

  // Debug: Log what we're working with
  console.log("Debug - Raw args:", args);
  console.log("Debug - Parsed description:", description);
  console.log("Debug - Parsed accountPath:", accountPath);

  // FIXED: Better argument parsing for quoted strings
  // The issue is that the CLI is passing "Villa, Market" as a single argument
  // We need to handle comma-separated descriptions and find the account path

  // First, check if the first argument contains a comma (like "Villa, Market")
  if (args[0] && args[0].includes(",")) {
    // Split by comma and clean up
    const descriptionParts = args[0].split(",").map((part) => part.trim());
    description = descriptionParts.join(" ");
    console.log("Debug - Fixed comma-separated description:", description);
  }

  // Now find where the account path starts
  const accountIndex = args.findIndex(
    (arg) =>
      arg.startsWith("Expenses:") ||
      arg.startsWith("Assets:") ||
      arg.startsWith("Liabilities:") ||
      arg.startsWith("Income:")
  );

  if (accountIndex !== -1) {
    accountPath = args[accountIndex];
    console.log("Debug - Found account path at index:", accountIndex);
  }

  // If we still don't have a proper account path, try to reconstruct from remaining args
  if (!accountPath || accountPath === "Market") {
    const remainingArgs = args
      .slice(1)
      .filter(
        (arg) =>
          arg.startsWith("Expenses:") ||
          arg.startsWith("Assets:") ||
          arg.startsWith("Liabilities:") ||
          arg.startsWith("Income:")
      );

    if (remainingArgs.length > 0) {
      accountPath = remainingArgs[0];
      console.log("Debug - Reconstructed account path:", accountPath);
    }
  }

  // Add visible debug output to the terminal
  let debugOutput = `\n🔍 Debug Info:\n`;
  debugOutput += `  Raw args: [${args.join(", ")}]\n`;
  debugOutput += `  Parsed description: "${description}"\n`;
  debugOutput += `  Parsed accountPath: "${accountPath}"\n`;
  debugOutput += `  Args length: ${args.length}\n`;

  try {
    // Extract keywords from description and account path
    const descriptionKeywords = extractKeywords(description);
    const accountKeywords = extractAccountKeywords(accountPath);

    // Debug output
    let output = `🔍 Auto-tagging test for: "${description}"\n`;
    output += `📁 Account: ${accountPath}\n\n`;
    output += debugOutput; // Add debug info
    output += `🔍 Extracted keywords:\n`;
    output += `  Description: [${descriptionKeywords.join(", ")}]\n`;
    output += `  Account: [${accountKeywords.join(", ")}]\n\n`;

    // Test database connectivity
    try {
      const supabase = createClient();

      // First, try a simple query without filters
      const { data: allTags, error: allTagsError } = await supabase
        .from("tags")
        .select("id, name, is_active")
        .limit(5);

      if (allTagsError) {
        output += `⚠️ Database connection issue: ${allTagsError.message}\n\n`;
      } else {
        output += `📊 Database: Found ${
          allTags?.length || 0
        } tags (sample query)\n`;
        if (allTags && allTags.length > 0) {
          output += "Sample tags:\n";
          allTags.forEach((tag, index) => {
            output += `  ${index + 1}. ${tag.name} [${
              tag.is_active ? "active" : "inactive"
            }]\n`;
          });
        }
        output += "\n";
      }

      // Now try the filtered query
      const { data: activeTags, error: activeTagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("is_active", true)
        .limit(5);

      if (activeTagsError) {
        output += `⚠️ Active tags query error: ${activeTagsError.message}\n\n`;
      } else {
        output += `📊 Active tags: Found ${
          activeTags?.length || 0
        } active tags\n\n`;
      }
    } catch (dbError) {
      output += `⚠️ Database error: ${dbError}\n\n`;
    }

    // Test entry-level tagging
    const entryTags = await findMatchingTags(descriptionKeywords, {
      entryDescription: description,
    });

    // Test posting-level tagging
    const postingTags = await findMatchingTags(accountKeywords, {
      accountPath: accountPath,
      entryDescription: description,
    });

    // Continue building output

    // Entry-level tags
    output += "📋 Entry-level tags:\n";
    if (entryTags.length === 0) {
      output += "  No tags found\n";
    } else {
      entryTags.forEach((tag, index) => {
        output += `  ${index + 1}. ${tag.name} (${tag.category})\n`;
        output += `     Confidence: ${tag.confidence.toFixed(
          1
        )}%, Relevance: ${tag.relevance.toFixed(2)}\n`;
      });
    }

    output += "\n📋 Posting-level tags:\n";
    if (postingTags.length === 0) {
      output += "  No tags found\n";
    } else {
      postingTags.forEach((tag, index) => {
        output += `  ${index + 1}. ${tag.name} (${tag.category})\n`;
        output += `     Confidence: ${tag.confidence.toFixed(
          1
        )}%, Relevance: ${tag.relevance.toFixed(2)}\n`;
      });
    }

    return output;
  } catch (error) {
    return `❌ Error testing auto-tagging: ${error}`;
  }
}

async function showAutoTaggingRules(): Promise<string> {
  let output = "📋 Auto-tagging Rules & Configuration\n\n";

  // Confidence thresholds
  output += "🎯 Confidence Thresholds:\n";
  output += `  • Minimum confidence: ${AUTO_TAG_CONFIG.MIN_CONFIDENCE}%\n`;
  output += `  • Minimum relevance: ${AUTO_TAG_CONFIG.MIN_RELEVANCE}\n`;
  output += `  • With context: ${AUTO_TAG_CONFIG.MIN_RELEVANCE_WITH_CONTEXT}\n`;
  output += `  • Max tags per posting: ${AUTO_TAG_CONFIG.MAX_TAGS_PER_POSTING}\n\n`;

  // Context mismatches
  output += "❌ Context Mismatches (never apply):\n";
  AUTO_TAG_CONFIG.CONTEXT_MISMATCHES.forEach((rule, index) => {
    output += `  ${index + 1}. ${rule.account} + ${rule.tag} → ${
      rule.relevance
    } (${rule.reason})\n`;
  });

  output += "\n⚠️ Redundant Patterns (low relevance):\n";
  AUTO_TAG_CONFIG.REDUNDANT_PATTERNS.forEach((rule, index) => {
    output += `  ${index + 1}. ${rule.account} + ${rule.tag} → 0.1 (${
      rule.reason
    })\n`;
  });

  output += "\n⚖️ Scoring Weights:\n";
  output += `  • Confidence: ${
    AUTO_TAG_CONFIG.SCORING_WEIGHTS.confidence * 100
  }%\n`;
  output += `  • Relevance: ${
    AUTO_TAG_CONFIG.SCORING_WEIGHTS.relevance * 100
  }%\n`;
  output += `  • Priority: ${
    AUTO_TAG_CONFIG.SCORING_WEIGHTS.priority * 100
  }%\n`;

  return output;
}

async function showAutoTaggingStats(): Promise<string> {
  try {
    const supabase = createClient();

    // Get tag statistics
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("id, name, category, priority, usage_count")
      .eq("is_active", true);

    if (tagsError) {
      return `❌ Error fetching tags: ${tagsError.message}`;
    }

    if (!tags || tags.length === 0) {
      return "📊 No tags found in database";
    }

    // Calculate statistics
    const totalTags = tags.length;
    const categories = new Map<string, number>();
    const priorityDistribution = new Map<number, number>();
    let totalUsage = 0;

    tags.forEach((tag) => {
      // Category distribution
      const category = tag.category || "uncategorized";
      categories.set(category, (categories.get(category) || 0) + 1);

      // Priority distribution
      const priority = tag.priority || 0;
      priorityDistribution.set(
        priority,
        (priorityDistribution.get(priority) || 0) + 1
      );

      // Total usage
      totalUsage += tag.usage_count || 0;
    });

    let output = "📊 Auto-tagging Statistics\n\n";

    output += `📈 Overview:\n`;
    output += `  • Total tags: ${totalTags}\n`;
    output += `  • Total usage: ${totalUsage}\n`;
    output += `  • Average usage: ${(totalUsage / totalTags).toFixed(1)}\n\n`;

    output += "🏷️ Categories:\n";
    const sortedCategories = Array.from(categories.entries()).sort(
      ([, a], [, b]) => b - a
    );

    sortedCategories.forEach(([category, count]) => {
      const percentage = ((count / totalTags) * 100).toFixed(1);
      output += `  • ${category}: ${count} (${percentage}%)\n`;
    });

    output += "\n⭐ Priority Distribution:\n";
    const sortedPriorities = Array.from(priorityDistribution.entries()).sort(
      ([a], [b]) => a - b
    );

    sortedPriorities.forEach(([priority, count]) => {
      const percentage = ((count / totalTags) * 100).toFixed(1);
      output += `  • Priority ${priority}: ${count} (${percentage}%)\n`;
    });

    return output;
  } catch (error) {
    return `❌ Error fetching statistics: ${error}`;
  }
}

async function debugDatabase(): Promise<string> {
  try {
    const supabase = createClient();

    // Check tags table
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("id, name, category, is_active")
      .limit(10);

    let output = "🔍 Database Debug Information\n\n";

    if (tagsError) {
      output += `❌ Tags table error: ${tagsError.message}\n`;
    } else {
      output += `📊 Tags table: Found ${tags?.length || 0} tags\n`;
      if (tags && tags.length > 0) {
        output += "Sample tags:\n";
        tags.forEach((tag, index) => {
          output += `  ${index + 1}. ${tag.name} (${
            tag.category || "no-category"
          }) [${tag.is_active ? "active" : "inactive"}]\n`;
        });
      }
    }

    // Check entry_tags table
    const { data: entryTags, error: entryTagsError } = await supabase
      .from("entry_tags")
      .select("id");

    if (entryTagsError) {
      output += `\n❌ Entry tags table error: ${entryTagsError.message}\n`;
    } else {
      output += `\n📊 Entry tags table: Found ${
        entryTags?.length || 0
      } entries\n`;
    }

    // Check posting_tags table
    const { data: postingTags, error: postingTagsError } = await supabase
      .from("posting_tags")
      .select("id");

    if (postingTagsError) {
      output += `\n❌ Posting tags table error: ${postingTagsError.message}\n`;
    } else {
      output += `\n📊 Posting tags table: Found ${
        postingTags?.length || 0
      } entries\n`;
    }

    return output;
  } catch (error) {
    return `❌ Debug error: ${error}`;
  }
}

function getAutoTagHelp(): string {
  return `🔧 Auto-tagging System Commands

Usage: auto-tag <command> [options]

Commands:
  test <description> <account>  Test how tags would be applied
  rules                        Show current auto-tagging rules
  stats                       Show tag statistics
  debug                       Show database debug information
  help                        Show this help message

Examples:
  auto-tag test "Villa Market" "Expenses:Personal:Food:Pantry:Oil"
  auto-tag rules
  auto-tag stats

The auto-tagging system uses contextual relevance to avoid irrelevant tags
like "street-food" on pantry purchases. Tags are scored by confidence,
relevance, and priority, then filtered to ensure quality.`;
}
