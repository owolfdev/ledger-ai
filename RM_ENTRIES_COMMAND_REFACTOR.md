# Entries Command Refactor - Standardized Flag System

## Overview

The `ent` command (and aliases `entries`, `e`) has been refactored to use a consistent `--` prefix for all flags, improving UX and consistency. **NEW: Short flags added for mobile-friendly quick typing!**

## Before vs After

### Before (Inconsistent)

```bash
# Mixed flag styles
ent --business "Acme Corp" --sum
ent sum --business "Acme Corp"  # No -- prefix
ent go 123                      # No -- prefix
ent 50                          # Positional limit
ent created asc                 # No -- prefix for sort/dir
```

### After (Standardized + Short Flags)

```bash
# All flags use -- prefix
ent --business "Acme Corp" --sum
ent --sum --business "Acme Corp"
ent --go 123

# NEW: Short flags for quick typing
ent -b "Acme Corp" -s
ent -s -b "Acme Corp"
ent -g 123
```

## New Flag Structure

### Filtering Flags

- `--business <name>` / `-b <name>` - Filter by business account
- `--vendor <name>` / `-v <name>` - Filter by vendor/description
- `--account <pattern>` / `-A <pattern>` - Filter by account name
- `--currency <code>` / `-c <code>` - Filter by currency (USD, THB, EUR)

### Date Flags

- `--month <YYYY-MM|month_name>` / `-m <YYYY-MM|month_name>` - Filter by month
- `--day <YYYY-MM-DD>` / `-D <YYYY-MM-DD>` - Filter by specific day
- `--year <YYYY>` / `-y <YYYY>` - Filter by year
- `--range <start> <end>` / `-r <start> <end>` - Filter by date range

### Output Flags

- `--sum` / `-s` - Show totals with multi-currency breakdown
- `--count` / `-n` - Show count only
- `--go <id>` / `-g <id>` - Navigate to specific entry

### Sorting Flags

- `--sort <date|created>` / `-D <date|created>` - Sort by date or creation time
- `--dir <asc|desc>` / `-d <asc|desc>` - Sort direction
- `--limit <number>` / `-l <number>` - Limit number of results

## Smart Date Aliases (Still Supported)

```bash
ent today          # Today's entries
ent yesterday      # Yesterday's entries
ent 2025          # All 2025 entries
ent jan           # January entries (current year)
ent august        # August entries (current year)
```

## Examples

### Basic Usage

```bash
ent                           # Recent entries
ent --limit 50               # 50 most recent
ent -l 50                    # Short flag version
ent --sum                    # With totals
ent -s                       # Short flag version
ent --count                  # Count only
ent -n                       # Short flag version
```

### Filtering

```bash
ent --business Personal      # Personal business entries
ent -b Personal              # Short flag version
ent --vendor Starbucks      # Starbucks purchases
ent -v Starbucks            # Short flag version
ent --account Coffee        # Coffee-related accounts
ent -A Coffee               # Short flag version
ent --currency USD          # USD entries only
ent -c USD                  # Short flag version
```

### Date Filtering

```bash
ent today --sum             # Today with totals
ent today -s                # Short flag version
ent aug --business Personal # August personal entries
ent aug -b Personal         # Short flag version
ent --month 2025-01 --sum  # January 2025 with totals
ent -m 2025-01 -s           # Short flag version
ent --range jan mar         # January through March
ent -r jan mar              # Short flag version
```

### Navigation

```bash
ent --go 330               # Navigate to entry #330
ent -g 330                 # Short flag version
```

### Combined Filters

```bash
ent --business Personal --vendor coffee --sum
ent -b Personal -v coffee -s              # Short flags
ent --currency USD --month aug --count
ent -c USD -m aug -n                      # Short flags
ent --range 2025-01 2025-06 --business MyBrick --sum
ent -r 2025-01 2025-06 -b MyBrick -s     # Short flags
```

## Mobile-First Design

The short flags are designed for mobile users who want to type quickly:

```bash
# Instead of typing:
ent --business Personal --vendor coffee --sum

# Mobile users can type:
ent -b Personal -v coffee -s
```

## Backward Compatibility

- Numeric limits without `--limit` still work: `ent 50`
- Date aliases still work: `ent today`, `ent 2025`
- Currency codes still work: `ent USD`
- All existing long flags continue to work

## Benefits of New System

1. **Consistency** - All flags use `--` prefix
2. **Clarity** - Clear distinction between flags and values
3. **Extensibility** - Easy to add new flags
4. **Learning** - Users know all options start with `--`
5. **Documentation** - Easier to document and understand
6. **Mobile-Friendly** - Short flags for quick typing
7. **Professional** - Follows industry CLI standards

## Migration Guide

- `ent sum` → `ent --sum` or `ent -s`
- `ent count` → `ent --count` or `ent -n`
- `ent go 123` → `ent --go 123` or `ent -g 123`
- `ent 50` → `ent --limit 50` or `ent -l 50` (optional)
- `ent created asc` → `ent --sort created --dir asc` or `ent -D created -d asc`

## Registry Improvements

The command registry now includes:

- **📋 Quick Reference Tables** - All flags at a glance
- **📱 Mobile-Friendly Section** - Short flag examples
- **💡 Quick Examples** - Common use cases
- **🔧 Advanced Combinations** - Complex filtering examples
- **🔄 Backward Compatibility** - What still works

The new system maintains all existing functionality while providing a much more intuitive, consistent, and mobile-friendly user experience.
