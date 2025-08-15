// src/components/editor/monaco-mdx-editor.tsx
"use client";

import { useRef, useTransition, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { getPublishedPosts } from "@/data/layer/blog"; // ← Change to your actual path

const DEFAULT_TYPE = "blog";
const DEFAULT_AUTHOR = "O. Wolfson";

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((word) =>
      word.length === 0 ? "" : word[0].toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialMDX(slug: string, type: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const title = slugToTitle(slug.trim());
  return `export const metadata = {
  id: "${uuidv4()}",
  type: "${type}",
  title: "${title}",
  author: "${DEFAULT_AUTHOR}",
  publishDate: "${dateStr}",
  description: "",
  categories: [],
  tags: [],
  modifiedDate: "",
  image: null,
  draft: false,
  relatedPosts: [],
  link: null,
};

Add content here.`;
}

async function updateTerminalHistory(postType: string) {
  let posts = await getPublishedPosts();
  posts = posts.filter((p) => p.type === postType);
  const latest = posts
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    )
    .slice(0, 10)
    .map((p) => `- [${p.title}](/${postType}/${p.slug})`)
    .join("\n");
  const history = [
    { type: "input", content: "Latest Posts" },
    {
      type: "output",
      content: latest || "No posts found.",
      format: "markdown",
    },
  ];
  localStorage.setItem(
    `ledger_ai_terminal_key_${postType}`,
    JSON.stringify(history)
  );
}

type MonacoMDXEditorProps = {
  slug: string;
  type?: string;
  mode?: "create" | "edit";
  initialCode?: string;
};

export default function MonacoMDXEditor({
  slug: initialSlug,
  type,
  mode = "create",
  initialCode,
}: MonacoMDXEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const statusBarContainerRef = useRef<HTMLDivElement | null>(null);
  const vimStatusElRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const { resolvedTheme } = useTheme();

  // Slug state and normalization
  const [slugInput, setSlugInput] = useState(
    initialSlug.replace(/\.mdx$/i, "")
  );

  const postType = type ?? DEFAULT_TYPE;
  const bg = resolvedTheme === "dark" ? "#1e1e1e" : "#fff";
  const fg = resolvedTheme === "dark" ? "#d4d4d4" : "#1e1e1e";

  // Save handler, now using slugInput as file name
  const handleSave = useCallback(() => {
    const value = editorRef.current?.getValue();
    if (!value) return;
    startTransition(async () => {
      try {
        const { savePost } = await import("@/app/actions/editor/save-post");
        const safeSlug = slugify(slugInput);
        await savePost(safeSlug, value);
        // If editing and slug changed, delete old file
        if (
          mode === "edit" &&
          slugify(initialSlug.replace(/\.mdx$/i, "")) !== safeSlug
        ) {
          const { deletePost } = await import(
            "@/app/actions/editor/delete-post"
          );
          await deletePost(slugify(initialSlug.replace(/\.mdx$/i, "")));
        }
        // Update terminal history
        router.push(`/${postType}/${safeSlug}`);
        Promise.resolve().then(() => updateTerminalHistory(postType));
      } catch (err) {
        if (err instanceof Error && err.message === "SAVE_UNSUPPORTED_ENV") {
          setErrorDialog(true);
        } else {
          console.error("Failed to save post", err);
        }
      }
    });
  }, [slugInput, initialSlug, router, postType, mode]);

  // Delete uses slugInput as well, for edit mode
  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const { deletePost } = await import("@/app/actions/editor/delete-post");
      await deletePost(slugify(slugInput));
      router.push(`/${postType}`);
      Promise.resolve().then(() => updateTerminalHistory(postType));
    });
  }, [slugInput, router, postType]);

  const handleCancel = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/blog");
    }
  }, [router]);

  const handleMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;
      editor.focus();
      if (vimStatusElRef.current && vimStatusElRef.current.parentNode) {
        vimStatusElRef.current.parentNode.removeChild(vimStatusElRef.current);
      }
      const statusEl = document.createElement("div");
      statusEl.className = "vim-status-bar text-xs px-3 py-1 border-t";
      statusEl.style.background = bg;
      statusEl.style.color = fg;
      vimStatusElRef.current = statusEl;
      statusBarContainerRef.current?.appendChild(statusEl);

      import("monaco-vim").then((vim) => {
        vim.initVimMode(editor, statusEl);
      });

      const onKeyDown = (e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const isSave =
          (isMac && e.metaKey && e.key === "s") ||
          (!isMac && e.ctrlKey && e.key === "s");
        const isCancel = isMac && e.metaKey && e.key === "b";
        const isDelete = isMac && e.metaKey && e.key === "0";
        if (isSave) {
          e.preventDefault();
          handleSave();
        }
        if (isCancel) {
          e.preventDefault();
          handleCancel();
        }
        if (isDelete) {
          e.preventDefault();
          setOpenDialog(true);
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        if (vimStatusElRef.current && vimStatusElRef.current.parentNode) {
          vimStatusElRef.current.parentNode.removeChild(vimStatusElRef.current);
        }
      };
    },
    [bg, fg, handleSave, handleCancel]
  );

  useEffect(() => {
    if (vimStatusElRef.current) {
      vimStatusElRef.current.style.background = bg;
      vimStatusElRef.current.style.color = fg;
    }
  }, [bg, fg, resolvedTheme]);

  const content =
    mode === "edit" && initialCode
      ? initialCode
      : getInitialMDX(slugInput, postType);

  // Show a warning if slug is empty or invalid
  const slugWarning = !slugInput
    ? "File name (slug) cannot be empty"
    : /[^a-zA-Z0-9-]/.test(slugInput)
    ? "Slug should only contain letters, numbers, and hyphens"
    : "";

  return (
    <div className="flex flex-col h-full w-full min-h-0 flex-1 max-h-screen editor-theme bg-[var(--editor-background)]">
      {/* Slug/File name input */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
        <label htmlFor="slugInput" className="font-medium text-sm">
          Slug:
        </label>
        <input
          id="slugInput"
          type="text"
          className="border rounded px-2 py-1 text-sm flex-1"
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value.replace(/\.mdx$/i, ""))}
          placeholder="my-file"
          pattern="[a-zA-Z0-9-]+"
          required
        />
        <span className="ml-1 text-muted-foreground text-xs">.mdx</span>
      </div>
      {slugWarning && (
        <div className="text-xs text-red-500 px-6 pb-1">{slugWarning}</div>
      )}
      {/* Editor area grows, never overflows siblings below */}
      <div className="flex-1 editor-theme bg-[var(--editor-background)] py-1">
        <Editor
          defaultLanguage="mdx"
          value={content}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            wordWrap: "on",
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          className="pt-4"
        />
      </div>
      {/* Vim status bar stays visible */}
      <div ref={statusBarContainerRef} className="h-6" />
      {/* Controls: always visible, never overflow */}
      <div className="py-4 px-6 border-t flex justify-between gap-2 editor-theme bg-[var(--editor-background)]">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        {mode === "edit" && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="text-sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                Are you sure you want to delete this post?
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Yes, delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Button onClick={handleSave} disabled={isPending || !!slugWarning}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      {/* Shortcuts help: always visible */}
      <div className="text-xs text-muted-foreground px-4 py-2 border-t editor-theme bg-[var(--editor-background)]">
        ⌘+S to Save &nbsp;|&nbsp; ⌘+⌥+C to Cancel
      </div>
      {/* Error dialog */}
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent>
          <DialogHeader>
            Saving is only supported in development mode.
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This editor writes directly to the filesystem, which is not possible
            in production environments (like Vercel, Netlify, etc).
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorDialog(false)}>
              Close
            </Button>
            <Button onClick={() => router.push("/docs/editor-usage")}>
              Learn More
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
