# 📟 Ledger App — Terminal Command System

**Technical Reference — August 2025**

---

## **1. Overview**

The Ledger App is a **React-based smart terminal** for quickly creating, managing, and editing financial ledger entries.
It combines **structured parsing**, **AI-assisted inference**, **Supabase-backed persistence**, and **comprehensive entry management** with optional **Ledger CLI integration** for development workflows.

---

## **2. Core Features**

- **Smart Command Parser**

  - Supports structured JSON, natural "manual" commands (`new coffee $5 Starbucks, credit card`), **and OCR-assisted entry with review workflow**
  - Automatic detection of:
    - Date (absolute or relative: `2025-08-10`, `yesterday`)
    - Items & prices (with optional category overrides)
    - Payment account mapping (`credit card` → `Liabilities:CreditCard`)
    - Memo extraction (`memo "Lunch meeting"`)
    - Currency detection (`$` → `USD`, `฿` → `THB`)
    - Business context (`MyBrick: supplies $50` or `--business Personal`)
  - Extensible regex mapping for expense categories

- **Entry Management System**

  - **Individual entry pages** with full details and editing capabilities
  - **In-place editing** with basic and advanced modes:
    - Basic: Description, date, memo, cleared status, receipt images
    - Advanced: Individual posting modification with balance validation
  - **Image upload & management** for receipt storage
  - **Real-time validation** ensuring double-entry balance

- **AI Fallback**

  - If command parsing fails or input is ambiguous, the terminal sends the request to OpenAI
  - AI generates canonical Ledger CLI entries, respecting account naming conventions

- **Supabase Storage**

  - Primary persistence layer for:
    - Normalized ledger entries (`ledger_entries`)
    - Individual account postings (`ledger_postings`)
    - Business metadata (`businesses`)
    - Receipt images (Supabase Storage bucket)
  - **Account-based business context** stored in expense account hierarchy
  - All numeric amounts stored without currency symbols; currency stored as ISO code

- **Modern Next.js Architecture**

  - **Server actions** for data mutations (create, update entries)
  - **Optimistic updates** with `useTransition` and `revalidatePath`
  - **Type-safe** operations with Zod validation
  - **Image processing** with Sharp for receipt optimization

