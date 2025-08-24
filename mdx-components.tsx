//mdx-components.tsx
import type { MDXComponents } from "mdx/types";
import React from "react";
import Image from "next/image";
import Code from "@/components/code/code";
import InlineCode from "@/components/code/inline-code";
import Pre from "@/components/code/pre";
import YouTube from "@/components/mdx/youtube";
import CustomLink from "@/components/mdx/custom-link";
import PopularPosts from "@/components/posts/popular-posts";
import { Button } from "@/components/ui/button";
import { IFrame } from "@/components/mdx/iframe";
import { CustomAlert } from "@/components/alerts/custom-alert";
import {
  EntryCard,
  EntryListItem,
  ResponsiveEntryItem,
} from "@/components/terminal/ledger-entry-components";
import { MobileEntryCard } from "@/components/ledger/mobile-entry-card";

function MDXImage(props: React.ComponentProps<typeof Image>) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image {...props} className={(props.className ?? "") + " mb-6"} />
  );
}

export function getMDXComponents(overrides: MDXComponents = {}): MDXComponents {
  return {
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-accent" {...props}>
        {children}
      </strong>
    ),
    hr: (props) => <hr className="my-6" {...props} />,
    h1: ({ children, ...props }) => (
      <h1
        className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 text-primary"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-lg md:text-xl font-semibold mb-4 text-primary"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-base md:text-lg font-semibold mb-4 text-primary"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-6 text-foreground" {...props}>
        {children}
      </p>
    ),
    a: ({ children, href = "", ...rest }) => (
      <CustomLink href={href} {...rest}>
        <span className="dark:text-primary text-primary decoration-primary hover:underline hover:decoration-primary">
          {children}
        </span>
      </CustomLink>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="mb-6 list-disc list-inside marker:text-[var(--list-bullet)] text-foreground space-y-2"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="mb-6 list-decimal list-inside marker:text-[var(--list-bullet)] text-foreground space-y-2"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-foreground" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 pl-4 py-2 my-6 bg-[var(--muted)] border-[var(--blockquote-border)] text-[var(--blockquote-text)] italic"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...rest }) => {
      if (className) {
        return (
          <Code className={className} {...rest}>
            {children}
          </Code>
        );
      }
      return <InlineCode>{children}</InlineCode>;
    },
    pre: ({ children, ...rest }) => <Pre {...rest}>{children}</Pre>,
    img: (props) => {
      const width = props.width ? Number(props.width) : 800;
      const height = props.height ? Number(props.height) : 500;
      return (
        <Image
          {...props}
          className={
            "rounded border border-[var(--border)] my-6 mb-8 " +
            (props.className ?? "")
          }
          alt={props.alt || ""}
          width={width}
          height={height}
          sizes={props.sizes || "100vw"}
          unoptimized={props.src?.startsWith("http") ? true : undefined}
        />
      );
    },
    Image: MDXImage,
    table: (props) => (
      <table
        className="border-collapse w-full table-auto font-mono border border-[var(--border)] mb-6 bg-transparent"
        {...props}
      />
    ),
    thead: (props) => (
      <thead
        className="border-b border-[var(--border)] bg-[var(--primary-bg)]"
        {...props}
      />
    ),
    tbody: (props) => <tbody className="bg-transparent" {...props} />,
    tr: (props) => (
      <tr
        className="even:bg-transparent odd:bg-transparent border-b border-[var(--border)] last:border-none"
        {...props}
      />
    ),
    th: (props) => (
      <th
        className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 font-normal text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-bg)] text-left whitespace-nowrap"
        {...props}
      />
    ),
    td: (props) => (
      <td
        className="px-2 py-1 border-r border-[var(--border)] last:border-r-0 text-[var(--foreground)] font-mono bg-transparent whitespace-nowrap align-top"
        {...props}
      />
    ),
    aside: (props) => (
      <aside className="text-sm text-gray-500 pb-4" {...props} />
    ),
    figure: (props) => <figure className="my-6" {...props} />,
    figcaption: (props) => (
      <figcaption className="text-sm text-gray-500 pb-4" {...props} />
    ),
    YouTube,
    PopularPosts,
    IFrame,
    Button: (props) => (
      <div className="pb-4">
        <Button {...props} className="" />
      </div>
    ),
    "custom-alert": ({ message }) => <CustomAlert message={message} />,
    // NEW: Ledger entry components (lowercase for MDX)
    "entry-card": EntryCard,
    "entry-list-item": EntryListItem,
    "responsive-entry-item": ResponsiveEntryItem,
    "mobile-entry-card": MobileEntryCard,
    ...overrides,
  };
}

export function useMDXComponents(): MDXComponents {
  return getMDXComponents();
}
