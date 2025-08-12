# 📟 Ledger App — Terminal Command System

updated

**Technical Reference — August 2025**

---

## **1. Overview**

The Ledger App is a **React-based smart terminal** for quickly creating, managing, and syncing financial ledger entries.
It combines **structured parsing**, **AI-assisted inference**, and **Supabase-backed persistence** with optional **Ledger CLI integration** for development workflows.

---

## **2. Core Features**

- **Smart Command Parser**

  - Supports structured JSON or natural “manual” commands (`new coffee $5 Starbucks, credit card`)
  - Automatic detection of:

    - Date (absolute or relative: `2025/08/10`, `yesterday`)
    - Items & prices (with optional category overrides)
    - Payment account mapping (`credit card` → `Liabilities:CreditCard`)
    - Memo extraction (`memo "Lunch meeting"`)
    - Currency detection (`$` → `USD`, `฿` → `THB`)

  - Extensible regex mapping for expense categories

- **AI Fallback**

  - If command parsing fails or input is ambiguous, the terminal sends the request to OpenAI
  - AI generates canonical Ledger CLI entries, respecting account naming conventions

- **Supabase Storage**

  - Primary persistence layer for:

    - Normalized ledger entries (`ledger_entries`)
    - Business metadata (`businesses`)

  - Enforces `business_id` linking for multi-business/multi-user usage
  - All numeric amounts stored without currency symbols; currency stored as ISO code

- **Ledger File Sync (Dev Mode)**

  - Optional `.ledger` file sync for compatibility with [Ledger CLI](https://www.ledger-cli.org/)
  - Controlled by `.env` → `LOCAL_LEDGER_WRITE=true`
  - Auto-converts Supabase entries into canonical CLI syntax with correct currency symbol
  - **One-way sync**: Supabase → File (never the reverse)

- **Ledger CLI Integration (Dev Only)**

  - Terminal can run `ledger register`, `ledger balance`, etc., against local file
  - Disabled in production for security and scalability

---

## **3. Data Flow Example**

User types:

```bash
new coffee $4, pastry $5, Starbucks, credit card, memo "pumpkin latte not good", yesterday
```

**Step-by-step processing:**

1. **Tokenization & Parsing**

   - Detects date (`yesterday`)
   - Extracts items: `coffee $4`, `pastry $5`
   - Detects vendor (`Starbucks`)
   - Maps payment method to `Liabilities:CreditCard`
   - Extracts memo
   - Detects currency (`USD`)

2. **Receipt Shape Normalization**

   ```json
   {
     "items": [
       { "description": "coffee", "price": 4 },
       { "description": "pastry", "price": 5 }
     ],
     "subtotal": 9,
     "tax": null,
     "total": 9
   }
   ```

3. **Posting Generation**

   ```ledger
   2025/08/09 Starbucks
       Expenses:Personal:Food:Coffee  $4.00
       Expenses:Personal:Food:Pastry  $5.00
       Liabilities:CreditCard        $-9.00
   ```

4. **Supabase Save**

   - Entry stored in `ledger_entries` with:

     - `business_id` inferred from expense account path
     - `currency` as `"USD"`
     - Raw input stored in `entry_raw`
     - Canonical ledger text in `entry_text`

5. **Ledger File Sync** _(if enabled)_

   - Entry appended to `src/data/ledger/general.ledger`
   - Currency symbol auto-generated from stored `currency`

---

## **4. Key Files & Responsibilities**

| File / Path                                  | Purpose                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/commands/smart/new-command-handler.ts`     | Main orchestration for `new` terminal commands — handles both structured JSON and manual commands. |
| `/lib/ledger/parse-manual-command.ts`        | Tokenizes, parses, and validates free-form commands into structured `ReceiptShape` + metadata.     |
| `/lib/ledger/build-postings-from-receipt.ts` | Converts parsed receipt into Ledger CLI postings with correct accounts.                            |
| `/lib/ledger/render-ledger.ts`               | Renders date, payee, and postings into canonical `.ledger` text.                                   |
| `/app/actions/ledger/create-ledger-entry.ts` | Persists structured entry data into Supabase.                                                      |
| `/app/actions/ledger/sync-ledger-file.ts`    | Pulls Supabase entries and writes to local `.ledger` file in dev mode.                             |
| `/lib/ledger/account-map.ts`                 | Maps keywords and descriptions to default expense/asset accounts.                                  |
| `/lib/ledger/schemas.ts`                     | Zod schemas for validating structured ledger input.                                                |

---

## **5. Best Practices**

- **Always save to Supabase first**, then sync to local file if enabled.
- Keep business mappings (`businesses` table) up to date — parsing relies on correct account pathing.
- Add new category regex patterns in `/lib/ledger/account-map.ts` for common items (`pastry`, `sandwich`, etc.).
- Use development mode for testing Ledger CLI integration; production runs without file writes.

---

## **6. Extending the System**

- **New Categories**: Add to `account-map.ts` patterns.
- **New Payment Methods**: Extend `PARSER_GRAMMAR.paymentMethods.map` in `parse-manual-command.ts`.
- **Alternate Currencies**: Adjust currency detection regex or accept explicit ISO codes in input.
- **Custom AI Rules**: Modify AI prompt in `/commands/smart/new-command-handler.ts`.

---

/Users/wolf/Documents/Development/Projects/Ledger/ledger-app/src
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
│   │   │   ├── create-ledger-from-structured.ts
│   │   │   ├── get-ledger-entries.ts
│   │   │   ├── read-ledger-file.ts
│   │   │   ├── route-new-commands.ts
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
│   │   ├── openai
│   │   │   └── route.ts
│   │   └── openai-image-analyze
│   │   └── route.ts
│   ├── apple-icon.png
│   ├── auth
│   │   ├── \_archinve
│   │   │   ├── sign-up
│   │   │   │   └── page.tsx
│   │   │   └── sign-up-success
│   │   │   └── page.tsx
│   │   ├── confirm
│   │   │   └── route.ts
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── login
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
│   ├── image-process
│   │   └── page.tsx
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
│   │   ├── new-command-handler.ts
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
│   ├── image
│   │   ├── image-analyzer.tsx
│   │   └── image-to-ocr.tsx
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
│   │   ├── account-map.ts
│   │   ├── auto-balance-ledger-entry.ts
│   │   ├── build-postings-from-receipt.ts
│   │   ├── is-local-write-enabled.ts
│   │   ├── parse-ledger-entry.ts
│   │   ├── parse-manual-command.ts
│   │   ├── parse-receipt-ocr.ts
│   │   ├── render-ledger.ts
│   │   ├── schemas.ts
│   │   ├── segment-ocr-with-llm.ts
│   │   └── validate-receipt-ocr.ts
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