- **Ledger File Sync (Dev Mode)**

  - Optional `.ledger` file sync for compatibility with [Ledger CLI](https://www.ledger-cli.org/)
  - Controlled by `.env` → `LOCAL_LEDGER_WRITE=true`
  - Auto-converts Supabase entries into canonical CLI syntax with correct currency symbol
  - **One-way sync**: Supabase → File (never the reverse)

- **Ledger CLI Integration (Dev Only)**
  - Terminal can run `ledger register`, `ledger balance`, etc., against local file
  - Disabled in production for security and scalability

---

## **3. Input Methods**

The Ledger App provides three ways to create entries, all converging on the same processing pipeline:

### **Method 1: Manual Terminal Entry**

```
User types: "new coffee $5 @ Starbucks"
    ↓
new command handler processes input
    ↓
Creates ledger entry in database
    ↓
Later: sync to .ledger file
```

### **Method 2: OCR Image Upload (with Review)**

```
User uploads receipt image
    ↓
OCR processing extracts data
    ↓
AI builds equivalent command: "new coffee $5 @ Starbucks"
    ↓
Command populates terminal input for user review/editing
    ↓
User can add --business flags, fix errors, add memo
    ↓
User presses Enter → same new command handler
    ↓
Creates ledger entry in database
    ↓
Later: sync to .ledger file
```

### **Method 3: Structured JSON (API/Advanced)**

```
Direct JSON input with receipt structure
    ↓
Same new command handler processes
    ↓
Creates ledger entry in database
    ↓
Later: sync to .ledger file
```

**Key Architecture Benefit:** All three methods use the same validation, categorization, and storage logic, ensuring consistency regardless of input source.

---

## **4. Data Flow Examples**

### **Manual Entry Example**

User types:

```bash
new coffee $4, pastry $5 @ Starbucks --payment "credit card" --memo "pumpkin latte not good" --date yesterday
```

**Step-by-step processing:**

1. **Enhanced Tokenization & Parsing**

   - Detects date (`yesterday`)
   - Extracts items: `coffee $4`, `pastry $5`
   - Detects vendor (`@ Starbucks`)
   - Maps payment method to `Liabilities:CreditCard`
   - Extracts memo and business context
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

3. **Posting Generation with Business Context**

   ```ledger
   2025/08/13 Starbucks
       Expenses:Personal:Food:Coffee  $4.00
       Expenses:Personal:Food:Pastry  $5.00
       Liabilities:CreditCard        $-9.00
   ```

4. **Supabase Save with Posting Details**

   - Entry stored in `ledger_entries` with business context in account names
   - Individual postings stored in `ledger_postings` with sort order
   - Currency as `"USD"`, raw input in `entry_raw`, canonical text in `entry_text`

5. **Entry Management**
   - Accessible via `/ledger/entry/{id}` for viewing and editing
   - Full edit capabilities including image upload and posting modification

### **OCR-Assisted Entry Example**

User uploads Starbucks receipt image:

1. **OCR Processing** → Extracts text from image using Tesseract.js with multiple optimization strategies
2. **AI Command Generation** → Creates: `new coffee $5.67, pastry $3.25 @ Starbucks --date 2025-08-17`
3. **Terminal Input Population** → Command appears in terminal input field for user review
4. **User Review & Edit** → User adds: `--business Channel60 --memo "client meeting"`
5. **Same Processing Pipeline** → Identical to manual entry from this point forward

---

## **5. Key Files & Responsibilities**

| File / Path                                        | Purpose                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Command Processing**                             |
| `/commands/smart/new-command-handler.ts`           | Main orchestration for `new` terminal commands — handles both structured JSON and manual commands |
| `/lib/ledger/parse-manual-command.ts`              | Enhanced tokenizer supporting flags, business context, and vendor syntax                          |
| `/lib/ledger/build-postings-from-receipt.ts`       | Converts parsed receipt into Ledger CLI postings with business-aware accounts                     |
| `/lib/ledger/render-ledger.ts`                     | Renders date, payee, and postings into canonical `.ledger` text                                   |
| **Entry Management**                               |
| `/app/ledger/entry/[id]/page.tsx`                  | Individual entry detail page with view/edit capabilities                                          |
| `/app/ledger/entry/[id]/editable-ledger-entry.tsx` | Comprehensive entry editor with basic/advanced modes                                              |
| `/app/ledger/entry/[id]/image-upload.tsx`          | Receipt image upload and management component                                                     |
| **Data Layer**                                     |
| `/app/actions/ledger/create-ledger-entry.ts`       | Creates new ledger entries with posting details                                                   |
| `/app/actions/ledger/update-ledger-entry.ts`       | Updates existing entries including postings and images                                            |
| `/app/actions/ledger/sync-ledger-file.ts`          | Pulls Supabase entries and writes to local `.ledger` file in dev mode                             |
| **Configuration**                                  |
| `/lib/ledger/account-map.ts`                       | Maps keywords and descriptions to business-aware expense/asset accounts                           |
| `/lib/ledger/schemas.ts`                           | Zod schemas for validating structured ledger input and updates                                    |
| **Image Processing**                               |
| `/app/api/receipt-image/route.ts`                  | Handles receipt upload, Sharp processing, and Supabase Storage                                    |
| `/components/terminal/terminal-image-upload.tsx`   | OCR processing and AI command generation with terminal input population                           |
| **Terminal System**                                |
| `/components/terminal/terminal.tsx`                | Core terminal interface with input handling and command execution                                 |
| `/components/terminal/smart-terminal.tsx`          | Context-aware terminal wrapper with command registry and user management                          |
| `/commands/smart/handle-command.ts`                | Command routing and execution with AI fallback                                                    |
| `/commands/smart/registry.ts`                      | Complete command registry with usage documentation                                                |
| **Ledger CLI Integration**                         |
| `/commands/smart/ledger-cli-command.ts`            | Client-side Ledger CLI command interface                                                          |
| `/app/api/ledger-cli/route.ts`                     | Server-side Ledger CLI execution with security controls                                           |

---

## **6. Entry Management Features**

### **Individual Entry Pages (`/ledger/entry/{id}`)**

- **Full entry details** with business context, postings, and receipt images
- **Edit button** to enter modification mode
- **Image display** with full-size view links

### **In-Place Editing System**

- **Basic Mode**: Edit description, date, memo, cleared status, and images
- **Advanced Mode**: Full posting editor with add/remove/balance capabilities
- **Real-time validation** ensuring transactions remain balanced
- **Auto-balance button** to automatically balance the last posting
- **Account suggestions** with business-aware examples

### **Image Management**

- **Receipt upload** with automatic Sharp optimization (grayscale, resize, compress)
- **Replace/remove** functionality with database synchronization
- **Supabase Storage** integration with user-specific paths
- **Preview and full-size viewing**

---

## **7. Business Context Architecture**

**Account-Based Approach:**

- Business context embedded in account hierarchy: `Expenses:Personal:Food:Coffee`
- No foreign key relationships required
- Self-contained ledger entries compatible with standard accounting tools
- Business filtering via account name pattern matching

**Supported Business Operations:**

- `new coffee $6` → Personal business (default)
- `new MyBrick: supplies $50` → MyBrick business (prefix syntax)
- `new coffee $6 --business Channel60` → Channel60 business (flag syntax)

**Important Account Naming Rule:**

- Account names **cannot contain spaces** (Ledger CLI requirement)
- `Studio Shodwe` → `StudioShodwe` or `Studio-Shodwe`
- System automatically converts business names with spaces

---

## **8. Terminal Command System**

### **Available Commands**

**Ledger Operations:**

- `new` - Create new ledger entries with natural language or structured input
- `entries` / `ent` - List, filter, and navigate ledger entries
- `edit-entry` / `editent` - Edit existing entries (business, vendor, date, memo)
- `ledger` - Execute Ledger CLI commands against synced file (dev only)
- `bal` / `reg` - Shortcuts for Ledger CLI balance and register commands

**Navigation & Utility:**

- `go <page>` - Navigate to pages with fuzzy matching
- `clear` / `clearall` - Clear terminal history
- `user` / `logout` - Authentication management
- `help` - Comprehensive command documentation

**AI Integration:**

- Automatic fallback to OpenAI for unrecognized commands
- Context-aware responses based on page content
- Rate limiting and usage tracking

---

## **9. Modern Next.js Integration**

- **Server Actions** for all data mutations (no API routes needed for internal operations)
- **TypeScript throughout** with strict type checking and Zod validation
- **Optimistic UI updates** with automatic revalidation
- **Error handling** with user-friendly feedback
- **Image processing** with Sharp for optimal receipt storage
- **Client-server separation** for Ledger CLI commands via API routes

---

## **10. Best Practices**

- **Always save to Supabase first**, then sync to local file if enabled
- **Account-based business context** eliminates need for complex foreign key relationships
- **Real-time validation** prevents unbalanced transactions
- **Image optimization** reduces storage costs and improves performance
- **Server actions** provide type-safe, modern data operations
- **OCR review workflow** enables speed of automation with precision of manual review
- **Single processing pipeline** ensures consistency across all input methods

---

## **11. Extending the System**

- **New Categories**: Add to `account-map.ts` patterns with business-aware mapping
- **New Payment Methods**: Extend `PARSER_GRAMMAR.paymentMethods.map` in `parse-manual-command.ts`
- **Alternate Currencies**: Adjust currency detection regex or accept explicit ISO codes
- **Custom AI Rules**: Modify AI prompt in `/commands/smart/new-command-handler.ts`
- **Additional Edit Features**: Extend `EditableLedgerEntry` component with new capabilities
- **Image Processing**: Enhance Sharp pipeline in `/app/api/receipt-image/route.ts`
- **Terminal Commands**: Add new commands to `/commands/smart/registry.ts` and appropriate command sets
- **OCR Improvements**: Enhance Tesseract.js configurations in `terminal-image-upload.tsx`

---

## **12. Development Workflow**

### **Local Development**

1. Set `LOCAL_LEDGER_WRITE=true` in `.env` to enable file sync
2. Use terminal commands to create entries
3. Run `ledger balance` to verify accounting accuracy
4. Use `/ledger/entries` page for visual entry management

### **Production Deployment**

- Ledger CLI commands automatically disabled for security
- File sync disabled - database remains single source of truth
- All terminal functionality remains available except CLI integration

### **Testing Entry Creation**

```bash
# Test manual entry
new coffee $5 @ Starbucks --business Personal --memo "morning fuel"

# Test OCR workflow
# Upload receipt image → review generated command → execute

# Verify with Ledger CLI (dev only)
ledger balance
ledger register coffee
```

---

## **Project Structure**

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
│   │   │   ├── after-save-ledger-sync.ts
│   │   │   ├── create-ledger-entry.ts
│   │   │   ├── create-ledger-from-structured.ts
│   │   │   ├── get-ledger-entries.ts
│   │   │   ├── read-ledger-file.ts
│   │   │   ├── route-new-commands.ts
│   │   │   ├── sync-ledger-file.ts
│   │   │   └── update-ledger-entry.ts
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
│   │   ├── ledger-cli
│   │   │   └── route.ts
│   │   ├── mdx-raw
│   │   │   └── route.ts
│   │   ├── openai
│   │   │   └── route.ts
│   │   ├── openai-image-analyze
│   │   │   └── route.ts
│   │   ├── receipt-image
│   │   │   └── route.ts
│   │   └── receipt-preprocess
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
│   ├── ledger
│   │   ├── entries
│   │   │   └── page.tsx
│   │   └── entry
│   │   └── [id]
│   │   ├── editable-ledger-entry.tsx
│   │   ├── image-upload.tsx
│   │   └── page.tsx
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
│   │   ├── edit-entry-command.ts
│   │   ├── entries-command.ts
│   │   ├── handle-command.ts
│   │   ├── ledger-cli-command.ts
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
│   │   ├── editable-receipt-error.tsx
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
│   │   ├── terminal-image-upload.tsx
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
├── config
│   └── vendors.json
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
│   ├── documentation.mdx
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
│   │   ├── ai-receipt-parser.ts
│   │   ├── auto-balance-ledger-entry.ts
│   │   ├── build-postings-from-receipt.ts
│   │   ├── convert-ocr-to-manual.ts
│   │   ├── enhanced-ocr-pipeline.ts
│   │   ├── is-local-write-enabled.ts
│   │   ├── parse-ledger-entry.ts
│   │   ├── parse-manual-command.ts
│   │   ├── parse-receipt-ocr-invoice.ts
│   │   ├── parse-receipt-ocr.ts
│   │   ├── reconcile-receipt-summary.ts
│   │   ├── render-ledger.ts
│   │   ├── schemas.ts
│   │   ├── segment-ocr-with-llm.ts
│   │   ├── validate-receipt-ocr.ts
│   │   └── vendor-config.ts
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

118 directories, 298 files
