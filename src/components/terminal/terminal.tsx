// src/components/terminal/terminal.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import TerminalOutputRenderer from "./terminal-output-renderer";
import { TerminalOutputRendererProps } from "@/types/terminal";
import type { CommandMeta } from "@/commands/utils";
import { usePathname } from "next/navigation";
import TerminalImageUpload from "./terminal-image-upload";

export type TerminalProps = {
  storageKey?: string;
  maxHistory?: number;
  commands?: Record<string, CommandMeta>;
  welcome?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  autoScrollOnInit?: boolean;
  onCommand?: (
    cmd: string,
    setHistory: React.Dispatch<
      React.SetStateAction<TerminalOutputRendererProps[]>
    >,
    history: TerminalOutputRendererProps[]
  ) => boolean | void | Promise<boolean | void>;
  onPopulateInput?: (cmd: string) => void;
};

function useScrollShortcuts(inputRef: React.RefObject<HTMLTextAreaElement>) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement === inputRef.current) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          window.scrollBy({ top: 600, behavior: "smooth" });
          break;
        case "ArrowUp":
          e.preventDefault();
          window.scrollBy({ top: -600, behavior: "smooth" });
          break;
        case "PageDown":
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
          break;
        case "PageUp":
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
          break;
        case "Home":
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "End":
          e.preventDefault();
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);
}

function useTerminalHistory(
  storageKey: string,
  maxHistory: number,
  welcome?: string
) {
  const [initialized, setInitialized] = useState(false);
  const [history, setHistory] = useState<TerminalOutputRendererProps[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch {
        if (welcome)
          setHistory([
            { type: "output", content: welcome, format: "markdown" },
          ]);
      }
    } else if (welcome) {
      setHistory([{ type: "output", content: welcome, format: "markdown" }]);
    }
    setInitialized(true);
  }, [storageKey, welcome]);

  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      localStorage.setItem(
        storageKey,
        JSON.stringify(history.slice(-maxHistory))
      );
    }
  }, [history, storageKey, maxHistory, initialized]);

  return {
    history,
    setHistory,
    initialized,
  };
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

const MemoizedTerminalOutputRenderer = React.memo(TerminalOutputRenderer);

function renderHistoryLines(history: TerminalOutputRendererProps[]) {
  return history.map((h, i) => {
    const isPrevInput =
      i > 0 && history[i - 1].type === "input" && h.type !== "input";

    return (
      <React.Fragment key={i}>
        {isPrevInput && <div className="h-2" />}
        {h.type === "input" ? (
          <div className="text-primary font-medium">{h.content}</div>
        ) : (
          <MemoizedTerminalOutputRenderer
            content={h.content}
            format={h.format ?? "plain"}
            className={h.type === "error" ? "text-red-400" : "text-neutral-100"}
            type="input"
          />
        )}
      </React.Fragment>
    );
  });
}

const silentCommands = new Set(["top"]);

export default function Terminal({
  storageKey = "my_terminal_history",
  maxHistory = 200,
  welcome,
  onCommand,
  onPopulateInput,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const justEscapedRef = useRef(false);
  const didInitialFocus = useRef(false);
  const didInitialRestore = useRef(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const lastCommandRef = useRef<string | null>(null);
  const didFirstMount = useRef(true);

  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const skipScrollOnNav = useRef(false);
  const suppressNextScrollRef = useRef(false);

  const { history, setHistory, initialized } = useTerminalHistory(
    storageKey,
    maxHistory,
    welcome
  );

  // All useCallback hooks at top level
  const populateInput = useCallback((cmd: string) => {
    setInput(cmd);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, []);

  const clearInput = useCallback(() => {
    setInput("");
    inputRef.current?.focus();
  }, []);

  const submitInput = useCallback(async () => {
    if (!input.trim()) return;
    const command = input;
    setInput(""); // Clear immediately
    lastCommandRef.current = command;
    await onCommand?.(command, setHistory, history);
  }, [input, onCommand, setHistory, history]);

  const handleOutputClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "A") {
      suppressNextScrollRef.current = true;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    const DRAG_THRESHOLD = 5;
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      inputRef.current?.focus();
    }
    mouseDownPos.current = null;
  }, []);

  useScrollShortcuts(inputRef as React.RefObject<HTMLTextAreaElement>);

  useEffect(() => {
    if (!initialized) return;
    if (didFirstMount.current) {
      didFirstMount.current = false;
      return;
    }
    if (suppressNextScrollRef.current) {
      suppressNextScrollRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, [history, initialized]);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      skipScrollOnNav.current = true;
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!initialized) return;
    if (!didInitialRestore.current) {
      didInitialRestore.current = true;
      justEscapedRef.current = false;
      return;
    }
    if (justEscapedRef.current) {
      justEscapedRef.current = false;
      return;
    }
    if (
      lastCommandRef.current &&
      silentCommands.has(lastCommandRef.current.toLowerCase())
    ) {
      lastCommandRef.current = null;
      return;
    }
    const timeout = setTimeout(() => {
      if (!skipScrollOnNav.current) {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        inputRef.current?.focus();
      } else {
        skipScrollOnNav.current = false;
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [history, initialized]);

  useEffect(() => {
    if (!initialized || didInitialFocus.current) return;
    inputRef.current?.focus({ preventScroll: true });
    didInitialFocus.current = true;
  }, [initialized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => resizeTextarea(inputRef.current), [input]);

  if (!initialized) return null;

  return (
    <div
      className="p-0 font-mono mx-auto flex flex-col h-full w-full"
      tabIndex={-1}
      style={{ outline: "none" }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-3 flex flex-col scrollbar-hide"
        style={{ minHeight: 0 }}
        onClick={handleOutputClick}
      >
        {history.length > 200 && (
          <div className="text-xs text-neutral-500 italic mb-2">
            ...History truncated ({history.length - 200} lines hidden)...
          </div>
        )}
        {renderHistoryLines(history.slice(-200))}
        <div ref={bottomRef} />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await submitInput();
          }}
          className="flex flex-col gap-2 mt-2 mb-8"
        >
          <div className="flex items-center gap-2">
            <span className="text-primary select-none hidden sm:block">$</span>
            <Textarea
              ref={inputRef}
              value={input}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="text"
              spellCheck={false}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  await submitInput();
                } else if (e.key === "Escape") {
                  justEscapedRef.current = false;
                  inputRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  inputRef.current?.focus();
                }
              }}
              className="flex-1 bg-transparent px-0 py-2 outline-none focus:ring-0 font-mono !text-lg md:!text-base autofill:bg-transparent sm:pl-2 h-auto sm:min-h-28 resize-none border-none"
              style={{
                minHeight: 32,
                boxShadow: "none",
                backgroundColor: "transparent",
              }}
              placeholder="Type a command..."
            />
          </div>

          <div className="pt-2">
            {input.trim() ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearInput}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-background hover:bg-accent transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <span>✕</span>
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <span>→</span>
                  <span>Submit</span>
                </button>
              </div>
            ) : (
              <TerminalImageUpload
                onPopulateInput={onPopulateInput || populateInput}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
