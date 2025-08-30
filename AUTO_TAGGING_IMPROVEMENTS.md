# Auto-Tagging System Improvements

## Overview

The auto-tagging system has been significantly improved to address the issue of irrelevant and redundant tags being applied to ledger entries. The previous system would apply tags like "street-food" and "food-court" to pantry purchases, which made no contextual sense.

## Key Improvements

### 1. Contextual Relevance Checking

The system now calculates a **relevance score** (0.0 to 1.0) for each tag based on:

- **Account path context** - Does the tag make sense for this account type?
- **Context mismatches** - Certain tag combinations are explicitly forbidden
- **Redundancy detection** - Tags that duplicate account information are deprioritized

### 2. Smart Filtering

- **Higher confidence threshold**: Increased from 20% to 30%
- **Contextual filtering**: Tags with relevance < 0.3 are rejected
- **Redundancy filtering**: Tags with relevance < 0.5 are rejected when account context is available
- **Maximum tags per posting**: Limited to 5 to prevent tag spam

### 3. Improved Scoring

Tags are now ranked using a weighted combination of:

- **Confidence** (40%): How well the tag matches the keywords
- **Relevance** (40%): How contextually appropriate the tag is
- **Priority** (20%): User-defined tag importance

## Configuration

The system is highly configurable through `src/lib/ledger/auto-tag-config.ts`:

### Context Mismatches

```typescript
CONTEXT_MISMATCHES: [
  // Food context mismatches
  {
    account: "pantry",
    tag: "street-food",
    relevance: 0.0,
    reason: "Pantry items are not street food",
  },
  {
    account: "pantry",
    tag: "food-court",
    relevance: 0.0,
    reason: "Pantry items are not from food courts",
  },
  // ... more rules
];
```

### Redundant Patterns

```typescript
REDUNDANT_PATTERNS: [
  {
    account: "pantry",
    tag: "pantry",
    reason: "Account path already indicates pantry",
  },
  // ... more patterns
];
```

### Thresholds

```typescript
MIN_CONFIDENCE: 40,                    // Minimum confidence score
MIN_RELEVANCE: 0.3,                    // Minimum relevance score
MIN_RELEVANCE_WITH_CONTEXT: 0.5,       // Higher threshold with account context
MAX_TAGS_PER_POSTING: 5,               // Maximum tags per posting
```

## Usage

### CLI Commands

The system includes a new CLI command for testing and management:

```bash
# Test how tags would be applied
auto-tag test "Villa Market" "Expenses:Personal:Food:Pantry:Oil"

# Show current rules
auto-tag rules

# Show tag statistics
auto-tag stats

# Get help
auto-tag help
```

### Example Output

```
🔍 Auto-tagging test for: "Villa Market"
📁 Account: Expenses:Personal:Food:Pantry:Oil

📋 Entry-level tags:
  1. market (shopping)
     Confidence: 100.0%, Relevance: 1.00

📋 Posting-level tags:
  1. oil (food)
     Confidence: 100.0%, Relevance: 1.00
  2. olive-oil (food)
     Confidence: 50.0%, Relevance: 0.80
```

## How It Solves Your Problem

### Before (Problematic)

```
Expenses:Personal:Food:Pantry:Oil +749.00฿ [street-food, food-court, oil, olive-oil, pantry]
```

**Issues:**

- `street-food` and `food-court` are contextually irrelevant for pantry purchases
- `pantry` is redundant since the account already indicates this
- Only `oil` and `olive-oil` are actually valuable

### After (Improved)

```
Expenses:Personal:Food:Pantry:Oil +749.00฿ [oil, olive-oil]
```

**Benefits:**

- Contextually irrelevant tags are filtered out
- Redundant tags are removed
- Only meaningful, value-adding tags remain

## Customization

### Adding New Context Mismatches

To prevent new inappropriate tag combinations:

```typescript
// In auto-tag-config.ts
CONTEXT_MISMATCHES: [
  // ... existing rules
  {
    account: "online",
    tag: "cash",
    relevance: 0.0,
    reason: "Online purchases cannot be cash",
  },
  {
    account: "premium",
    tag: "discount",
    relevance: 0.1,
    reason: "Premium items rarely have discounts",
  },
];
```

### Adjusting Thresholds

To make the system more or less strict:

```typescript
// More strict (fewer tags)
MIN_CONFIDENCE: 40,                    // Higher confidence required
MIN_RELEVANCE: 0.5,                    // Higher relevance required
MIN_RELEVANCE_WITH_CONTEXT: 0.7,       // Much higher with context

// Less strict (more tags)
MIN_CONFIDENCE: 20,                    // Lower confidence allowed
MIN_RELEVANCE: 0.2,                    // Lower relevance allowed
MIN_RELEVANCE_WITH_CONTEXT: 0.3,       // Lower with context
```

### Category-Specific Rules

Different tag categories can have different relevance thresholds:

```typescript
CATEGORY_RELEVANCE_THRESHOLDS: {
  'food': 0.4,        // Food tags need higher relevance
  'transportation': 0.5, // Transportation tags need very high relevance
  'entertainment': 0.3,  // Entertainment tags can be more flexible
  'health': 0.6,       // Health tags need very high relevance
  'default': 0.3,      // Default threshold for other categories
}
```

## Testing

### Test Specific Scenarios

```bash
# Test pantry purchase
auto-tag test "Olive Oil" "Expenses:Personal:Food:Pantry:Oil"

# Test restaurant meal
auto-tag test "Thai Restaurant" "Expenses:Personal:Food:Restaurant:Thai"

# Test online purchase
auto-tag test "Amazon Order" "Expenses:Personal:Shopping:Online:Electronics"
```

### Monitor Results

Use the `auto-tag stats` command to monitor:

- Total tags and usage
- Category distribution
- Priority distribution
- Overall system health

## Migration

The improved system is backward compatible. Existing entries will continue to work, but new entries will benefit from the improved tagging quality.

## Future Enhancements

Potential improvements for future versions:

- **Machine learning** for better relevance scoring
- **User feedback** to improve rules over time
- **Tag suggestions** based on similar transactions
- **Bulk tag cleanup** for existing entries
- **Tag relationship mapping** (e.g., "olive-oil" implies "oil")

## Support

If you encounter issues or want to customize the system further:

1. Check the current rules with `auto-tag rules`
2. Test specific scenarios with `auto-tag test`
3. Review the configuration in `auto-tag-config.ts`
4. Adjust thresholds and rules as needed

The system is designed to be self-documenting and easily adjustable without code changes.
