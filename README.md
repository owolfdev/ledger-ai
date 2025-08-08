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

├── actions
│   └── comments
│   ├── add-comment.ts
│   ├── approve-comment.ts
│   ├── delete-comment.ts
│   └── edit-comment.ts
├── app
│   ├── about
│   │   └── page.tsx
│   ├── actions
│   │   ├── actions.ts
│   │   ├── auth-actions.ts
│   │   ├── cache-actions.ts
│   │   ├── cache-bak-remove
│   │   │   └── generate-posts-cache.ts
│   │   ├── comments
│   │   │   └── get-comments.ts
│   │   ├── contact
│   │   │   └── get-contact-messages.ts
│   │   ├── create-new-post-action.ts
│   │   ├── delete-post-action.ts
│   │   ├── edit-post-action.ts
│   │   ├── editor
│   │   │   ├── delete-post.ts
│   │   │   └── save-post.ts
│   │   ├── ledger
│   │   │   ├── create-ledger-entry.ts
│   │   │   ├── get-ledger-entries.ts
│   │   │   ├── read-ledger-file.ts
│   │   │   └── sync-ledger-file.ts
│   │   ├── like-actions.ts
│   │   ├── mdx
│   │   │   └── fetch-mdx-raw.ts
│   │   ├── open-actions.ts
│   │   ├── pages
│   │   │   ├── create-new-page-action.ts
│   │   │   ├── edit-page-action.ts
│   │   │   └── get-page.ts
│   │   └── posts
│   │   ├── get-popular-posts.ts
│   │   ├── get-post.ts
│   │   ├── get-posts.ts
│   │   └── getRelatedPostTitles.ts
│   ├── api
│   │   ├── admin
│   │   │   └── cache-posts
│   │   │   └── route.ts
│   │   ├── ai-usage
│   │   │   └── route.ts
│   │   ├── contact-messages
│   │   │   └── route.ts
│   │   ├── ledger
│   │   │   └── append
│   │   │   └── route.ts
│   │   ├── mdx-raw
│   │   │   └── route.ts
│   │   └── openai
│   │   └── route.ts
│   ├── apple-icon.png
│   ├── auth
│   │   ├── confirm
│   │   │   └── route.ts
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── sign-up
│   │   │   └── page.tsx
│   │   ├── sign-up-success
│   │   │   └── page.tsx
│   │   └── update-password
│   │   └── page.tsx
│   ├── blog
│   │   ├── [slug]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── contact
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading-bak.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── post
│   │   ├── create
│   │   │   └── [slug]
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── edit
│   │   │   └── [slug]
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── privacy-policy
│   │   └── page.tsx
│   ├── projects
│   │   ├── [slug]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   └── protected
│   └── page.tsx
├── commands
│   ├── smart
│   │   ├── handle-command.ts
│   │   ├── registry.ts
│   │   ├── sets
│   │   │   ├── about.ts
│   │   │   ├── admin.ts
│   │   │   ├── blog.ts
│   │   │   ├── contact.ts
│   │   │   ├── global.ts
│   │   │   ├── home.ts
│   │   │   ├── post.ts
│   │   │   ├── privacy.ts
│   │   │   └── projects.ts
│   │   └── utils.ts
│   └── utils.ts
├── components
│   ├── alerts
│   │   ├── custom-alert.tsx
│   │   └── production-mode-alert.tsx
│   ├── auth-button.tsx
│   ├── blog
│   │   └── blog-layout-wrapper.tsx
│   ├── code
│   │   ├── code.tsx
│   │   ├── inline-code.tsx
│   │   └── pre.tsx
│   ├── comments
│   │   ├── comment-form.tsx
│   │   ├── comment-list.tsx
│   │   └── comment-section.tsx
│   ├── compliance
│   │   ├── cookie-consent-banner.tsx
│   │   └── cookie-consent-manager.tsx
│   ├── contact
│   │   └── contact-form.tsx
│   ├── editor
│   │   └── monaco-mdx-editor.tsx
│   ├── examples
│   │   ├── charts
│   │   ├── chat
│   │   │   └── command-console.tsx
│   │   ├── code-type-animation.tsx
│   │   ├── cookie-jar.tsx
│   │   ├── copy-to-clipboard
│   │   │   ├── copy-image.tsx
│   │   │   └── copy-text.tsx
│   │   ├── css
│   │   │   ├── box-model-visualizer.tsx
│   │   │   ├── display-type-visualizer.tsx
│   │   │   ├── em-vs-rem.tsx
│   │   │   ├── position-visualizer.tsx
│   │   │   └── selectors-demo.tsx
│   │   ├── custom-button.tsx
│   │   ├── drawing
│   │   ├── dynamic-input-popup copy.tsx
│   │   ├── dynamic-input-popup.tsx
│   │   ├── fetch-vs-axios
│   │   │   ├── axios-component.tsx
│   │   │   └── fetch-component.tsx
│   │   ├── forms
│   │   │   └── form-data-demo.tsx
│   │   ├── geolocation
│   │   │   └── geolocation-tracker.tsx
│   │   ├── html
│   │   ├── media
│   │   │   ├── custom-audio-player.tsx
│   │   │   ├── eq-visualizer.tsx
│   │   │   ├── example-player.tsx
│   │   │   └── video-with-subtitles.tsx
│   │   ├── tailwind-colors.tsx
│   │   ├── typescript
│   │   │   ├── typed-input-usage.tsx
│   │   │   └── typed-input.tsx
│   │   └── useref
│   │   ├── focus-input-no-useref.tsx
│   │   ├── focus-input-with-useref.tsx
│   │   ├── track-previous-state-cannot.tsx
│   │   └── track-previous-state-with-useref.tsx
│   ├── forgot-password-form.tsx
│   ├── graphics
│   │   └── noisy-logo
│   │   ├── noisy-logo-test.tsx
│   │   └── noisy-logo.tsx
│   ├── like
│   │   └── like-button.tsx
│   ├── login-form.tsx
│   ├── logout-button.tsx
│   ├── mdx
│   │   ├── accordion-component.tsx
│   │   ├── code.tsx
│   │   ├── custom-button.tsx
│   │   ├── custom-link.tsx
│   │   ├── iframe.tsx
│   │   ├── image.tsx
│   │   ├── inline-code.tsx
│   │   ├── mdx-content.tsx
│   │   ├── pre.tsx
│   │   ├── regex-highlighter-component.tsx
│   │   └── youtube.tsx
│   ├── multi-select
│   │   ├── multi-select-test.tsx
│   │   └── shcn-multi-select-categories.tsx
│   ├── my-component.tsx
│   ├── nav
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── links-sheet.tsx
│   ├── posts
│   │   ├── back-button.tsx
│   │   ├── blog-post-list.tsx
│   │   ├── edit-post-button.tsx
│   │   ├── open-in-cursor-button.tsx
│   │   ├── open-in-vs-code-button.tsx
│   │   ├── popular-posts.tsx
│   │   ├── progress-bar.tsx
│   │   ├── project-post-list.tsx
│   │   ├── related-posts.tsx
│   │   ├── search-posts.tsx
│   │   ├── select-limit-posts.tsx
│   │   └── sort-posts.tsx
│   ├── sign-up-form.tsx
│   ├── terminal
│   │   ├── custom-mdx-components.tsx
│   │   ├── smart-terminal.tsx
│   │   ├── terminal-loading.tsx
│   │   ├── terminal-output-renderer.tsx
│   │   ├── terminal-reset-button.tsx
│   │   └── terminal.tsx
│   ├── theme
│   │   └── mode-toggle.tsx
│   ├── theme-bridge.tsx
│   ├── theme-provider.tsx
│   ├── typography
│   │   ├── font-hero
│   │   │   ├── font-hero.tsx
│   │   │   ├── fonts
│   │   │   │   └── CS Noire-Light.otf
│   │   │   └── fonts.ts
│   │   ├── hyphenated-title
│   │   │   └── ht.tsx
│   │   ├── random-font-hero
│   │   │   ├── fonts
│   │   │   │   ├── CS-5uper.otf
│   │   │   │   ├── CS-Defiant2.woff2
│   │   │   │   ├── CS-Endless.woff2
│   │   │   │   ├── CS-Glare.otf
│   │   │   │   └── CS-Noire-Black.otf
│   │   │   ├── fonts.ts
│   │   │   └── random-font-hero.tsx
│   │   └── random-font-hero-home
│   │   ├── fonts
│   │   │   ├── CS-5uper.otf
│   │   │   ├── CS-Defiant2.woff2
│   │   │   ├── CS-Endless.woff2
│   │   │   ├── CS-Glare.otf
│   │   │   └── CS-Noire-Black.otf
│   │   ├── fonts.ts
│   │   └── random-font-hero.tsx
│   ├── ui
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── sonner.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   └── update-password-form.tsx
├── content
│   ├── mdx
│   │   └── test.mdx
│   ├── pages
│   │   ├── about.mdx
│   │   ├── blog.mdx
│   │   ├── contact.mdx
│   │   ├── create.mdx
│   │   ├── edit.mdx
│   │   ├── home.mdx
│   │   ├── post.mdx
│   │   ├── privacy.mdx
│   │   ├── projects.mdx
│   │   ├── protected.mdx
│   │   └── welcome.mdx
│   └── posts
│   ├── ledger-cli-a-beginners-tutorial-part-2.mdx
│   ├── ledger-cli-a-beginners-tutorial.mdx
│   └── ledger-cli-practical-tutorial-for-freelance-developers-6.mdx
├── data
│   ├── layer
│   │   ├── blog-fs.ts
│   │   └── blog.ts
│   ├── ledger
│   │   └── general.ledger
│   ├── pages-list.ts
│   └── routes.ts
├── hooks
│   ├── use-terminal-scroll-keys.ts
│   └── use-toast.ts
├── lib
│   ├── cache
│   │   ├── generate-cache-posts.mjs
│   │   └── generate-cache-posts.ts
│   ├── chat
│   │   └── generate-title.ts
│   ├── comments
│   │   └── local-storage.ts
│   ├── config
│   │   └── config.js
│   ├── keyword-utils.ts
│   ├── ledger
│   │   ├── is-local-write-enabled.ts
│   │   └── parse-ledger-entry.ts
│   ├── ledger-config.ts
│   ├── ledger-date-parse.ts
│   ├── ledger-date.ts
│   ├── openai.ts
│   ├── posts
│   │   └── get-posts.mjs
│   ├── scripts
│   │   ├── embedding.ts
│   │   ├── generate-system-prompt.ts
│   │   └── populate-likes.mjs
│   ├── stopwords.ts
│   ├── theme-client.ts
│   ├── utils
│   │   └── is-dev-mode.js
│   ├── utils.ts
│   └── web
│   └── scrape.ts
├── types
│   ├── blog.ts
│   ├── comment.ts
│   ├── monaco-vim.d.ts
│   ├── post-metadata.ts
│   ├── terminal.ts
│   └── user.ts
└── utils
├── cn.ts
├── commands-serialize.ts
├── openai
│   ├── get-client-ip.ts
│   └── rate-limit.ts
├── rate-limit-redis.ts
├── supabase
│   ├── check-env-vars.ts
│   ├── client.ts
│   ├── get-user.ts
│   ├── middleware.ts
│   └── server.ts
└── utils.ts

flowchart TD
A[User input in React Terminal] --> B[AI parses to Ledger CLI format]
B --> C[parseLedgerEntry extracts fields]
C --> D[Lookup business in Supabase]
D --> E[Write ledger entry row to Supabase]
E -->|If LOCAL_LEDGER_WRITE=true| F[Sync all entries from Supabase to .ledger file]
F --> G[Local .ledger file updated]
G -->|Dev only| H[Run Ledger CLI commands]
H --> I[Show CLI output in terminal UI]
