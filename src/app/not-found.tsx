// app/not-found.tsx (or src/app/not-found.tsx)
"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="
        flex flex-col items-center justify-center 
        px-4 py-24
        bg-background text-foreground font-mono
        transition-colors
      "
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        className="
          rounded-xl shadow-xl p-8 sm:p-12 border
          bg-card text-card-foreground
          max-w-lg w-full text-center
          flex flex-col items-center
          gap-6
        "
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
          color: "var(--card-foreground)",
        }}
      >
        <div className="text-5xl font-extrabold tracking-tight mb-2 text-primary">
          404
        </div>
        <h1 className="text-2xl font-semibold mb-1 text-primary">
          Page Not Found
        </h1>
        <p className="mb-4 text-foreground">
          Oops! We couldn&apos;t find what you were looking for.
        </p>
        <code className="px-3 py-2 rounded bg-[var(--code-bg)] text-[var(--code-text)] text-base mb-2">
          /not-found
        </code>
        <Link
          href="/"
          className="
            mt-2 inline-block rounded-lg border px-4 py-2 font-mono font-semibold
            transition-colors border-[var(--code-border)] 
            bg-[var(--code-bg)] text-[var(--code-text)]
            hover:bg-[var(--code-header-bg)] hover:text-[var(--primary)]
          "
        >
          ← Go back home
        </Link>
      </div>
    </main>
  );
}
