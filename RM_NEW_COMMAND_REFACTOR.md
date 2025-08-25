# New Command Refactor - Comprehensive Flag System

## Overview

The `new` command has been completely refactored to provide a comprehensive, consistent, and mobile-friendly flag system that matches the quality of the entries command.

## What Was Improved

### **Before (Limited Documentation)**

- Basic flag examples only
- Missing AI flags documentation
- Missing image flag documentation
- No short flags for mobile users
- Incomplete examples
- Hard to scan all options

### **After (Comprehensive & Consistent)**

- **📋 Quick Reference Tables** - All flags at a glance
- **📱 Mobile-Friendly Short Flags** - Quick typing on mobile
- **🤖 AI Categorization Flags** - Complete AI control options
- **🖼️ Image Support** - Documented image attachment
- **💡 Rich Examples** - From basic to advanced combinations
- **🔄 Backward Compatibility** - All existing functionality preserved

## New Flag Structure

### **Core Options**

- `--business <name>` / `-b <name>` - Set business context
- `--payment <method>` / `-p <method>` - Payment method
- `--memo <text>` / `-m <text>` - Add memo/note
- `--date <date>` / `-d <date>` - Set transaction date
- `--image <url>` / `-i <url>` - Attach image URL

### **AI Categorization**

- `--use-ai` / `-u` - Force AI categorization (default)
- `--no-ai` / `-n` - Disable AI, use rule-based mapping

## Mobile-First Design

The short flags are designed for mobile users who want to type quickly:

```bash
# Instead of typing:
new coffee 150 --business Personal --payment cash --memo "meeting"

# Mobile users can type:
new coffee 150 -b Personal -p cash -m "meeting"
```

## Smart Syntax (No Flags Needed)

The command maintains its intuitive natural language syntax:

```bash
# Business prefix syntax
new MyBrick: supplies 500

# Vendor syntax
new coffee 150 @ Starbucks

# Multiple items
new coffee $6, pastry $4 @ Starbucks
```

## Examples

### **Basic Usage**

```bash
new coffee 150                    # Simple expense
new supplies 500 -b MyBrick       # Business context
new lunch 200 -m "client meeting" # With memo
```

### **Advanced Combinations**

```bash
new coffee $6, lunch $12 @ Cafe -b Personal -p "credit card" -m "client meeting"
new Channel60: marketing 1000 @ Agency -p cash -d yesterday
new subscription 50 @ Netflix -b Personal -m "monthly" -d 2025-08-10
```

### **AI Control**

```bash
new supplies 500 -u               # Force AI categorization
new coffee 150 -n                 # Disable AI, use rules
new lunch 200                     # Default AI (enabled)
```

## Registry Improvements

The command registry now includes:

- **📋 Quick Reference Tables** - All flags at a glance
- **📱 Mobile-Friendly Section** - Short flag examples
- **💡 Quick Examples** - Common use cases
- **🔧 Advanced Combinations** - Complex examples
- **🤖 AI Categorization** - Complete AI control documentation
- **🖼️ Image Support** - Documented image attachment
- **🔄 Backward Compatibility** - What still works

## Benefits of New System

1. **Consistency** - All flags use `--` prefix
2. **Mobile-Friendly** - Short flags for quick typing
3. **Comprehensive** - All features documented
4. **AI-Aware** - Complete AI control options
5. **Professional** - Follows CLI standards
6. **User-Friendly** - Easy to learn and use
7. **Extensible** - Easy to add new flags

## Backward Compatibility

- Business prefix syntax still works: `MyBrick: items...`
- @ vendor syntax still works: `@ Starbucks`
- All existing long flags continue to work
- Default behaviors unchanged

## Migration Guide

- `new --business Personal` → `new -b Personal` (optional)
- `new --payment cash` → `new -p cash` (optional)
- `new --memo "note"` → `new -m "note"` (optional)
- `new --date yesterday` → `new -d yesterday` (optional)
- All existing syntax continues to work unchanged

## Technical Implementation

### **Parser Updates**

- Added short flag support for all flags
- Maintained backward compatibility
- Enhanced AI flag parsing

### **Handler Updates**

- Support for short AI flags (`-u`, `-n`)
- Improved flag detection and removal

### **Registry Updates**

- Complete flag documentation
- Quick reference tables
- Mobile-friendly examples
- AI categorization guide

The new command now provides the same professional, consistent, and user-friendly experience as the entries command, with comprehensive documentation and mobile-optimized short flags.
