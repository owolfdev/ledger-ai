Absolutely! Here’s a **revised technical system reference** for your terminal command architecture, **including all recent changes**:

---

# Terminal Command System (Ledger App) — Technical Reference

_Updated: August 2025_

---

## 🏗️ **Core Features & Architecture**

- **Smart, extensible React Terminal** (`SmartTerminal`), fully pluggable per-page
- **Command registry**: CRUD, navigation, theme, AI, custom business logic
- **AI fallback**: Any input not recognized is streamed to OpenAI with live context
- **Supabase-backed storage** for all structured data (ledger entries, businesses, users)
- **Sync system**: Keeps Supabase ledger entries in sync with a local `.ledger` file for compatibility with [Ledger CLI](https://www.ledger-cli.org/)
- **Automatic “business” tagging**: Every ledger entry is tagged to a business (e.g., Personal, Channel60) and mapped to a business UUID
- **Production/dev logic**:

  - Local file write (`src/data/ledger/general.ledger`) is enabled **only in development**
  - Controlled via `.env`: `LOCAL_LEDGER_WRITE=true`

- **Ledger CLI integration** (MVP):

  - In development, Node child process can run Ledger CLI commands against the synced local file

---

## 📄 **Supabase Table Changes**

### `ledger_entries` Table

- **New/updated fields:**

  - `business_id` (`uuid`, foreign key to `businesses`)
  - `currency` (now always stored as a 3-letter code: `THB`, `USD`, etc.)
  - `expense_account` / `asset_account` always normalized (e.g. `Expenses:Personal:Food:Coffee`)
  - `entry_text` (canonical, GPT-generated ledger format)
  - `entry_raw` (original user input, for provenance/debug)
  - `amount` always stored as decimal **number only** (no symbols)

### `businesses` Table

- Used to look up and enforce which business (Personal, Channel60, etc.) each entry belongs to
- Required for “business_id” assignment per entry

---

## 🔄 **Ledger File Sync**

- **Action:** `src/app/actions/ledger/sync-ledger-file.ts`

  - Pulls all ledger entries from Supabase
  - Converts them to canonical Ledger CLI format:

    - Currency symbol inferred from the `currency` field
    - Amounts and account names normalized

  - Writes to local file (`src/data/ledger/general.ledger`) **only if** `LOCAL_LEDGER_WRITE=true`
  - Logs to console if running in production or not allowed

- **Normalization**

  - All amounts in Supabase are stored as numbers
  - **Currency symbols** in the file are generated dynamically (no risk of mismatches)
  - **Legacy** entries or entries missing `currency` default to `$` (USD)
  - `THB` entries use `฿`

---

## 🧠 **AI + Business Logic**

- **On “new” entry:**

  1. AI generates valid Ledger CLI entry in canonical format.
  2. `parseLedgerEntry()` (see below) extracts all needed fields, **including inferring the business** from the expense account path.
  3. Business name → Supabase lookup for business UUID (default: Personal)
  4. Entry is saved to both Supabase and (if enabled) the ledger file.

```ts
// parseLedgerEntry always extracts business from `Expenses:<Business>:...`
export function parseLedgerEntry(entry: string): ParsedLedgerEntry { ... }
```

---

## 💻 **Example Data Flow:**

User input:

```bash
new coffee starbucks Channel 60 $5
```

1. AI generates:

   ```
   2025/08/08 Starbucks
       Expenses:Channel60:Food:Coffee    $5.00
       Assets:Cash                      -$5.00
   ```

2. `parseLedgerEntry` parses fields and finds business_name = "Channel60"
3. System looks up business in Supabase and sets `business_id`
4. Supabase row:

   ```json
   {
     "business_id": "cf72ac8b-b0c6-42ea-bf2c-9ae608e06631",
     "currency": "USD",
     "expense_account": "Expenses:Channel60:Food:Coffee",
     ...
   }
   ```

5. If local write enabled, entry is appended to the `.ledger` file using correct currency symbol.

---

## 📦 **Ledger CLI Integration (Dev-Only)**

- In **development** mode only (`LOCAL_LEDGER_WRITE=true`), terminal commands can call Node child process to execute `ledger` commands (e.g., register, balance) against the local file
- **Command output** is streamed back to the terminal UI
- In production/SaaS: **No ledger CLI integration** (for safety/scalability/security)

---

## 🧩 **Extending/Modifying**

- Add more fields to `ledger_entries` if your business logic grows
- New business: add to `businesses` table, the UI and sync will pick it up automatically
- New terminal commands:

  - Add to `src/commands/smart/sets/[page].ts`
  - Register in `registry.ts`

- **AI prompt can be changed** in the terminal “new” command to match any custom rules

---

## ✅ **Current Best Practices**

- Always write all canonical ledger data to Supabase first
- File sync is one-way: from Supabase to file
- No sensitive logic or writes in production SaaS environments
- All multi-user logic should enforce user_id/business_id for all queries

---

## **FAQ (Updates)**

- **How is “business” assigned?**

  - Always parsed from expense account (`Expenses:Channel60:...`) or defaults to Personal.

- **What about non-standard currencies?**

  - All amounts are stored as number, currency is stored as ISO code, and the symbol is added only at file write time.

- **How do I run Ledger CLI commands?**

  - Only available in dev, via terminal commands which spawn a child process (see Node.js `child_process`).

---

Let me know if you want a **code block for the key sync/read/write actions** or a **diagram** of the architecture!

---
