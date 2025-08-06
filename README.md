Here’s a **precise technical summary** and usage reference for your terminal command architecture and implementation—**fully matching your current code**.

---

# Terminal Command System (Current as of August 2025)

## Overview

Your app’s terminal UI is a modular, extensible React system that supports:

- **Per-page command sets** (loaded dynamically by `SmartTerminal`)
- **Global/admin commands**
- **Full local history**
- **Dynamic context (page MDX for AI)**
- **Auth/CRUD/data navigation**
- **Intelligent fallback to OpenAI GPT-4o with real site context**

---

## Key Concepts & Flow

### 1. **Terminal Instantiation**

- **src/app/page.tsx**:

  - Loads per-page MDX and `<SmartTerminal commandSet="home" ... />`

- **src/components/terminal/smart-terminal.tsx**:

  - Loads commands based on the `commandSet` (page key) and user (admin).
  - Fetches page MDX context for AI.
  - Supplies all to `<Terminal />`.

### 2. **Command Loading & Registry**

- **src/commands/smart/registry.ts**:

  - Central command registry:
    All commands (navigation, theme, data, CRUD, info, AI, etc).
    Each command has:

    - `content`: string or async function (for output/side effects)
    - `description`, `usage`

- **src/commands/smart/sets/global.ts / admin.ts / \[page].ts**:

  - Each exports a list of allowed command keys for global, admin, and each page.
  - `SmartTerminal` merges and loads only allowed keys for current user/page.

### 3. **Command Execution**

- **src/commands/smart/handle-command.ts**:

  - Interprets commands, flags, and arguments.
  - Handles:

    - **Theme switching**
    - **Navigation (go, back, forward)**
    - **CRUD (create, edit posts)**
    - **Blog/project post listing, searching, liking**
    - **User/auth commands**
    - **Cache regeneration**
    - **Help system**
    - **Delegates to AI for unknown/“chat” queries**, injecting:

      - Page MDX context
      - Recent Q\&A history
      - Available commands
      - Relevant posts (tags/keywords)

---

## Command Usage & Structure

### **CommandMeta Type**

```ts
export type CommandMeta = {
  content:
    | string
    | ((
        arg?: string,
        context?: string,
        set?: Record<string, CommandMeta>,
        user?: User | null
      ) => string | Promise<string>);
  description?: string;
  usage?: string;
};
```

---

### **Built-in Commands (from registry.ts)**

