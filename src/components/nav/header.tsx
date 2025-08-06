//src/components/nav/header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav: { label: string; href: string }[] = [
  // { label: "About", href: "/about" },
  // { label: "Blog", href: "/blog" },
  // { label: "Projects", href: "/projects" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 z-40 bg-background w-full h-32 pt-6 px-4 sm:px-24">
      <div className="flex flex-row items-baseline gap-4 pt-6">
        <Link href="/">
          <h2
            className={`text-5xl font-black pl-4 sm:pl-16 pr-4 font-sans ${
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Ledger AI
          </h2>
        </Link>

        <nav className="flex-row items-baseline gap-4 text-muted-foreground hidden sm:flex">
          {nav.map(({ label, href }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "font-bold hover:text-foreground text-foreground"
                    : "font-normal hover:text-foreground transition"
                }
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