| Command  | Description                              | Usage                       |            |      |              |
| -------- | ---------------------------------------- | --------------------------- | ---------- | ---- | ------------ |
| help     | Show help info or details on a command   | \`help \[global             | admin      | page | <command>]\` |
| clear    | Clear terminal history                   | `clear`                     |            |      |              |
| clearall | Clear all terminal histories (all pages) | `clearall`                  |            |      |              |
| go       | Navigate to page by name/slug/route      | `go <page>`                 |            |      |              |
| nav      | Show navigation links                    | `nav`                       |            |      |              |
| pwd      | Print current route/path                 | `pwd`                       |            |      |              |
| top      | Scroll to top                            | `top`                       |            |      |              |
| esc      | Focus terminal input                     | `esc`                       |            |      |              |
| dark     | Switch to dark mode                      | `dark`                      |            |      |              |
| light    | Switch to light mode                     | `light`                     |            |      |              |
| theme    | Set theme (dark/light/system)            | `theme <mode>`              |            |      |              |
| user     | Show current Supabase user               | `user`                      |            |      |              |
| logout   | Log out                                  | `logout`                    |            |      |              |
| update   | Clear terminal, show latest posts        | `update`                    |            |      |              |
| latest   | Show 10 latest blog/project posts        | `latest [limit]`            |            |      |              |
| recent   | Alias for latest                         | `recent [limit]`            |            |      |              |
| popular  | Show 10 most liked posts                 | `popular [limit]`           |            |      |              |
| search   | Search posts by keywords/tags/etc        | `search <keyword> [flags]`  |            |      |              |
| list     | List all blog/project post titles        | `list [limit]`              |            |      |              |
| like     | Like a post by slug                      | `like <slug>`               |            |      |              |
| unlike   | Unlike a post by slug                    | `unlike <slug>`             |            |      |              |
| count    | Count posts (optionally by type)         | \`count \[blog              | project]\` |      |              |
| create   | Create a new post (requires login)       | `create <type> <post-name>` |            |      |              |
| edit     | Edit an existing post (requires login)   | `edit <slug>`               |            |      |              |
| info     | Site info/about                          | `info`                      |            |      |              |
| team     | Site creator info                        | `team`                      |            |      |              |
| skills   | Site owner’s skills                      | `skills`                    |            |      |              |
| cache    | Regenerate posts cache                   | `cache`                     |            |      |              |
| aiusage  | Show AI requests used (quota)            | `aiusage`                   |            |      |              |
| quota    | Alias for aiusage                        | `quota`                     |            |      |              |
| messages | List latest contact messages (login)     | `messages [limit]`          |            |      |              |
| fancy    | Demo MDX with custom components          | `fancy`                     |            |      |              |

> **Note:** Many commands (CRUD, theme, cache, user, AI usage, etc.) are handled with side effects, API calls, or UI effects—see `handle-command.ts`.

---

### **Help System**

- `help` supports:

  - `help` or `help global|admin|page` — show command list per set
  - `help <command>` — details on any specific command

---

### **AI Fallback**

- Any unrecognized or chat-like input is streamed to `/api/openai` with:

  - The current page’s MDX (raw)
  - Up to 20 recent Q\&A turns
  - The safe command set (with descriptions)
  - Up to 5 relevant blog/project posts

- GPT-4o streams back a Markdown answer, with links, components, or suggestions (if allowed).

---

### **Command Set Loading**

- **`SmartTerminal`** (see props):

  - Loads commands:

    - `globalCommandKeys` (always)
    - Page-specific (`homeCommandKeys`, etc.)
    - Admin (`adminCommandKeys`) if user is logged in

---

### **Terminal State**

- **History:**

  - Per-page, up to `maxHistory` (default 200), in localStorage
  - Command outputs are structured for Markdown/MDX/React

- **Keyboard Shortcuts:**

  - Up/down/page/home/end for scrolling history
  - Focus returns to input on output click or mouse up

---

## Example Command Flows

```bash
$ go blog           # Route to /blog, fuzzy matching by name/slug/route
$ help count        # Show usage and description for 'count'
$ search next.js    # List posts matching 'next.js'
$ like my-post      # Like a post with slug 'my-post'
$ clear             # Clear terminal output
$ aiusage           # Show OpenAI usage quota
$ fancy             # Render demo MDX with <my-alert /> component
```

---

## Best Practices

- Add new commands to the appropriate set file (see `/src/commands/smart/sets/`)
- Update `commandRegistry` with metadata
- Document command usage/description for auto-help
- Return **trusted MDX/React only** via allowed command outputs
- Use AI fallback for unhandled/chat-style queries

---

## FAQ

- **Where is command history stored?**
  LocalStorage per-page (`terminal_key_<page>`).

- **How is context injected into AI?**
  Via a server-side fetch of the page MDX, included in OpenAI prompt.

- **Where do I add custom commands?**
  `src/commands/smart/sets/[page].ts` for per-page; `global.ts`/`admin.ts` for shared/admin.

project structure

tree /Users/wolf/Documents/Development/Projects/Ledger/ledger-app/src
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
│   │   ├── blog-terminal-client.tsx
│   │   ├── custom-mdx-components.tsx
│   │   ├── projects-terminal-client.tsx
│   │   ├── smart-terminal.tsx
│   │   ├── terminal-loading.tsx
│   │   ├── terminal-output-renderer.tsx
│   │   ├── terminal-reset-button.tsx
│   │   ├── terminal-with-routing.tsx
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
├── data
│   ├── layer
│   │   ├── blog-fs.ts
│   │   └── blog.ts
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
